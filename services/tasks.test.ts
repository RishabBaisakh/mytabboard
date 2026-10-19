import { describe, expect, it, vi } from "vitest"

import { ApiClient, type AuthTokens, type TokenStorage } from "./api"
import { createTasksService, type Task, type TaskWriteFields } from "./tasks"

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
  return new Response(status === 204 ? null : JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" }
  })
}

describe("tasks service", () => {
  it("uses authenticated endpoints and typed payloads for task CRUD", async () => {
    const taskId = "2a9d9d63-7dc6-4f71-b7b2-9c8921fb4fc0"
    const task: Task = {
      id: taskId,
      user: 42,
      title: "Prepare release",
      description: "Review the launch checklist",
      status: "todo",
      priority: "high",
      goal: 8,
      scheduled_start: "2026-11-02T09:00:00-05:00",
      scheduled_end: "2026-11-02T10:00:00-05:00",
      completed_at: null,
      created_at: "2026-10-18T12:00:00Z",
      updated_at: "2026-10-18T12:00:00Z"
    }
    const createPayload: TaskWriteFields = {
      title: task.title,
      description: task.description,
      status: task.status,
      priority: task.priority,
      goal: task.goal,
      scheduled_start: task.scheduled_start,
      scheduled_end: task.scheduled_end
    }
    const patchPayload = {
      status: "in_progress" as const,
      scheduled_start: "2026-11-02T09:30:00-05:00"
    }
    const calls: Array<{ url: string; method: string; body?: unknown }> = []
    const fetchMock = vi.fn(
      async (input: RequestInfo | URL, init?: RequestInit) => {
        const url = String(input)
        const method = init?.method ?? "GET"
        calls.push({
          url,
          method,
          body: init?.body ? JSON.parse(String(init.body)) : undefined
        })

        if (method === "DELETE") return response(undefined, 204)
        if (method === "PATCH") return response({ ...task, ...patchPayload })
        if (method === "PUT") return response(task)
        if (method === "POST") return response(task, 201)
        if (url.endsWith("/api/v1/tasks/")) return response([task])
        return response(task)
      }
    )
    const api = new ApiClient(
      "http://127.0.0.1:8000",
      new MemoryTokenStorage(),
      fetchMock as unknown as typeof fetch
    )
    const service = createTasksService(api)

    await expect(service.list()).resolves.toEqual([task])
    await expect(service.create(createPayload)).resolves.toEqual(task)
    await expect(service.get(taskId)).resolves.toEqual(task)
    await expect(service.replace(taskId, createPayload)).resolves.toEqual(task)
    await expect(service.update(taskId, patchPayload)).resolves.toMatchObject(
      patchPayload
    )
    await expect(service.delete(taskId)).resolves.toBeUndefined()

    expect(calls.map(({ method }) => method)).toEqual([
      "GET",
      "POST",
      "GET",
      "PUT",
      "PATCH",
      "DELETE"
    ])
    expect(calls.map(({ url }) => url)).toEqual([
      "http://127.0.0.1:8000/api/v1/tasks/",
      "http://127.0.0.1:8000/api/v1/tasks/",
      `http://127.0.0.1:8000/api/v1/tasks/${taskId}/`,
      `http://127.0.0.1:8000/api/v1/tasks/${taskId}/`,
      `http://127.0.0.1:8000/api/v1/tasks/${taskId}/`,
      `http://127.0.0.1:8000/api/v1/tasks/${taskId}/`
    ])
    for (const [, init] of fetchMock.mock.calls) {
      expect(new Headers(init?.headers).get("Authorization")).toBe(
        "Bearer test-access"
      )
    }
    expect(calls[1].body).toEqual(createPayload)
    expect(calls[3].body).toEqual(createPayload)
    expect(calls[4].body).toEqual(patchPayload)
  })
})
