import type { ApiClient } from "./api"
import { apiClient } from "./apiClient"
import type { OnboardingOption } from "./onboardingTypes"

export type ProfileFields = {
  display_name: string
  bio: string
  time_zone: string
  interests: number[]
  personality_tags: number[]
}

export type ProfileOptionCatalogs = {
  interests: OnboardingOption[]
  personality_tags: OnboardingOption[]
}

type ApiOption = {
  id: number
  key: string
  label?: string
  name?: string
}

type ApiOptionCatalogsResponse = {
  interests: { options: ApiOption[] }
  personality_tags: { options: ApiOption[] }
}

function normalizeOptions(options: ApiOption[]): OnboardingOption[] {
  return options.map((option) => ({
    id: option.id,
    key: option.key,
    label: option.label ?? option.name ?? option.key
  }))
}

export function createProfileService(api: Pick<ApiClient, "request">) {
  return {
    async load(): Promise<{
      profile: ProfileFields
      options: ProfileOptionCatalogs
    }> {
      const [profile, catalogs] = await Promise.all([
        api.request<ProfileFields>("/api/auth/profile/", {
          authenticated: true
        }),
        api.request<ApiOptionCatalogsResponse>("/api/onboarding/", {
          authenticated: true
        })
      ])

      return {
        profile: { ...profile, bio: profile.bio ?? "" },
        options: {
          interests: normalizeOptions(catalogs.interests.options),
          personality_tags: normalizeOptions(catalogs.personality_tags.options)
        }
      }
    },

    save(profile: ProfileFields): Promise<ProfileFields> {
      return api.request<ProfileFields>("/api/auth/profile/", {
        method: "PATCH",
        body: profile,
        authenticated: true
      })
    }
  }
}

export const profileService = createProfileService(apiClient)
