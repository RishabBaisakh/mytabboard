import type { ApiClient } from "./api"
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

function taskPath(id: string) {
  return `/api/v1/tasks/${encodeURIComponent(id)}/`
}

export function createTasksService(api: Pick<ApiClient, "request">) {
  return {
    list(): Promise<Task[]> {
      return api.request<Task[]>("/api/v1/tasks/", { authenticated: true })
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
