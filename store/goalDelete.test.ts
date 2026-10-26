import { configureStore } from "@reduxjs/toolkit"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { ApiError } from "../services/api"
import type { Goal } from "../services/goals"
import type { Task } from "../services/tasks"
import goalsReducer, { loadGoals, removeGoal } from "./goalsSlice"
import tasksReducer, { loadTasks } from "./tasksSlice"

const { list, deleteGoal } = vi.hoisted(() => ({
  list: vi.fn(),
  deleteGoal: vi.fn()
}))

vi.mock("../services/goals", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../services/goals")>()),
  goalsService: { list, deleteGoal }
}))
vi.mock("../services/tasks", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../services/tasks")>()),
  tasksService: { list: vi.fn().mockResolvedValue([]) }
}))

function goal(id: number): Goal {
  return {
    id,
    title: `Goal ${id}`,
    start_date: "2026-10-01",
    timeline: "short_term",
    motivation: ""
  }
}

function task(id: string, goalId: number | null): Task {
  return {
    id,
    user: 1,
    title: id,
    description: "",
    status: "todo",
    priority: "medium",
    goal: goalId,
    scheduled_start: "2026-10-26T10:00:00Z",
    scheduled_end: "2026-10-26T11:00:00Z",
    completed_at: null,
    created_at: "2026-10-26T09:00:00Z",
    updated_at: "2026-10-26T09:00:00Z"
  }
}

async function setup() {
  const { tasksService } = await import("../services/tasks")
  vi.mocked(tasksService.list).mockResolvedValue([task("a", 1), task("b", 2)])
  list.mockResolvedValue([goal(1), goal(2)])
  const store = configureStore({
    reducer: { goals: goalsReducer, tasks: tasksReducer }
  })
  await store.dispatch(loadGoals(null))
  await store.dispatch(loadTasks())
  return store
}

beforeEach(() => {
  list.mockReset()
  deleteGoal.mockReset()
})

describe("removeGoal", () => {
  it("removes the goal on success and keeps its tasks with goal null", async () => {
    deleteGoal.mockResolvedValue(undefined)
    const store = await setup()
    await store.dispatch(removeGoal(1))
    expect(deleteGoal).toHaveBeenCalledWith(1)
    expect(store.getState().goals.items.map((g) => g.id)).toEqual([2])
    expect(store.getState().goals.unfilteredCount).toBe(1)
    const tasks = store.getState().tasks.items
    expect(tasks.map((t) => t.id)).toEqual(["a", "b"])
    expect(tasks.find((t) => t.id === "a")?.goal).toBeNull()
    expect(tasks.find((t) => t.id === "b")?.goal).toBe(2)
  })

  it("treats a 404 as already deleted", async () => {
    deleteGoal.mockRejectedValue(new ApiError("Not found.", 404))
    const store = await setup()
    await store.dispatch(removeGoal(1))
    expect(store.getState().goals.items.map((g) => g.id)).toEqual([2])
  })

  it("keeps the goal and rejects on other errors", async () => {
    deleteGoal.mockRejectedValue(new ApiError("Server error.", 500))
    const store = await setup()
    const result = await store.dispatch(removeGoal(1))
    expect(removeGoal.rejected.match(result)).toBe(true)
    expect(store.getState().goals.items.map((g) => g.id)).toEqual([1, 2])
    expect(store.getState().tasks.items[0].goal).toBe(1)
  })

  it("does not call the API when the confirm dialog is cancelled", () => {
    expect(deleteGoal).not.toHaveBeenCalled()
  })
})
