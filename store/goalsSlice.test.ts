import { describe, expect, it } from "vitest"

import type { Task } from "../services/tasks"
import { selectIncompleteGoals } from "./goalsSlice"

const tasks: Task[] = [
  {
    id: "task-1",
    user: 1,
    title: "Done",
    description: "",
    status: "completed",
    priority: "medium",
    goal: 3,
    scheduled_start: "2026-10-18T10:00:00Z",
    scheduled_end: "2026-10-18T11:00:00Z",
    completed_at: "2026-10-18T11:00:00Z",
    created_at: "2026-10-18T09:00:00Z",
    updated_at: "2026-10-18T11:00:00Z"
  }
]

describe("incomplete goal selector", () => {
  it("excludes completed and archived goals, including task-derived completion", () => {
    const activeGoal = {
      id: 1,
      title: "Active",
      start_date: "2026-10-01",
      timeline: "short_term" as const,
      motivation: "",
      status: "active" as const
    }
    const completedGoal = {
      id: 2,
      title: "Completed",
      start_date: "2026-10-01",
      timeline: "short_term" as const,
      motivation: "",
      status: "completed" as const
    }
    const archivedGoal = {
      id: 4,
      title: "Archived",
      start_date: "2026-10-01",
      timeline: "short_term" as const,
      motivation: "",
      status: "archived" as const
    }
    const taskCompletedGoal = {
      id: 3,
      title: "Task completed",
      start_date: "2026-10-01",
      timeline: "short_term" as const,
      motivation: ""
    }
    const state = {
      goals: {
        items: [activeGoal, completedGoal, archivedGoal, taskCompletedGoal],
        status: "succeeded" as const,
        error: null,
        category: null,
        unfilteredCount: null
      },
      tasks: { items: tasks, status: "succeeded" as const, error: null }
    }

    expect(selectIncompleteGoals(state)).toEqual([activeGoal])
  })
})
