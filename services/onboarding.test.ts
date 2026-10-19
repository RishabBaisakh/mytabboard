import { describe, expect, it, vi } from "vitest"

import { ApiClient, type AuthTokens, type TokenStorage } from "./api"
import { createOnboardingService } from "./onboarding"
import type { OnboardingData } from "./onboardingTypes"

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

function apiOnboardingData() {
  return {
    is_complete: false,
    onboarding_completed_at: null,
    profile: { display_name: "", bio: "", time_zone: "UTC" },
    basic_info: {
      questions: [
        {
          id: 101,
          key: "top_goals",
          text: "What are your top goals?",
          selection_type: "multiple",
          max_selections: 3,
          is_required: true,
          options: [{ id: 11, key: "learn", label: "Learn" }],
          selected_option_ids: [11]
        }
      ]
    },
    interests: {
      options: [{ id: 201, key: "technology", name: "Technology" }],
      selected_ids: [201]
    },
    personality_tags: {
      options: [{ id: 301, key: "curious", name: "Curious" }],
      selected_ids: [301]
    }
  }
}

describe("onboarding service", () => {
  it("loads all three sections once and restores saved selections", async () => {
    const fetchMock = vi.fn(
      async (_input: RequestInfo | URL, _init?: RequestInit) =>
        response(apiOnboardingData())
    )
    const fetcher = fetchMock as unknown as typeof fetch
    const api = new ApiClient(
      "http://127.0.0.1:8000",
      new MemoryTokenStorage(),
      fetcher
    )
    const service = createOnboardingService(api)

    const loaded = await service.load()
    const resumed = await service.load()

    expect(fetcher).toHaveBeenCalledTimes(1)
    expect(fetcher).toHaveBeenCalledWith(
      "http://127.0.0.1:8000/api/onboarding/",
      expect.objectContaining({ method: "GET" })
    )
    expect(
      new Headers(fetchMock.mock.calls[0][1]?.headers).get("Authorization")
    ).toBe("Bearer test-access")
    expect(loaded.questions[0].selected_option_ids).toEqual([11])
    expect(loaded.interests.selected_ids).toEqual([201])
    expect(loaded.personality_tags.selected_ids).toEqual([301])
    expect(loaded.interests.options[0].label).toBe("Technology")
    expect(resumed).toBe(loaded)
  })

  it("uses the lightweight status endpoint", async () => {
    const fetcher = vi.fn(async () =>
      response({ is_complete: false })
    ) as unknown as typeof fetch
    const service = createOnboardingService(
      new ApiClient("http://127.0.0.1:8000", new MemoryTokenStorage(), fetcher)
    )

    await expect(service.status()).resolves.toEqual({ is_complete: false })
    expect(fetcher).toHaveBeenCalledWith(
      "http://127.0.0.1:8000/api/onboarding/status/",
      expect.objectContaining({ method: "GET" })
    )
  })

  it("patches basic profile fields without unsupported question answers", async () => {
    const saved = {
      step: "basic_info",
      saved: {
        profile: {
          display_name: "Alex",
          bio: "Building tools",
          time_zone: "America/Toronto"
        },
        answers: [{ question_id: 101, selected_option_ids: [11] }]
      },
      is_complete: false,
      onboarding_completed_at: null
    }
    const fetcher = vi.fn(
      async (_input: RequestInfo | URL, init?: RequestInit) =>
        init?.method === "PATCH"
          ? response(saved)
          : response(apiOnboardingData())
    ) as unknown as typeof fetch
    const service = createOnboardingService(
      new ApiClient("http://127.0.0.1:8000", new MemoryTokenStorage(), fetcher)
    )
    await service.load()

    const updated = await service.saveStep({
      step: "basic_info",
      display_name: "Alex",
      bio: "Building tools",
      time_zone: "America/Toronto"
    })

    expect(fetcher).toHaveBeenLastCalledWith(
      "http://127.0.0.1:8000/api/onboarding/",
      expect.objectContaining({
        method: "PATCH",
        body: JSON.stringify({
          step: "basic_info",
          display_name: "Alex",
          bio: "Building tools",
          time_zone: "America/Toronto"
        })
      })
    )
    expect(updated.profile.display_name).toBe("Alex")
    expect(updated.questions[0].selected_option_ids).toEqual([11])
    expect(updated.is_complete).toBe(false)
  })

  it("patches interests without imposing a client-side selection cap", async () => {
    const selectedIds = [201, 202, 203, 204, 205, 206]
    const fetcher = vi.fn(
      async (_input: RequestInfo | URL, init?: RequestInit) =>
        init?.method === "PATCH"
          ? response({
              step: "interests",
              saved: { selected_ids: selectedIds },
              is_complete: false,
              onboarding_completed_at: null
            })
          : response(apiOnboardingData())
    ) as unknown as typeof fetch
    const service = createOnboardingService(
      new ApiClient("http://127.0.0.1:8000", new MemoryTokenStorage(), fetcher)
    )
    await service.load()

    const updated = await service.saveStep({
      step: "interests",
      selected_ids: selectedIds
    })

    expect(updated.interests.selected_ids).toEqual(selectedIds)
    expect(fetcher).toHaveBeenLastCalledWith(
      "http://127.0.0.1:8000/api/onboarding/",
      expect.objectContaining({
        method: "PATCH",
        body: JSON.stringify({ step: "interests", selected_ids: selectedIds })
      })
    )
  })

  it("patches personality tags and honors backend completion", async () => {
    const completedAt = "2026-10-18T12:00:00Z"
    const fetcher = vi.fn(
      async (_input: RequestInfo | URL, init?: RequestInit) =>
        init?.method === "PATCH"
          ? response({
              step: "personality_tags",
              saved: { selected_ids: [301, 302, 303, 304] },
              is_complete: true,
              onboarding_completed_at: completedAt
            })
          : response(apiOnboardingData())
    ) as unknown as typeof fetch
    const service = createOnboardingService(
      new ApiClient("http://127.0.0.1:8000", new MemoryTokenStorage(), fetcher)
    )
    await service.load()

    const updated = await service.saveStep({
      step: "personality_tags",
      selected_ids: [301, 302, 303, 304]
    })

    expect(updated.personality_tags.selected_ids).toEqual([301, 302, 303, 304])
    expect(updated.is_complete).toBe(true)
    expect(updated.onboarding_completed_at).toBe(completedAt)
  })

  it("preserves onboarding state when the backend returns validation errors", async () => {
    const fetcher = vi.fn(
      async (_input: RequestInfo | URL, init?: RequestInit) =>
        init?.method === "PATCH"
          ? response(
              { errors: { selected_ids: ["Choose at least one interest."] } },
              400
            )
          : response(apiOnboardingData())
    ) as unknown as typeof fetch
    const service = createOnboardingService(
      new ApiClient("http://127.0.0.1:8000", new MemoryTokenStorage(), fetcher)
    )

    const before = await service.load()
    await expect(
      service.saveStep({ step: "interests", selected_ids: [] })
    ).rejects.toMatchObject({ status: 400 })

    expect((await service.load()).interests.selected_ids).toEqual(
      before.interests.selected_ids
    )
  })
})
