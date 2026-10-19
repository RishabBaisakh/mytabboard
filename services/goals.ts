import type { ApiClient } from "./api"
import { apiClient } from "./apiClient"

export type Goal = {
  id: number
  title: string
  due_date?: string | null
  description?: string
  status?: "active" | "completed" | "archived"
}

export type GoalWritePayload = {
  title: string
  description?: string
  due_date?: string | null
}

export function createGoalsService(api: Pick<ApiClient, "request">) {
  return {
    list(): Promise<Goal[]> {
      return api.request<Goal[]>("/api/v1/goals/", {
        authenticated: true
      })
    },

    create(payload: GoalWritePayload): Promise<Goal> {
      return api.request<Goal>("/api/v1/goals/", {
        method: "POST",
        body: payload,
        authenticated: true
      })
    },

    update(id: number, payload: GoalWritePayload): Promise<Goal> {
      return api.request<Goal>(`/api/v1/goals/${id}/`, {
        method: "PATCH",
        body: payload,
        authenticated: true
      })
    }
  }
}

export const goalsService = createGoalsService(apiClient)
