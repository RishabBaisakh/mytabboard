import { createAsyncThunk, createSlice } from "@reduxjs/toolkit"

import { getGoalCategories, type GoalCategory } from "../services/goals"

export type GoalCategoriesState = {
  items: GoalCategory[]
  status: "idle" | "loading" | "succeeded" | "failed"
  error: string | null
}

const initialState: GoalCategoriesState = {
  items: [],
  status: "idle",
  error: null
}

// Categories are static per session: fetched once, retried only after a failure.
export const loadGoalCategories = createAsyncThunk(
  "goalCategories/load",
  async () => getGoalCategories(),
  {
    condition: (_argument, { getState }) => {
      const { goalCategories } = getState() as {
        goalCategories: GoalCategoriesState
      }
      return (
        goalCategories.status !== "loading" &&
        goalCategories.status !== "succeeded"
      )
    }
  }
)

const goalCategoriesSlice = createSlice({
  name: "goalCategories",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(loadGoalCategories.pending, (state) => {
        state.status = "loading"
        state.error = null
      })
      .addCase(loadGoalCategories.fulfilled, (state, action) => {
        state.items = action.payload
        state.status = "succeeded"
      })
      .addCase(loadGoalCategories.rejected, (state, action) => {
        if (action.meta.condition) return
        state.status = "failed"
        state.error = action.error.message ?? "Unable to load categories."
      })
  }
})

type CategoriesRoot = { goalCategories: GoalCategoriesState }

export const selectGoalCategories = (state: CategoriesRoot) =>
  state.goalCategories.items
export const selectGoalCategoriesStatus = (state: CategoriesRoot) =>
  state.goalCategories.status
export const selectGoalCategoriesError = (state: CategoriesRoot) =>
  state.goalCategories.error

export default goalCategoriesSlice.reducer
