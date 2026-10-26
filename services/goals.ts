import type { ApiClient } from "./api"
import { apiClient } from "./apiClient"
import type { Task } from "./tasks"

export type GoalStatus = "active" | "completed" | "archived"

export type GoalTimeline = "short_term" | "mid_term" | "long_term"

export const GOAL_TIMELINE_OPTIONS: { value: GoalTimeline; label: string }[] = [
  { value: "short_term", label: "Short-term" },
  { value: "mid_term", label: "Mid-term" },
  { value: "long_term", label: "Long-term" }
]

export const DEFAULT_GOAL_TIMELINE: GoalTimeline = "short_term"

export function getGoalTimelineLabel(value?: string | null) {
  return GOAL_TIMELINE_OPTIONS.find((option) => option.value === value)?.label
}

export type GoalCategory = {
  key: string
  name: string
  description: string
}

export type GoalListParams = {
  category?: string | null
}

export type Goal = {
  id: number
  title: string
  start_date: string
  due_date?: string | null
  description?: string
  timeline: GoalTimeline
  motivation: string
  status?: GoalStatus
  category?: string | null
  category_detail?: GoalCategory | null
}

export type GoalWritePayload = {
  title: string
  description?: string
  start_date: string
  due_date?: string | null
  timeline: GoalTimeline
  motivation?: string
  // Omit to leave unchanged; null clears the category.
  category?: string | null
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
    list({ category }: GoalListParams = {}): Promise<Goal[]> {
      const query = new URLSearchParams()
      if (category) query.set("category", category)
      const search = query.toString()
      return api.request<Goal[]>(
        `/api/v1/goals/${search ? `?${search}` : ""}`,
        {
          authenticated: true
        }
      )
    },

    getGoalCategories(): Promise<GoalCategory[]> {
      return api.request<GoalCategory[]>("/api/v1/goals/categories/", {
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

    deleteGoal(id: number): Promise<void> {
      return api.request<void>(`/api/v1/goals/${id}/`, {
        method: "DELETE",
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

export function getGoalCategories() {
  return goalsService.getGoalCategories()
}
