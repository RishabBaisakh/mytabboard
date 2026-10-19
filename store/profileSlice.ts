import {
  createAsyncThunk,
  createSlice,
  type PayloadAction
} from "@reduxjs/toolkit"

import {
  profileService,
  type ProfileFields,
  type ProfileOptionCatalogs
} from "../services/profile"

type ProfileLoadResult = {
  profile: ProfileFields
  options: ProfileOptionCatalogs
}

export type ProfileState = {
  profile: ProfileFields | null
  options: ProfileOptionCatalogs | null
  status: "idle" | "loading" | "succeeded" | "failed"
  error: string | null
}

const initialState: ProfileState = {
  profile: null,
  options: null,
  status: "idle",
  error: null
}

export const loadProfile = createAsyncThunk(
  "profile/load",
  async () => profileService.load(),
  {
    condition: (_argument, { getState }) => {
      const state = getState() as { profile: ProfileState }
      return state.profile.status !== "loading"
    }
  }
)

const profileSlice = createSlice({
  name: "profile",
  initialState,
  reducers: {
    profileUpdated(state, action: PayloadAction<ProfileFields>) {
      state.profile = action.payload
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(loadProfile.pending, (state) => {
        state.status = "loading"
        state.error = null
      })
      .addCase(loadProfile.fulfilled, (state, action) => {
        state.status = "succeeded"
        state.profile = action.payload.profile
        state.options = action.payload.options
      })
      .addCase(loadProfile.rejected, (state, action) => {
        if (action.meta.condition) return
        state.status = "failed"
        state.error = action.error.message ?? "Unable to load your profile."
      })
  }
})

export const { profileUpdated } = profileSlice.actions
export default profileSlice.reducer
