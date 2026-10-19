import { describe, expect, it, vi } from "vitest"

import { ApiClient, type AuthTokens, type TokenStorage } from "./api"
import { createGoalsService } from "./goals"

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

function response(data: unknown) {
  return new Response(JSON.stringify(data), {
    status: 200,
    headers: { "Content-Type": "application/json" }
  })
}

describe("goals service", () => {
  it("lists the authenticated user's goals without modifying them", async () => {
    const goals = [
      { id: 8, title: "Ship the project", due_date: "2026-12-01" },
      { id: 9, title: "Plan next quarter", due_date: null },
      { id: 10, title: "Keep learning" }
    ]
    const fetchMock = vi.fn(
      async (_input: RequestInfo | URL, _init?: RequestInit) => response(goals)
    )
    const api = new ApiClient(
      "http://127.0.0.1:8000",
      new MemoryTokenStorage(),
      fetchMock as unknown as typeof fetch
    )
    const service = createGoalsService(api)

    await expect(service.list()).resolves.toEqual(goals)
    expect(fetchMock).toHaveBeenCalledOnce()
    expect(fetchMock).toHaveBeenCalledWith(
      "http://127.0.0.1:8000/api/v1/goals/",
      expect.objectContaining({
        method: "GET",
        headers: expect.any(Headers)
      })
    )
    const [, init] = fetchMock.mock.calls[0]
    expect(new Headers(init?.headers).get("Authorization")).toBe(
      "Bearer test-access"
    )
  })

  it("creates and updates goals through authenticated write endpoints", async () => {
    const savedGoal = {
      id: 15,
      title: "Ship the project",
      description: "Finish the first release",
      due_date: "2026-12-01",
      status: "active" as const
    }
    const fetchMock = vi.fn(
      async (_input: RequestInfo | URL, _init?: RequestInit) =>
        response(savedGoal)
    )
    const api = new ApiClient(
      "http://127.0.0.1:8000",
      new MemoryTokenStorage(),
      fetchMock as unknown as typeof fetch
    )
    const service = createGoalsService(api)
    const payload = {
      title: savedGoal.title,
      description: savedGoal.description,
      due_date: savedGoal.due_date
    }

    await expect(service.create(payload)).resolves.toEqual(savedGoal)
    await expect(service.update(savedGoal.id, payload)).resolves.toEqual(
      savedGoal
    )

    expect(fetchMock.mock.calls.map(([, init]) => init?.method)).toEqual([
      "POST",
      "PATCH"
    ])
    expect(JSON.parse(String(fetchMock.mock.calls[0][1]?.body))).toEqual(
      payload
    )
    expect(JSON.parse(String(fetchMock.mock.calls[1][1]?.body))).toEqual(
      payload
    )
    expect(fetchMock.mock.calls.map(([url]) => String(url))).toEqual([
      "http://127.0.0.1:8000/api/v1/goals/",
      "http://127.0.0.1:8000/api/v1/goals/15/"
    ])
    for (const [, init] of fetchMock.mock.calls) {
      expect(new Headers(init?.headers).get("Authorization")).toBe(
        "Bearer test-access"
      )
    }
  })
})
