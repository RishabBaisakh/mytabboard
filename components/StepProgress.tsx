export type StepProgressStep = {
  id: string
  label: string
  complete: boolean
}

type StepProgressProps = {
  steps: StepProgressStep[]
  label: string
}

// One equal-width segment per step; completed steps are filled green.
export function StepProgress({ steps, label }: StepProgressProps) {
  const completed = steps.filter((step) => step.complete).length

  return (
    <div className="step-progress">
      <div
        className="step-progress-track"
        role="progressbar"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={steps.length}
        aria-valuenow={completed}
        aria-valuetext={`${completed} of ${steps.length} complete`}>
        {steps.map((step) => (
          <span
            key={step.id}
            className={`step-progress-step${step.complete ? " is-complete" : ""}`}
            title={`${step.label}${step.complete ? " (complete)" : ""}`}
          />
        ))}
      </div>
    </div>
  )
}
