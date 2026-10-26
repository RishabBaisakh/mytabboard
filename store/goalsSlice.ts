import {
  createAsyncThunk,
  createSelector,
  createSlice,
  type PayloadAction
} from "@reduxjs/toolkit"

import { ApiError } from "../services/api"
import { getGoalStatus, goalsService, type Goal } from "../services/goals"
import type { Task } from "../services/tasks"

export type GoalsState = {
  items: Goal[]
  status: "idle" | "loading" | "succeeded" | "failed"
  error: string | null
  // Category the current items were (or are being) requested for; null = all.
  category: string | null
  // Size of the last unfiltered result, so a filtered-empty list can be told apart from "no goals".
  unfilteredCount: number | null
}

const initialState: GoalsState = {
  category: null,
  unfilteredCount: null,
  items: [],
  status: "idle",
  error: null
}

function argKey(arg: string | null | void) {
  return typeof arg === "string" ? arg : null
}

type GoalsThunkState = { goals: GoalsState }

export const loadGoals = createAsyncThunk<Goal[], string | null | void>(
  "goals/load",
  async (category) => goalsService.list({ category: argKey(category) }),
  {
    condition: (category, { getState }) => {
      const { goals } = getState() as GoalsThunkState
      const sameCategory = goals.category === argKey(category)
      return !(
        sameCategory &&
        (goals.status === "loading" || goals.status === "succeeded")
      )
    }
  }
)

// A 404 means the goal is already gone, which is the outcome the user wanted.
export const removeGoal = createAsyncThunk(
  "goals/remove",
  async (id: number) => {
    try {
      await goalsService.deleteGoal(id)
    } catch (error) {
      if (!(error instanceof ApiError && error.status === 404)) throw error
    }
    return id
  }
)

const goalsSlice = createSlice({
  name: "goals",
  initialState,
  reducers: {
    goalCreated(state, action: PayloadAction<Goal>) {
      if (state.unfilteredCount !== null) state.unfilteredCount += 1
      if (
        state.category === null ||
        action.payload.category === state.category
      ) {
        state.items.push(action.payload)
      }
    },
    goalUpdated(state, action: PayloadAction<Goal>) {
      const index = state.items.findIndex(
        (goal) => goal.id === action.payload.id
      )
      if (index === -1) return
      // A goal moved out of the active category filter leaves the list.
      if (
        state.category !== null &&
        action.payload.category !== state.category
      ) {
        state.items.splice(index, 1)
      } else {
        state.items[index] = action.payload
      }
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(loadGoals.pending, (state, action) => {
        state.category = argKey(action.meta.arg)
        state.status = "loading"
        state.error = null
      })
      .addCase(loadGoals.fulfilled, (state, action) => {
        // Ignore responses for a category that is no longer selected.
        if (argKey(action.meta.arg) !== state.category) return
        state.items = action.payload
        if (state.category === null) {
          state.unfilteredCount = action.payload.length
        }
        state.status = "succeeded"
      })
      .addCase(removeGoal.fulfilled, (state, action) => {
        const before = state.items.length
        state.items = state.items.filter((goal) => goal.id !== action.payload)
        if (state.unfilteredCount !== null && state.unfilteredCount > 0) {
          // Unfiltered lists shrink with items; filtered ones only if the goal was shown.
          if (state.category === null || state.items.length < before) {
            state.unfilteredCount -= 1
          }
        }
      })
      .addCase(loadGoals.rejected, (state, action) => {
        if (action.meta.condition) return
        if (argKey(action.meta.arg) !== state.category) return
        state.status = "failed"
        state.error = action.error.message ?? "Unable to load goals."
      })
  }
})

export const { goalCreated, goalUpdated } = goalsSlice.actions
export const selectAllGoals = (state: { goals: GoalsState }) =>
  state.goals.items
export const selectGoalsStatus = (state: { goals: GoalsState }) =>
  state.goals.status
export const selectGoalsCategory = (state: { goals: GoalsState }) =>
  state.goals.category
export const selectGoalsUnfilteredCount = (state: { goals: GoalsState }) =>
  state.goals.unfilteredCount
export const selectGoalsError = (state: { goals: GoalsState }) =>
  state.goals.error

type IncompleteGoalState = {
  goals: GoalsState
  tasks: { items: Task[] }
}

export const selectIncompleteGoals = createSelector(
  [
    (state: IncompleteGoalState) => state.goals.items,
    (state: IncompleteGoalState) => state.tasks.items
  ],
  (goals, tasks) =>
    goals.filter((goal) => {
      const goalTasks = tasks.filter((task) => task.goal === goal.id)
      const status = getGoalStatus(goal, goalTasks)
      return status !== "completed" && status !== "archived"
    })
)

export default goalsSlice.reducer
