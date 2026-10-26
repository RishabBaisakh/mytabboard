import { configureStore } from "@reduxjs/toolkit"

import goalCategoriesReducer from "./goalCategoriesSlice"
import goalsReducer from "./goalsSlice"
import profileReducer from "./profileSlice"
import tasksReducer from "./tasksSlice"

export const store = configureStore({
  reducer: {
    profile: profileReducer,
    goals: goalsReducer,
    goalCategories: goalCategoriesReducer,
    tasks: tasksReducer
  }
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
