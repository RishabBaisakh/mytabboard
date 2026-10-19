import { describe, expect, it } from "vitest"

import type { ProfileFields } from "../services/profile"
import profileReducer, { profileUpdated } from "./profileSlice"

describe("profile slice", () => {
  it("keeps the display name shared after a profile save", () => {
    const updatedProfile: ProfileFields = {
      display_name: "Rishab",
      bio: "",
      time_zone: "America/Toronto",
      interests: [],
      personality_tags: []
    }

    const state = profileReducer(undefined, profileUpdated(updatedProfile))

    expect(state.profile?.display_name).toBe("Rishab")
  })
})
