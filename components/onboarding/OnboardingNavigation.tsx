import { ArrowLeft, ArrowRight, Check } from "lucide-react"

type OnboardingNavigationProps = {
  step: number
  submitting: boolean
  onBack: () => void
  onContinue: () => void
  onComplete: () => void
}

export function OnboardingNavigation({
  step,
  submitting,
  onBack,
  onContinue,
  onComplete
}: OnboardingNavigationProps) {
  return (
    <footer className="onboarding-navigation">
      {step > 0 ? (
        <button
          className="onboarding-back-button"
          type="button"
          onClick={onBack}
          disabled={submitting}>
          <ArrowLeft size={17} aria-hidden="true" />
          Back
        </button>
      ) : (
        <span />
      )}

      {step < 3 ? (
        <button
          className="onboarding-continue-button"
          type="button"
          onClick={onContinue}
          disabled={submitting}>
          Continue
          <ArrowRight size={17} aria-hidden="true" />
        </button>
      ) : (
        <button
          className="onboarding-continue-button"
          type="button"
          onClick={onComplete}
          disabled={submitting}>
          {submitting ? "Saving..." : "Complete Setup"}
          {!submitting && <Check size={17} aria-hidden="true" />}
        </button>
      )}
    </footer>
  )
}
