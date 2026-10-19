import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"

import { ApiError } from "../../services/api"
import { onboardingService } from "../../services/onboarding"
import type {
  OnboardingData,
  OnboardingPayload
} from "../../services/onboardingTypes"
import { BasicInfoStep } from "./BasicInfoStep"
import { InterestsStep } from "./InterestsStep"
import { OnboardingNavigation } from "./OnboardingNavigation"
import { OnboardingSidebar } from "./OnboardingSidebar"
import { PersonalityStep } from "./PersonalityStep"
import { QuestionnaireStep } from "./QuestionnaireStep"

function toggleId(currentIds: number[], id: number, limit: number) {
  if (currentIds.includes(id))
    return currentIds.filter((currentId) => currentId !== id)
  if (currentIds.length >= limit) return currentIds
  return [...currentIds, id]
}

function trimSelection(ids: number[], limit: number) {
  return ids.slice(0, limit)
}

function getEnvironmentTimeZone() {
  return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC"
}

function getServerFieldErrors(error: unknown): Record<string, string> {
  if (
    !(error instanceof ApiError) ||
    !error.payload ||
    typeof error.payload !== "object"
  ) {
    return {}
  }

  const payload = error.payload as Record<string, unknown>
  const fields =
    payload.errors && typeof payload.errors === "object"
      ? (payload.errors as Record<string, unknown>)
      : payload

  function collectMessages(value: unknown): string[] {
    if (typeof value === "string") return [value]
    if (Array.isArray(value)) return value.flatMap(collectMessages)
    if (value && typeof value === "object") {
      return Object.values(value).flatMap(collectMessages)
    }
    return []
  }

  return Object.fromEntries(
    Object.entries(fields)
      .map(
        ([field, value]) => [field, collectMessages(value).join(" ")] as const
      )
      .filter(([, message]) => message.length > 0)
  )
}

export function OnboardingPage() {
  const navigate = useNavigate()
  const [attempt, setAttempt] = useState(0)
  const [data, setData] = useState<OnboardingData | null>(null)
  const [profile, setProfile] = useState({
    display_name: "",
    bio: "",
    time_zone: getEnvironmentTimeZone()
  })
  const [answers, setAnswers] = useState<Record<string, number[]>>({})
  const [interestIds, setInterestIds] = useState<number[]>([])
  const [personalityIds, setPersonalityIds] = useState<number[]>([])
  const [step, setStep] = useState(0)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [loadError, setLoadError] = useState("")
  const [submitError, setSubmitError] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    let isCurrent = true
    setIsLoading(true)
    setLoadError("")

    onboardingService
      .load()
      .then((loadedData) => {
        if (!isCurrent) return
        if (loadedData.is_complete) {
          navigate("/", { replace: true })
          return
        }

        setData(loadedData)
        setProfile({
          display_name: loadedData.profile.display_name,
          bio: loadedData.profile.bio ?? "",
          time_zone: getEnvironmentTimeZone()
        })
        setAnswers(
          Object.fromEntries(
            loadedData.questions.map((question) => [
              question.key,
              trimSelection(
                question.selected_option_ids,
                question.selection_type === "single"
                  ? 1
                  : question.max_selections
              )
            ])
          )
        )
        setInterestIds(trimSelection(loadedData.interests.selected_ids, 5))
        setPersonalityIds(
          trimSelection(loadedData.personality_tags.selected_ids, 3)
        )
      })
      .catch((error: unknown) => {
        if (!isCurrent) return
        setLoadError(
          error instanceof Error
            ? error.message
            : "Unable to load onboarding right now."
        )
      })
      .finally(() => {
        if (isCurrent) setIsLoading(false)
      })

    return () => {
      isCurrent = false
    }
  }, [attempt, navigate])

  function updateProfile(field: "display_name" | "bio", value: string) {
    setProfile((current) => ({ ...current, [field]: value }))
    setErrors((current) => ({ ...current, [field]: "" }))
  }

  function validateStep(stepToValidate: number) {
    const nextErrors: Record<string, string> = {}

    if (stepToValidate === 1) {
      for (const question of data?.questions ?? []) {
        if (question.required && (answers[question.key] ?? []).length === 0) {
          nextErrors[question.key] = "Choose an option to continue."
        }
      }
    }
    if (stepToValidate === 2 && interestIds.length === 0) {
      nextErrors.interests = "Choose at least one interest to continue."
    }
    if (stepToValidate === 3 && personalityIds.length === 0) {
      nextErrors.personality = "Choose at least one trait to continue."
    }

    return nextErrors
  }

  async function saveCurrentStep() {
    if (!data || isSubmitting) return

    const nextErrors = validateStep(step)
    setErrors(nextErrors)
    setSubmitError("")
    if (Object.keys(nextErrors).length > 0) return

    const payload: OnboardingPayload =
      step === 0
        ? {
            step: "basic_info",
            display_name: profile.display_name,
            bio: profile.bio,
            time_zone: getEnvironmentTimeZone()
          }
        : step === 1
          ? {
              step: "questions",
              answers: data.questions.map((question) => ({
                question_id: question.id,
                selected_option_ids: answers[question.key] ?? []
              }))
            }
          : step === 2
            ? { step: "interests", selected_ids: interestIds }
            : { step: "personality_tags", selected_ids: personalityIds }

    setIsSubmitting(true)
    try {
      const savedData = await onboardingService.saveStep(payload)
      setData(savedData)
      setProfile({ ...savedData.profile })
      setAnswers(
        Object.fromEntries(
          savedData.questions.map((question) => [
            question.key,
            question.selected_option_ids
          ])
        )
      )
      setInterestIds(savedData.interests.selected_ids)
      setPersonalityIds(savedData.personality_tags.selected_ids)

      if (step === 3) {
        if (savedData.is_complete) {
          navigate("/", { replace: true })
        } else {
          setSubmitError(
            "Your selections were saved, but setup is not complete yet."
          )
        }
      } else {
        setStep((current) => current + 1)
      }
    } catch (error) {
      const fieldErrors = getServerFieldErrors(error)
      setErrors(fieldErrors)
      setSubmitError(
        Object.values(fieldErrors).join(" ") ||
          (error instanceof Error
            ? error.message
            : "Unable to save this step. Please try again.")
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  function handleBack() {
    if (isSubmitting) return
    setErrors({})
    setSubmitError("")
    setStep((current) => Math.max(0, current - 1))
  }

  return (
    <div className="onboarding-shell">
      <OnboardingSidebar activeStep={step} />
      <main className="onboarding-main">
        <div className="onboarding-main-inner">
          {isLoading && (
            <p className="onboarding-state-message" role="status">
              Preparing your onboarding...
            </p>
          )}

          {!isLoading && loadError && (
            <section className="onboarding-load-error" aria-live="polite">
              <p className="onboarding-eyebrow">Your setup is waiting</p>
              <h1>We couldn't load your onboarding.</h1>
              <p role="alert">{loadError}</p>
              <button
                className="onboarding-continue-button"
                type="button"
                onClick={() => setAttempt((current) => current + 1)}>
                Try again
              </button>
            </section>
          )}

          {!isLoading && !loadError && data && (
            <>
              {step === 0 && (
                <BasicInfoStep
                  data={{ ...data, profile }}
                  errors={errors}
                  onProfileChange={updateProfile}
                />
              )}
              {step === 1 && (
                <QuestionnaireStep
                  data={data}
                  answers={answers}
                  errors={errors}
                  onToggle={(questionKey, optionId) => {
                    const question = data.questions.find(
                      (item) => item.key === questionKey
                    )
                    if (!question) return
                    const limit =
                      question.selection_type === "single"
                        ? 1
                        : question.max_selections
                    setAnswers((current) => ({
                      ...current,
                      [questionKey]: toggleId(
                        current[questionKey] ?? [],
                        optionId,
                        limit
                      )
                    }))
                    setErrors((current) => ({ ...current, [questionKey]: "" }))
                  }}
                />
              )}
              {step === 2 && (
                <InterestsStep
                  data={data}
                  selectedIds={interestIds}
                  error={errors.interests}
                  onToggle={(id) =>
                    setInterestIds((current) => toggleId(current, id, 5))
                  }
                />
              )}
              {step === 3 && (
                <PersonalityStep
                  data={data}
                  selectedIds={personalityIds}
                  error={errors.personality}
                  onToggle={(id) =>
                    setPersonalityIds((current) => toggleId(current, id, 3))
                  }
                />
              )}

              {submitError && (
                <p className="onboarding-submit-error" role="alert">
                  {submitError}
                </p>
              )}

              <OnboardingNavigation
                step={step}
                submitting={isSubmitting}
                onBack={handleBack}
                onContinue={saveCurrentStep}
                onComplete={saveCurrentStep}
              />
            </>
          )}
        </div>
      </main>
    </div>
  )
}
