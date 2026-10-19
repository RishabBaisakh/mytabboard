import { configureStore } from "@reduxjs/toolkit"

import goalsReducer from "./goalsSlice"
import profileReducer from "./profileSlice"
import tasksReducer from "./tasksSlice"

export const store = configureStore({
  reducer: {
    profile: profileReducer,
    goals: goalsReducer,
    tasks: tasksReducer
  }
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
