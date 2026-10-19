import type { ApiClient } from "./api"
import { apiClient } from "./apiClient"
import type {
  OnboardingData,
  OnboardingPayload,
  OnboardingStatus,
  OnboardingStepResult
} from "./onboardingTypes"

type ApiOption = {
  id: number
  key: string
  label?: string
  name?: string
}

type ApiOnboardingResponse = {
  is_complete: boolean
  onboarding_completed_at: string | null
  profile: OnboardingData["profile"]
  basic_info: {
    questions: {
      id: number
      key: string
      text: string
      selection_type: "single" | "multiple"
      max_selections: number
      is_required: boolean
      options: ApiOption[]
      selected_option_ids: number[]
    }[]
  }
  interests: {
    options: ApiOption[]
    selected_ids: number[]
  }
  personality_tags: {
    options: ApiOption[]
    selected_ids: number[]
  }
}

function normalizeOptions(options: ApiOption[]) {
  return options.map((option) => ({
    id: option.id,
    key: option.key,
    label: option.label ?? option.name ?? option.key
  }))
}

function normalizeOnboarding(data: ApiOnboardingResponse): OnboardingData {
  return {
    is_complete: data.is_complete,
    onboarding_completed_at: data.onboarding_completed_at,
    profile: data.profile,
    questions: data.basic_info.questions.map((question) => ({
      id: question.id,
      key: question.key,
      prompt: question.text,
      selection_type: question.selection_type,
      max_selections: question.max_selections,
      required: question.is_required,
      options: normalizeOptions(question.options),
      selected_option_ids: question.selected_option_ids
    })),
    interests: {
      options: normalizeOptions(data.interests.options),
      selected_ids: data.interests.selected_ids
    },
    personality_tags: {
      options: normalizeOptions(data.personality_tags.options),
      selected_ids: data.personality_tags.selected_ids
    }
  }
}

function applySavedStep(
  data: OnboardingData,
  result: OnboardingStepResult
): OnboardingData {
  const saved = result.saved
  let nextData = data

  if (result.step === "basic_info") {
    const profile = saved.profile ?? {}
    const answers = new Map(
      (saved.answers ?? []).map((answer) => [
        answer.question_id,
        answer.selected_option_ids
      ])
    )
    nextData = {
      ...nextData,
      profile: {
        display_name:
          profile.display_name ??
          saved.display_name ??
          data.profile.display_name,
        bio: profile.bio ?? saved.bio ?? data.profile.bio,
        time_zone:
          profile.time_zone ?? saved.time_zone ?? data.profile.time_zone
      },
      questions: data.questions.map((question) => ({
        ...question,
        selected_option_ids:
          answers.get(question.id) ?? question.selected_option_ids
      }))
    }
  }

  if (result.step === "questions") {
    const answers = new Map(
      (saved.answers ?? []).map((answer) => [
        answer.question_id,
        answer.selected_option_ids
      ])
    )
    nextData = {
      ...nextData,
      questions: data.questions.map((question) => ({
        ...question,
        selected_option_ids:
          answers.get(question.id) ?? question.selected_option_ids
      }))
    }
  }

  if (result.step === "interests" && saved.selected_ids) {
    nextData = {
      ...nextData,
      interests: { ...data.interests, selected_ids: saved.selected_ids }
    }
  }

  if (result.step === "personality_tags" && saved.selected_ids) {
    nextData = {
      ...nextData,
      personality_tags: {
        ...data.personality_tags,
        selected_ids: saved.selected_ids
      }
    }
  }

  return {
    ...nextData,
    is_complete: result.is_complete,
    onboarding_completed_at: result.onboarding_completed_at
  }
}

export function createOnboardingService(api: Pick<ApiClient, "request">) {
  let cachedData: OnboardingData | null = null
  let loadInFlight: Promise<OnboardingData> | null = null
  let cachedStatus: OnboardingStatus | null = null
  let statusInFlight: Promise<OnboardingStatus> | null = null

  return {
    status(): Promise<OnboardingStatus> {
      if (cachedStatus) return Promise.resolve(cachedStatus)
      if (statusInFlight) return statusInFlight

      statusInFlight = api
        .request<OnboardingStatus>("/api/onboarding/status/", {
          authenticated: true
        })
        .then((status) => {
          cachedStatus = status
          return status
        })
        .finally(() => {
          statusInFlight = null
        })
      return statusInFlight
    },

    load(): Promise<OnboardingData> {
      if (cachedData) return Promise.resolve(cachedData)
      if (loadInFlight) return loadInFlight

      loadInFlight = api
        .request<ApiOnboardingResponse>("/api/onboarding/", {
          authenticated: true
        })
        .then(normalizeOnboarding)
        .then((data) => {
          cachedData = data
          cachedStatus = {
            is_complete: data.is_complete
          }
          return data
        })
        .finally(() => {
          loadInFlight = null
        })

      return loadInFlight
    },

    async saveStep(payload: OnboardingPayload): Promise<OnboardingData> {
      const result = await api.request<OnboardingStepResult>(
        "/api/onboarding/",
        {
          method: "PATCH",
          body: payload,
          authenticated: true
        }
      )

      if (!cachedData) throw new Error("Onboarding data has not been loaded.")
      cachedData = applySavedStep(cachedData, result)
      cachedStatus = { is_complete: result.is_complete }
      return cachedData
    },

    clearCache() {
      cachedData = null
      loadInFlight = null
      cachedStatus = null
      statusInFlight = null
    }
  }
}

export const onboardingService = createOnboardingService(apiClient)
