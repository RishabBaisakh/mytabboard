import type { OnboardingData } from "../../services/onboardingTypes"
import { PROFILE_AVATAR_URL } from "../profileAvatar"

type BasicInfoStepProps = {
  data: OnboardingData
  errors: Record<string, string>
  onProfileChange: (field: "display_name" | "bio", value: string) => void
}

export function BasicInfoStep({
  data,
  errors,
  onProfileChange
}: BasicInfoStepProps) {
  return (
    <div className="onboarding-step-content">
      <div className="onboarding-avatar-block">
        <img
          className="onboarding-avatar"
          src={PROFILE_AVATAR_URL}
          alt="Default profile avatar"
        />
        <span>YOUR PROFILE</span>
      </div>
      <header className="onboarding-step-heading">
        <h1>What should we call you?</h1>
        <p>
          Add a name and a little about yourself. You can update this later.
        </p>
      </header>

      <section className="onboarding-profile-fields" aria-label="Basic info">
        <label className="onboarding-input-field">
          Display name
          <input
            autoComplete="name"
            value={data.profile.display_name}
            onChange={(event) =>
              onProfileChange("display_name", event.currentTarget.value)
            }
            aria-invalid={Boolean(errors.display_name)}
            aria-describedby={
              errors.display_name ? "display-name-error" : undefined
            }
          />
          {errors.display_name && (
            <span className="onboarding-inline-error" id="display-name-error">
              {errors.display_name}
            </span>
          )}
        </label>
        <label className="onboarding-input-field onboarding-bio-field">
          Bio <span className="onboarding-optional-label">(Optional)</span>
          <textarea
            value={data.profile.bio}
            maxLength={240}
            rows={4}
            placeholder="A little about what you do or what matters to you..."
            onChange={(event) =>
              onProfileChange("bio", event.currentTarget.value)
            }
            aria-label="Bio"
          />
          <span className="onboarding-character-count">
            {data.profile.bio.length} / 240
          </span>
        </label>
      </section>
    </div>
  )
}
