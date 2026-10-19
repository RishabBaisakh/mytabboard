import { Check } from "lucide-react"

const STEPS = [
  "Basic Info",
  "Your Questions",
  "Current Interests",
  "Personality"
]

type OnboardingSidebarProps = {
  activeStep: number
}

export function OnboardingSidebar({ activeStep }: OnboardingSidebarProps) {
  return (
    <aside className="onboarding-sidebar" aria-label="Onboarding progress">
      <a
        className="onboarding-brand"
        href="#/onboarding"
        aria-label="TabBoard onboarding">
        <span className="onboarding-brand-mark" aria-hidden="true">
          T
        </span>
        <span>TabBoard</span>
      </a>

      <div className="onboarding-progress-copy">
        <span>YOUR STARTING POINT</span>
        <p>Good plans start with knowing what matters.</p>
      </div>

      <ol className="onboarding-step-list">
        {STEPS.map((title, index) => {
          const isComplete = index < activeStep
          const isActive = index === activeStep

          return (
            <li
              className={`onboarding-step${isActive ? " is-active" : ""}${isComplete ? " is-complete" : ""}`}
              key={title}
              aria-current={isActive ? "step" : undefined}>
              <span className="onboarding-step-marker">
                {isComplete ? (
                  <Check size={16} aria-hidden="true" />
                ) : (
                  index + 1
                )}
              </span>
              <span className="onboarding-step-title">{title}</span>
              {index < STEPS.length - 1 && (
                <span className="onboarding-step-line" aria-hidden="true" />
              )}
            </li>
          )
        })}
      </ol>

      <div className="onboarding-sidebar-footer">
        <div
          className="onboarding-progress-bar"
          role="progressbar"
          aria-label="Onboarding progress"
          aria-valuemin={1}
          aria-valuemax={STEPS.length}
          aria-valuenow={activeStep + 1}>
          <span
            style={{ width: `${((activeStep + 1) / STEPS.length) * 100}%` }}
          />
        </div>
        <span>
          Step {activeStep + 1} of {STEPS.length}
        </span>
      </div>
    </aside>
  )
}
