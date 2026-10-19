import type { OnboardingData } from "../../services/onboardingTypes"
import { SelectableOptions } from "./SelectableOptions"

type QuestionnaireStepProps = {
  data: OnboardingData
  answers: Record<string, number[]>
  errors: Record<string, string>
  onToggle: (questionKey: string, optionId: number) => void
}

export function QuestionnaireStep({
  data,
  answers,
  errors,
  onToggle
}: QuestionnaireStepProps) {
  return (
    <div className="onboarding-step-content">
      <header className="onboarding-step-heading">
        <h1>A little more about you</h1>
        <p>Answer a few questions to help tailor your plans.</p>
      </header>

      {data.questions.length === 0 ? (
        <p>No questions are available right now.</p>
      ) : (
        <section className="onboarding-questions" aria-label="Your questions">
          {data.questions.map((question) => {
            const selectedIds = answers[question.key] ?? []
            const selectionLimit =
              question.selection_type === "single" ? 1 : question.max_selections

            return (
              <fieldset className="onboarding-question" key={question.id}>
                <legend>
                  {question.prompt}
                  {question.required && (
                    <span className="required-mark" aria-label="required">
                      {" "}
                      *
                    </span>
                  )}
                </legend>
                <p className="onboarding-question-hint">
                  {question.selection_type === "single"
                    ? "Choose one option"
                    : `Choose up to ${selectionLimit}`}
                </p>
                <SelectableOptions
                  label={question.prompt}
                  options={question.options}
                  selectedIds={selectedIds}
                  maxSelections={selectionLimit}
                  onToggle={(optionId) => onToggle(question.key, optionId)}
                />
                {errors[question.key] && (
                  <p className="onboarding-inline-error" role="alert">
                    {errors[question.key]}
                  </p>
                )}
              </fieldset>
            )
          })}
        </section>
      )}
    </div>
  )
}
