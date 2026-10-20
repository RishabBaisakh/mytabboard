import type { ApiClient } from "./api"
import { apiClient } from "./apiClient"
import type { Task } from "./tasks"

export type GoalStatus = "active" | "completed" | "archived"

export type Goal = {
  id: number
  title: string
  start_date: string
  due_date?: string | null
  description?: string
  status?: GoalStatus
}

export type GoalWritePayload = {
  title: string
  description?: string
  start_date: string
  due_date?: string | null
}

export function isValidDateValue(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value)
  if (!match) return false
  const [year, month, day] = match.slice(1).map(Number)
  const date = new Date(year, month - 1, day)
  return (
    date.getFullYear() === year &&
    date.getMonth() === month - 1 &&
    date.getDate() === day
  )
}

export function getGoalStatus(goal: Goal, tasks: Task[]): GoalStatus {
  if (goal.status) return goal.status
  return tasks.length > 0 && tasks.every((task) => task.status === "completed")
    ? "completed"
    : "active"
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
