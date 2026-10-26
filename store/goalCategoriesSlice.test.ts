import { configureStore } from "@reduxjs/toolkit"
import { beforeEach, describe, expect, it, vi } from "vitest"

import type { Goal } from "../services/goals"
import goalCategoriesReducer, {
  loadGoalCategories
} from "./goalCategoriesSlice"
import goalsReducer, { goalCreated, goalUpdated, loadGoals } from "./goalsSlice"

const { list, deleteGoal, getGoalCategories } = vi.hoisted(() => ({
  list: vi.fn(),
  deleteGoal: vi.fn(),
  getGoalCategories: vi.fn()
}))

vi.mock("../services/goals", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../services/goals")>()),
  goalsService: { list, deleteGoal },
  getGoalCategories
}))

function makeStore() {
  return configureStore({
    reducer: { goals: goalsReducer, goalCategories: goalCategoriesReducer }
  })
}

function goal(id: number, category: string | null): Goal {
  return {
    id,
    title: `Goal ${id}`,
    start_date: "2026-10-01",
    timeline: "short_term",
    motivation: "",
    category
  }
}

beforeEach(() => {
  list.mockReset()
  getGoalCategories.mockReset()
})

describe("category cache", () => {
  it("fetches once and reuses the result", async () => {
    getGoalCategories.mockResolvedValue([
      { key: "personal_life", name: "Personal Life", description: "d" }
    ])
    const store = makeStore()
    await store.dispatch(loadGoalCategories())
    await store.dispatch(loadGoalCategories())
    expect(getGoalCategories).toHaveBeenCalledTimes(1)
    expect(store.getState().goalCategories.items[0].name).toBe("Personal Life")
  })

  it("allows a retry after a failure", async () => {
    getGoalCategories.mockRejectedValueOnce(new Error("boom"))
    getGoalCategories.mockResolvedValueOnce([])
    const store = makeStore()
    await store.dispatch(loadGoalCategories())
    expect(store.getState().goalCategories.status).toBe("failed")
    await store.dispatch(loadGoalCategories())
    expect(store.getState().goalCategories.status).toBe("succeeded")
    expect(getGoalCategories).toHaveBeenCalledTimes(2)
  })
})

describe("category filter on goals", () => {
  it("refetches from the backend for the selected key and again when cleared", async () => {
    list.mockResolvedValue([])
    const store = makeStore()
    await store.dispatch(loadGoals(null))
    await store.dispatch(loadGoals("health_wellness"))
    expect(list).toHaveBeenLastCalledWith({ category: "health_wellness" })
    await store.dispatch(loadGoals(null))
    expect(list).toHaveBeenLastCalledWith({ category: null })
    expect(list).toHaveBeenCalledTimes(3)
  })

  it("does not duplicate a request for the same category", async () => {
    list.mockResolvedValue([])
    const store = makeStore()
    await store.dispatch(loadGoals("health_wellness"))
    await store.dispatch(loadGoals("health_wellness"))
    expect(list).toHaveBeenCalledTimes(1)
  })

  it("ignores a stale response for a previously selected category", async () => {
    let resolveSlow: (goals: Goal[]) => void = () => {}
    list.mockImplementationOnce(
      () => new Promise<Goal[]>((resolve) => (resolveSlow = resolve))
    )
    list.mockResolvedValueOnce([goal(2, "personal_life")])
    const store = makeStore()
    const slow = store.dispatch(loadGoals("health_wellness"))
    await store.dispatch(loadGoals("personal_life"))
    resolveSlow([goal(1, "health_wellness")])
    await slow
    expect(store.getState().goals.items.map((g) => g.id)).toEqual([2])
    expect(store.getState().goals.category).toBe("personal_life")
  })

  it("distinguishes a filtered-empty result from having no goals", async () => {
    list.mockResolvedValueOnce([goal(1, "personal_life")])
    list.mockResolvedValueOnce([])
    const store = makeStore()
    await store.dispatch(loadGoals(null))
    await store.dispatch(loadGoals("health_wellness"))
    expect(store.getState().goals.items).toEqual([])
    expect(store.getState().goals.unfilteredCount).toBe(1)
  })

  it("keeps created and updated goals consistent with the active filter", async () => {
    list.mockResolvedValue([goal(1, "health_wellness")])
    const store = makeStore()
    await store.dispatch(loadGoals("health_wellness"))
    store.dispatch(goalCreated(goal(2, "personal_life")))
    expect(store.getState().goals.items.map((g) => g.id)).toEqual([1])
    store.dispatch(goalCreated(goal(3, "health_wellness")))
    expect(store.getState().goals.items.map((g) => g.id)).toEqual([1, 3])
    store.dispatch(goalUpdated(goal(1, "personal_life")))
    expect(store.getState().goals.items.map((g) => g.id)).toEqual([3])
  })
})
