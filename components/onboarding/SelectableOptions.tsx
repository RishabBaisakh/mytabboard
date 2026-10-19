import type { CSSProperties } from "react"

import { getOptionVisual } from "~components/optionVisuals"

import type { OnboardingOption } from "../../services/onboardingTypes"

type SelectableOptionsProps = {
  label: string
  options: OnboardingOption[]
  selectedIds: number[]
  maxSelections: number
  onToggle: (id: number) => void
}

export function SelectableOptions({
  label,
  options,
  selectedIds,
  maxSelections,
  onToggle
}: SelectableOptionsProps) {
  return (
    <div className="onboarding-options" role="group" aria-label={label}>
      {options.map((option) => {
        const isSelected = selectedIds.includes(option.id)
        const atLimit = selectedIds.length >= maxSelections
        const visual = getOptionVisual(option.label)
        const OptionIcon = visual.icon

        return (
          <button
            key={option.id}
            className={`onboarding-option${isSelected ? " is-selected" : ""}`}
            type="button"
            aria-pressed={isSelected}
            disabled={atLimit && !isSelected}
            onClick={() => onToggle(option.id)}>
            <span
              className="onboarding-option-icon"
              style={{ "--option-accent": visual.color } as CSSProperties}
              aria-hidden="true">
              <OptionIcon size={15} strokeWidth={2} />
            </span>
            <span>{option.label}</span>
          </button>
        )
      })}
    </div>
  )
}
