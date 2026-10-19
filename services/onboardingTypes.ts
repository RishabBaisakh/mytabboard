export type OnboardingOption = {
  id: number
  key: string
  label: string
}

export type QuestionnaireQuestion = {
  id: number
  key: string
  prompt: string
  selection_type: "single" | "multiple"
  max_selections: number
  required: boolean
  options: OnboardingOption[]
  selected_option_ids: number[]
}

export type OnboardingData = {
  is_complete: boolean
  onboarding_completed_at: string | null
  profile: {
    display_name: string
    bio: string
    time_zone: string
  }
  questions: QuestionnaireQuestion[]
  interests: {
    options: OnboardingOption[]
    selected_ids: number[]
  }
  personality_tags: {
    options: OnboardingOption[]
    selected_ids: number[]
  }
}

export type OnboardingPayload = {
  step: "basic_info" | "questions" | "interests" | "personality_tags"
  display_name?: string
  bio?: string
  time_zone?: string
  selected_ids?: number[]
  answers?: SavedAnswer[]
}

export type OnboardingStatus = {
  is_complete: boolean
}

export type SavedAnswer = {
  question_id: number
  selected_option_ids: number[]
}

export type OnboardingStepResult = {
  step: OnboardingPayload["step"]
  saved: {
    profile?: Partial<OnboardingData["profile"]>
    display_name?: string
    bio?: string
    time_zone?: string
    answers?: SavedAnswer[]
    selected_ids?: number[]
  }
  is_complete: boolean
  onboarding_completed_at: string | null
}
