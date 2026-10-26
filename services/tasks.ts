import { ApiError, type ApiClient } from "./api"
import { apiClient } from "./apiClient"

export type TaskStatus = "todo" | "in_progress" | "completed" | "cancelled"
export type TaskPriority = "low" | "medium" | "high"

export type Task = {
  id: string
  user: number
  title: string
  description: string
  status: TaskStatus
  priority: TaskPriority
  goal: number | null
  scheduled_start: string
  scheduled_end: string
  completed_at: string | null
  created_at: string
  updated_at: string
}

export type TaskWriteFields = Pick<
  Task,
  | "title"
  | "description"
  | "status"
  | "priority"
  | "goal"
  | "scheduled_start"
  | "scheduled_end"
>

export type CreateTaskPayload = TaskWriteFields
export type ReplaceTaskPayload = TaskWriteFields
export type PatchTaskPayload = Partial<TaskWriteFields>

export type TaskListParams = {
  startDate?: Date
  endDate?: Date
}

// Local calendar date; toISOString() would shift the day for non-UTC users.
export function formatLocalDate(date: Date) {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0")
  ].join("-")
}

export function taskListPath({ startDate, endDate }: TaskListParams = {}) {
  const query = new URLSearchParams()
  if (startDate) query.set("start_date", formatLocalDate(startDate))
  if (endDate) query.set("end_date", formatLocalDate(endDate))
  const search = query.toString()
  return `/api/v1/tasks/${search ? `?${search}` : ""}`
}

// The backend returns 400 with a field-keyed object such as {"end_date": "..."}.
function validationMessage(payload: unknown): string | null {
  if (!payload || typeof payload !== "object") return null
  const messages: string[] = []
  for (const value of Object.values(payload as Record<string, unknown>)) {
    if (typeof value === "string") messages.push(value)
    else if (Array.isArray(value)) {
      messages.push(...value.filter((v): v is string => typeof v === "string"))
    }
  }
  return messages.length ? messages.join(" ") : null
}

function taskPath(id: string) {
  return `/api/v1/tasks/${encodeURIComponent(id)}/`
}

export function createTasksService(api: Pick<ApiClient, "request">) {
  return {
    async list(params: TaskListParams = {}): Promise<Task[]> {
      try {
        return await api.request<Task[]>(taskListPath(params), {
          authenticated: true
        })
      } catch (error) {
        if (error instanceof ApiError && error.status === 400) {
          const message = validationMessage(error.payload)
          if (message) {
            throw new ApiError(message, error.status, error.payload, error)
          }
        }
        throw error
      }
    },

    create(payload: CreateTaskPayload): Promise<Task> {
      return api.request<Task>("/api/v1/tasks/", {
        method: "POST",
        body: payload,
        authenticated: true
      })
    },

    get(id: string): Promise<Task> {
      return api.request<Task>(taskPath(id), { authenticated: true })
    },

    replace(id: string, payload: ReplaceTaskPayload): Promise<Task> {
      return api.request<Task>(taskPath(id), {
        method: "PUT",
        body: payload,
        authenticated: true
      })
    },

    update(id: string, payload: PatchTaskPayload): Promise<Task> {
      return api.request<Task>(taskPath(id), {
        method: "PATCH",
        body: payload,
        authenticated: true
      })
    },

    delete(id: string): Promise<void> {
      return api.request<void>(taskPath(id), {
        method: "DELETE",
        authenticated: true
      })
    }
  }
}

export const tasksService = createTasksService(apiClient)
