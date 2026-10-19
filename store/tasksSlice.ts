import {
  createAsyncThunk,
  createSlice,
  type PayloadAction
} from "@reduxjs/toolkit"

import { tasksService } from "../services/tasks"
import type { Task } from "../services/tasks"

export type TasksState = {
  items: Task[]
  status: "idle" | "loading" | "succeeded" | "failed"
  error: string | null
}

const initialState: TasksState = {
  items: [],
  status: "idle",
  error: null
}

type TasksThunkState = { tasks: TasksState }

export const loadTasks = createAsyncThunk(
  "tasks/load",
  async () => tasksService.list(),
  {
    condition: (_argument, { getState }) => {
      const state = getState() as TasksThunkState
      return (
        state.tasks.status !== "loading" && state.tasks.status !== "succeeded"
      )
    }
  }
)

const tasksSlice = createSlice({
  name: "tasks",
  initialState,
  reducers: {
    taskCreated(state, action: PayloadAction<Task>) {
      state.items.unshift(action.payload)
    },
    taskUpdated(state, action: PayloadAction<Task>) {
      const index = state.items.findIndex(
        (task) => task.id === action.payload.id
      )
      if (index === -1) state.items.unshift(action.payload)
      else state.items[index] = action.payload
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(loadTasks.pending, (state) => {
        state.status = "loading"
        state.error = null
      })
      .addCase(loadTasks.fulfilled, (state, action) => {
        state.items = action.payload
        state.status = "succeeded"
      })
      .addCase(loadTasks.rejected, (state, action) => {
        if (action.meta.condition) return
        state.status = "failed"
        state.error = action.error.message ?? "Unable to load tasks."
      })
  }
})

export const { taskCreated, taskUpdated } = tasksSlice.actions
export const selectAllTasks = (state: { tasks: TasksState }) =>
  state.tasks.items
export const selectTasksStatus = (state: { tasks: TasksState }) =>
  state.tasks.status
export const selectTasksError = (state: { tasks: TasksState }) =>
  state.tasks.error

export default tasksSlice.reducer
