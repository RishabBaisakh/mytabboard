import type { OnboardingData } from "../../services/onboardingTypes"
import { SelectableOptions } from "./SelectableOptions"

type PersonalityStepProps = {
  data: OnboardingData
  selectedIds: number[]
  error?: string
  onToggle: (id: number) => void
}

export function PersonalityStep({
  data,
  selectedIds,
  error,
  onToggle
}: PersonalityStepProps) {
  return (
    <div className="onboarding-step-content">
      <header className="onboarding-step-heading">
        <h1>How would you describe yourself?</h1>
        <p>
          Choose the traits that best describe how you think, learn, and work.
        </p>
      </header>

      <div className="onboarding-selection-meta">
        <span>Choose all that feel like you</span>
        <strong aria-live="polite">{selectedIds.length} selected</strong>
      </div>
      <SelectableOptions
        label="Personality traits"
        options={data.personality_tags.options}
        selectedIds={selectedIds}
        maxSelections={3}
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
