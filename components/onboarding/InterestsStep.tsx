import type { OnboardingData } from "../../services/onboardingTypes"
import { SelectableOptions } from "./SelectableOptions"

type InterestsStepProps = {
  data: OnboardingData
  selectedIds: number[]
  error?: string
  onToggle: (id: number) => void
}

export function InterestsStep({
  data,
  selectedIds,
  error,
  onToggle
}: InterestsStepProps) {
  return (
    <div className="onboarding-step-content">
      <header className="onboarding-step-heading">
        <h1>What are you interested in?</h1>
        <p>
          Choose the interests you'd like MyTabBoard to consider when
          personalizing your plans.
        </p>
      </header>

      <div className="onboarding-selection-meta">
        <span>Choose all that interest you</span>
        <strong aria-live="polite">{selectedIds.length} selected</strong>
      </div>
      <SelectableOptions
        label="Interests"
        options={data.interests.options}
        selectedIds={selectedIds}
        maxSelections={5}
        onToggle={onToggle}
      />
      {error && (
        <p className="onboarding-inline-error" role="alert">
          {error}
        </p>
      )}
    </div>
  )
}
