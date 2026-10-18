import { describe, expect, it, vi } from "vitest"

import { ApiClient, type AuthTokens, type TokenStorage } from "./api"
import { createAuthService } from "./auth"

class MemoryTokenStorage implements TokenStorage {
  tokens: AuthTokens | null = null

  async getTokens() {
    return this.tokens
  }

  async setTokens(tokens: AuthTokens) {
    this.tokens = { ...tokens }
  }

  async clearTokens() {
    this.tokens = null
  }
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" }
  })
}

function createFetchMock(
  handler: (url: string, init?: RequestInit) => Response | Promise<Response>
): typeof fetch {
  return vi.fn((input: RequestInfo | URL, init?: RequestInit) =>
    handler(String(input), init)
  ) as unknown as typeof fetch
}

function createTestAuth(
  fetcher: typeof fetch,
  storage = new MemoryTokenStorage(),
  googleAccessToken?: () => Promise<string>
) {
  const api = new ApiClient("http://127.0.0.1:8000", storage, fetcher)
  const auth = createAuthService(api, googleAccessToken)
  return { api, auth, storage }
}

describe("auth API", () => {
  it("registers with matching password fields and stores backend JWTs", async () => {
    const storage = new MemoryTokenStorage()
    const fetcher = createFetchMock(async (_url, init) => {
      expect(init?.method).toBe("POST")
      expect(JSON.parse(String(init?.body))).toEqual({
        username: "Taylor",
        email: "taylor@example.com",
        password1: "long-password",
        password2: "long-password"
      })
      return jsonResponse({
        access: "backend-access",
        refresh: "backend-refresh",
        user: { username: "Taylor" }
      })
    })
    const { auth } = createTestAuth(fetcher, storage)

    await expect(
      auth.signup({
        username: "Taylor",
        email: "taylor@example.com",
        password: "long-password"
      })
    ).resolves.toMatchObject({ user: { username: "Taylor" } })
    expect(storage.tokens).toEqual({
      access: "backend-access",
      refresh: "backend-refresh"
    })
  })

  it("logs in with email and password and persists backend tokens", async () => {
    const storage = new MemoryTokenStorage()
    const fetcher = createFetchMock(async (_url, init) => {
      expect(JSON.parse(String(init?.body))).toEqual({
        email: "taylor@example.com",
        password: "long-password"
      })
      return jsonResponse({ access: "login-access", refresh: "login-refresh" })
    })
    const { auth } = createTestAuth(fetcher, storage)

    await auth.login({ email: "taylor@example.com", password: "long-password" })

    expect(storage.tokens).toEqual({
      access: "login-access",
      refresh: "login-refresh"
    })
  })

  it("refreshes once, stores both rotated tokens, and retries with the new access token", async () => {
    const storage = new MemoryTokenStorage()
    storage.tokens = { access: "expired-access", refresh: "old-refresh" }
    const userHeaders: string[] = []
    const fetcher = createFetchMock(async (url, init) => {
      if (url.endsWith("/api/auth/user/")) {
        userHeaders.push(new Headers(init?.headers).get("Authorization") ?? "")
        return userHeaders.length === 1
          ? jsonResponse({ detail: "expired" }, 401)
          : jsonResponse({ id: 1 })
      }

      expect(JSON.parse(String(init?.body))).toEqual({ refresh: "old-refresh" })
      return jsonResponse({
        access: "rotated-access",
        refresh: "rotated-refresh"
      })
    })
    const { auth } = createTestAuth(fetcher, storage)

    await expect(auth.currentUser()).resolves.toEqual({ id: 1 })

    expect(userHeaders).toEqual([
      "Bearer expired-access",
      "Bearer rotated-access"
    ])
    expect(storage.tokens).toEqual({
      access: "rotated-access",
      refresh: "rotated-refresh"
    })
    expect(fetcher).toHaveBeenCalledTimes(3)
  })

  it("shares one refresh request across concurrent unauthorized requests", async () => {
    const storage = new MemoryTokenStorage()
    storage.tokens = { access: "expired-access", refresh: "old-refresh" }
    let refreshCalls = 0
    const fetcher = createFetchMock(async (url, init) => {
      if (url.includes("/api/auth/token/refresh/")) {
        refreshCalls += 1
        await Promise.resolve()
        return jsonResponse({ access: "new-access", refresh: "new-refresh" })
      }
      if (url.endsWith("/api/auth/user/")) {
        return new Headers(init?.headers).get("Authorization") ===
          "Bearer new-access"
          ? jsonResponse({ id: 1 })
          : jsonResponse({ detail: "expired" }, 401)
      }
      return jsonResponse({ id: 1 })
    })
    const { auth } = createTestAuth(fetcher, storage)

    await Promise.all([auth.currentUser(), auth.currentUser()])

    expect(refreshCalls).toBe(1)
    expect(storage.tokens).toEqual({
      access: "new-access",
      refresh: "new-refresh"
    })
  })

  it("clears tokens and does not retry when refresh fails", async () => {
    const storage = new MemoryTokenStorage()
    storage.tokens = { access: "expired-access", refresh: "expired-refresh" }
    const fetcher = createFetchMock(async (url) =>
      url.endsWith("/api/auth/user/")
        ? jsonResponse({ detail: "expired" }, 401)
        : jsonResponse({ detail: "invalid refresh" }, 401)
    )
    const { auth } = createTestAuth(fetcher, storage)

    await expect(auth.currentUser()).rejects.toThrow("session has expired")

    expect(storage.tokens).toBeNull()
    expect(fetcher).toHaveBeenCalledTimes(2)
  })

  it("clears tokens when logout fails for an expired access token", async () => {
    const storage = new MemoryTokenStorage()
    storage.tokens = { access: "expired-access", refresh: "refresh-token" }
    const fetcher = createFetchMock(async (url, init) => {
      expect(url).toContain("/api/auth/logout/")
      expect(new Headers(init?.headers).get("Authorization")).toBe(
        "Bearer expired-access"
      )
      expect(JSON.parse(String(init?.body))).toEqual({
        refresh: "refresh-token"
      })
      return jsonResponse({ detail: "expired" }, 401)
    })
    const { auth } = createTestAuth(fetcher, storage)

    await expect(auth.logout()).resolves.toBeUndefined()

    expect(storage.tokens).toBeNull()
    expect(fetcher).toHaveBeenCalledTimes(1)
  })

  it("exchanges a transient Google token without storing it as a session token", async () => {
    const storage = new MemoryTokenStorage()
    const getGoogleAccessToken = vi.fn(async () => "temporary-google-access")
    const fetcher = createFetchMock(async (_url, init) => {
      expect(JSON.parse(String(init?.body))).toEqual({
        access_token: "temporary-google-access"
      })
      return jsonResponse({
        access: "backend-access",
        refresh: "backend-refresh"
      })
    })
    const { auth } = createTestAuth(fetcher, storage, getGoogleAccessToken)

    await auth.loginWithGoogle()

    expect(getGoogleAccessToken).toHaveBeenCalledOnce()
    expect(storage.tokens).toEqual({
      access: "backend-access",
      refresh: "backend-refresh"
    })
    expect(storage.tokens?.access).not.toBe("temporary-google-access")
  })

  it("attaches the backend access token to current-user requests", async () => {
    const storage = new MemoryTokenStorage()
    storage.tokens = { access: "valid-access", refresh: "valid-refresh" }
    const fetcher = createFetchMock(async (_url, init) => {
      expect(new Headers(init?.headers).get("Authorization")).toBe(
        "Bearer valid-access"
      )
      return jsonResponse({ id: 7 })
    })
    const { auth } = createTestAuth(fetcher, storage)

    await expect(auth.currentUser()).resolves.toEqual({ id: 7 })
  })
})
