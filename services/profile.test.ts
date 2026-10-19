import { describe, expect, it, vi } from "vitest"

import { ApiClient, type AuthTokens, type TokenStorage } from "./api"
import { createProfileService, type ProfileFields } from "./profile"

class MemoryTokenStorage implements TokenStorage {
  tokens: AuthTokens | null = {
    access: "test-access",
    refresh: "test-refresh"
  }

  async getTokens() {
    return this.tokens
  }

  async setTokens(tokens: AuthTokens) {
    this.tokens = tokens
  }

  async clearTokens() {
    this.tokens = null
  }
}

function response(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" }
  })
}

function createService(fetcher: typeof fetch) {
  return createProfileService(
    new ApiClient("http://127.0.0.1:8000", new MemoryTokenStorage(), fetcher)
  )
}

describe("profile service", () => {
  it("loads profile IDs and only the interest and personality option catalogs", async () => {
    const fetchMock = vi.fn(
      async (input: RequestInfo | URL, _init?: RequestInit) => {
        if (String(input).endsWith("/api/auth/profile/")) {
          return response({
            display_name: "Rishab",
            bio: "Building thoughtful tools",
            time_zone: "America/Toronto",
            interests: [12],
            personality_tags: [24]
          })
        }
        return response({
          basic_info: { questions: [{ id: 999, text: "Must not be used" }] },
          interests: {
            options: [{ id: 12, key: "design", name: "Design" }],
            selected_ids: [999]
          },
          personality_tags: {
            options: [{ id: 24, key: "curious", label: "Curious" }],
            selected_ids: [999]
          }
        })
      }
    )
    const service = createService(fetchMock as unknown as typeof fetch)

    const loaded = await service.load()

    expect(loaded.profile).toEqual({
      display_name: "Rishab",
      bio: "Building thoughtful tools",
      time_zone: "America/Toronto",
      interests: [12],
      personality_tags: [24]
    })
    expect(loaded.options).toEqual({
      interests: [{ id: 12, key: "design", label: "Design" }],
      personality_tags: [{ id: 24, key: "curious", label: "Curious" }]
    })
    expect(fetchMock).toHaveBeenCalledTimes(2)
    for (const [, init] of fetchMock.mock.calls) {
      expect(new Headers(init?.headers).get("Authorization")).toBe(
        "Bearer test-access"
      )
    }
  })

  it("saves profile fields and selected option IDs without questionnaire answers", async () => {
    const updatedProfile: ProfileFields = {
      display_name: "Rishab B",
      bio: "Building thoughtful tools",
      time_zone: "America/Toronto",
      interests: [12, 13],
      personality_tags: [24, 25]
    }
    const fetchMock = vi.fn(
      async (_input: RequestInfo | URL, _init?: RequestInit) =>
        response(updatedProfile)
    )
    const service = createService(fetchMock as unknown as typeof fetch)

    await expect(service.save(updatedProfile)).resolves.toEqual(updatedProfile)

    expect(fetchMock).toHaveBeenCalledWith(
      "http://127.0.0.1:8000/api/auth/profile/",
      expect.objectContaining({
        method: "PATCH",
        body: JSON.stringify(updatedProfile),
        headers: expect.any(Headers)
      })
    )
    const [, init] = fetchMock.mock.calls[0]
    expect(new Headers(init?.headers).get("Authorization")).toBe(
      "Bearer test-access"
    )
    expect(JSON.parse(String(init?.body))).not.toHaveProperty("answers")
  })
})
