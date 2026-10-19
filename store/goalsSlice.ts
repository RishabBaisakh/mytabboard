import {
  createAsyncThunk,
  createSelector,
  createSlice,
  type PayloadAction
} from "@reduxjs/toolkit"

import { getGoalStatus, goalsService, type Goal } from "../services/goals"
import type { Task } from "../services/tasks"

export type GoalsState = {
  items: Goal[]
  status: "idle" | "loading" | "succeeded" | "failed"
  error: string | null
}

const initialState: GoalsState = {
  items: [],
  status: "idle",
  error: null
}

type GoalsThunkState = { goals: GoalsState }

export const loadGoals = createAsyncThunk(
  "goals/load",
  async () => goalsService.list(),
  {
    condition: (_argument, { getState }) => {
      const state = getState() as GoalsThunkState
      return (
        state.goals.status !== "loading" && state.goals.status !== "succeeded"
      )
    }
  }
)

const goalsSlice = createSlice({
  name: "goals",
  initialState,
  reducers: {
    goalCreated(state, action: PayloadAction<Goal>) {
      state.items.push(action.payload)
    },
    goalUpdated(state, action: PayloadAction<Goal>) {
      const index = state.items.findIndex(
        (goal) => goal.id === action.payload.id
      )
      if (index !== -1) state.items[index] = action.payload
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(loadGoals.pending, (state) => {
        state.status = "loading"
        state.error = null
      })
      .addCase(loadGoals.fulfilled, (state, action) => {
        state.items = action.payload
        state.status = "succeeded"
      })
      .addCase(loadGoals.rejected, (state, action) => {
        if (action.meta.condition) return
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
