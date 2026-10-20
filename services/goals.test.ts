import { describe, expect, it, vi } from "vitest"

import { ApiClient, type AuthTokens, type TokenStorage } from "./api"
import {
  createGoalsService,
  getGoalTimelineLabel,
  isValidDateValue
} from "./goals"

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
  it("maps timeline values to friendly labels and tolerates unknown ones", () => {
    expect(getGoalTimelineLabel("short_term")).toBe("Short-term")
    expect(getGoalTimelineLabel("mid_term")).toBe("Mid-term")
    expect(getGoalTimelineLabel("long_term")).toBe("Long-term")
    expect(getGoalTimelineLabel(undefined)).toBeUndefined()
    expect(getGoalTimelineLabel("other")).toBeUndefined()
  })

  it("validates date-only start dates", () => {
    expect(isValidDateValue("2026-10-20")).toBe(true)
    expect(isValidDateValue("2026-02-30")).toBe(false)
    expect(isValidDateValue("")).toBe(false)
    expect(isValidDateValue("2026-10-20T00:00:00Z")).toBe(false)
  })

  it("sends start_date on create and update and keeps it in responses", async () => {
    const fetchMock = vi.fn(
      async (_input: RequestInfo | URL, init?: RequestInit) =>
        response({ id: 1, ...JSON.parse(String(init?.body)) })
    )
    const service = createGoalsService(
      new ApiClient(
        "http://127.0.0.1:8000",
        new MemoryTokenStorage(),
        fetchMock as unknown as typeof fetch
      )
    )
    const payload = {
      title: "Plan",
      start_date: "2026-11-02",
      due_date: null,
      timeline: "mid_term" as const,
      motivation: "Stay focused"
    }

    await expect(service.create(payload)).resolves.toMatchObject({
      start_date: "2026-11-02",
      due_date: null,
      timeline: "mid_term",
      motivation: "Stay focused"
    })
    await expect(
      service.update(1, { ...payload, start_date: "2026-11-03" })
    ).resolves.toMatchObject({ start_date: "2026-11-03" })
    expect(JSON.parse(String(fetchMock.mock.calls[1][1]?.body))).toMatchObject({
      start_date: "2026-11-03",
      timeline: "mid_term",
      motivation: "Stay focused"
    })
  })

  it("lists the authenticated user's goals without modifying them", async () => {
    const goals = [
      {
        id: 8,
        title: "Ship the project",
        start_date: "2026-10-01",
        due_date: "2026-12-01"
      },
      {
        id: 9,
        title: "Plan next quarter",
        start_date: "2026-10-05",
        due_date: null
      },
      { id: 10, title: "Keep learning", start_date: "2026-10-20" }
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
      start_date: "2026-10-20",
      due_date: "2026-12-01",
      timeline: "long_term" as const,
      motivation: "It matters",
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
      start_date: savedGoal.start_date,
      due_date: savedGoal.due_date,
      timeline: savedGoal.timeline,
      motivation: savedGoal.motivation
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
