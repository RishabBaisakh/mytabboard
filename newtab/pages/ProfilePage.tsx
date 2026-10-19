import {
  BookOpen,
  Compass,
  Heart,
  Lightbulb,
  Palette,
  Pencil,
  RefreshCw,
  Sparkles,
  Target,
  X,
  Zap
} from "lucide-react"
import { useState } from "react"
import type { CSSProperties } from "react"

import { getOptionVisual } from "../../components/optionVisuals"
import { PROFILE_AVATAR_URL } from "../../components/profileAvatar"
import { ApiError } from "../../services/api"
import { profileService, type ProfileFields } from "../../services/profile"
import { useAppDispatch, useAppSelector } from "../../store/hooks"
import { loadProfile, profileUpdated } from "../../store/profileSlice"

import "../../styles/pages/profile.css"

const interestIcons = [Palette, Target, BookOpen, Lightbulb, Compass]
const interestTones = ["coral", "green", "blue", "amber", "teal"]
type ProfileEditor = "display_name" | "bio" | "interests" | "personality_tags"

const journeyMilestones = [
  { label: "Stay curious", detail: "The beginning", tone: "amber" },
  { label: "Find my rhythm", detail: "The practice", tone: "teal" },
  { label: "Make it matter", detail: "The direction", tone: "coral" }
]

function ProfilePage() {
  const dispatch = useAppDispatch()
  const profile = useAppSelector((state) => state.profile.profile)
  const options = useAppSelector((state) => state.profile.options)
  const profileStatus = useAppSelector((state) => state.profile.status)
  const loadError = useAppSelector((state) => state.profile.error)
  const [activeEditor, setActiveEditor] = useState<ProfileEditor | null>(null)
  const [editorDraft, setEditorDraft] = useState<string | number[]>("")
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [saveError, setSaveError] = useState("")
  const [saveMessage, setSaveMessage] = useState("")
  const [isSaving, setIsSaving] = useState(false)

  function openEditor(editor: ProfileEditor) {
    if (!profile) return
    setActiveEditor(editor)
    setErrors({})
    setSaveError("")
    setEditorDraft(
      editor === "display_name"
        ? profile.display_name
        : editor === "bio"
          ? profile.bio
          : [...profile[editor]]
    )
  }

  function toggleEditorOption(id: number) {
    setEditorDraft((current) => {
      if (!Array.isArray(current)) return current
      return current.includes(id)
        ? current.filter((selectedId) => selectedId !== id)
        : [...current, id]
    })
    if (activeEditor)
      setErrors((current) => ({ ...current, [activeEditor]: "" }))
    setSaveError("")
  }

  async function saveEditor() {
    if (!profile || !activeEditor || isSaving) return

    setIsSaving(true)
    setErrors({})
    setSaveError("")
    setSaveMessage("")
    try {
      const changes: Partial<ProfileFields> =
        activeEditor === "display_name"
          ? { display_name: String(editorDraft) }
          : activeEditor === "bio"
            ? { bio: String(editorDraft) }
            : { [activeEditor]: editorDraft as number[] }
      const savedProfile = await profileService.save({ ...profile, ...changes })
      dispatch(profileUpdated({ ...profile, ...savedProfile }))
      setActiveEditor(null)
      setSaveMessage("Profile saved.")
    } catch (error) {
      const fieldErrors = getServerFieldErrors(error)
      setErrors(fieldErrors)
      setSaveError(
        Object.values(fieldErrors).join(" ") ||
          (error instanceof Error
            ? error.message
            : "Unable to save your profile. Please try again.")
      )
    } finally {
      setIsSaving(false)
    }
  }

  if (profileStatus === "idle" || profileStatus === "loading") {
    return (
      <section className="profile-page" aria-labelledby="profile-page-title">
        <h1 id="profile-page-title">My corner of the world</h1>
        <p className="profile-state-message" role="status">
          Loading your profile...
        </p>
      </section>
    )
  }

  if (profileStatus === "failed" || !profile || !options) {
    return (
      <section className="profile-page" aria-labelledby="profile-page-title">
        <h1 id="profile-page-title">My corner of the world</h1>
        <div className="profile-feedback profile-feedback-error" role="alert">
          {loadError || "Your profile is unavailable right now."}
        </div>
        <button
          className="profile-save-button"
          type="button"
          onClick={() => void dispatch(loadProfile())}>
          <RefreshCw size={15} aria-hidden="true" />
          Try again
        </button>
      </section>
    )
  }

  const selectedPersonalityTags = options.personality_tags.filter((option) =>
    profile.personality_tags.includes(option.id)
  )
  const selectedInterests = options.interests.filter((option) =>
    profile.interests.includes(option.id)
  )

  return (
    <section className="profile-page" aria-labelledby="profile-page-title">
      <article className="profile-identity-card">
        <div className="profile-portrait-wrap">
          <img
            className="profile-portrait"
            src={PROFILE_AVATAR_URL}
            alt="Profile avatar"
          />
        </div>
        <div className="profile-identity-copy">
          <div className="profile-name-row">
            <h2>
              <button
                className="profile-name-trigger"
                type="button"
                onClick={() => openEditor("display_name")}>
                {profile.display_name || "Your name"}
              </button>
            </h2>
            <button
              className="profile-edit-button"
              type="button"
              aria-label="Edit display name"
              title="Edit display name"
              onClick={() => openEditor("display_name")}>
              <Pencil size={15} aria-hidden="true" />
            </button>
          </div>
          <p className="profile-time-zone-value">
            {profile.time_zone || "Time zone not set"}
          </p>
        </div>
        <span className="profile-card-mark" aria-hidden="true">
          {profile.display_name
            .trim()
            .split(/\s+/)
            .slice(0, 2)
            .map((namePart) => namePart[0]?.toUpperCase() ?? "")
            .join("") || "?"}
        </span>
      </article>

      <div className="profile-snapshot-grid">
        <section
          className="profile-snapshot profile-focus"
          aria-labelledby="focus-title">
          <span className="profile-snapshot-icon" aria-hidden="true">
            <Target size={19} />
          </span>
          <div>
            <p className="profile-eyebrow">Right now</p>
            <h2 id="focus-title">Current focus</h2>
            <p className="profile-snapshot-text">
              Build a kinder routine: make room for deep work and real rest.
            </p>
          </div>
        </section>
        <section
          className="profile-snapshot profile-vibe"
          aria-labelledby="vibe-title">
          <span className="profile-snapshot-icon" aria-hidden="true">
            <Heart size={19} />
          </span>
          <div>
            <p className="profile-eyebrow">The energy</p>
            <h2 id="vibe-title">My vibe</h2>
            <p className="profile-snapshot-text">
              {selectedPersonalityTags.length > 0
                ? selectedPersonalityTags.map((tag) => tag.label).join(", ")
                : "Choose a few personality tags that feel like you."}
            </p>
          </div>
          <Zap className="profile-vibe-spark" size={18} aria-hidden="true" />
        </section>
      </div>

      <section className="profile-about" aria-labelledby="about-title">
        <div className="profile-about-accent" aria-hidden="true" />
        <div>
          <p className="profile-eyebrow">In a nutshell</p>
          <div className="profile-section-title-row">
            <h2 id="about-title">A little about me</h2>
            <button
              className="profile-edit-button"
              type="button"
              aria-label="Edit bio"
              title="Edit bio"
              onClick={() => openEditor("bio")}>
              <Pencil size={15} aria-hidden="true" />
            </button>
          </div>
          <p className="profile-bio-value">
            {profile.bio || "No bio added yet."}
          </p>
        </div>
      </section>

      <section className="profile-interests" aria-labelledby="interests-title">
        <div className="profile-section-heading">
          <div>
            <p className="profile-eyebrow">Things I keep coming back to</p>
            <h2 id="interests-title">Current interests</h2>
          </div>
          <button
            className="profile-edit-button"
            type="button"
            aria-label="Edit interests"
            title="Edit interests"
            onClick={() => openEditor("interests")}>
            <Pencil size={15} aria-hidden="true" />
          </button>
        </div>
        <ul className="profile-interest-list">
          {selectedInterests.map((interest, index) => {
            const Icon = interestIcons[index % interestIcons.length]
            return (
              <li key={interest.id}>
                <span
                  className={`interest-tag interest-${interestTones[index % interestTones.length]}`}>
                  <Icon size={15} strokeWidth={1.9} aria-hidden="true" />
                  {interest.label}
                </span>
              </li>
            )
          })}
        </ul>
        {selectedInterests.length === 0 && (
          <p className="profile-empty-selection">No interests selected yet.</p>
        )}
      </section>

      <section
        className="profile-personality"
        aria-labelledby="personality-title">
        <div className="profile-section-heading">
          <div>
            <p className="profile-eyebrow">How I think and work</p>
            <h2 id="personality-title">Personality tags</h2>
          </div>
          <button
            className="profile-edit-button"
            type="button"
            aria-label="Edit personality tags"
            title="Edit personality tags"
            onClick={() => openEditor("personality_tags")}>
            <Pencil size={15} aria-hidden="true" />
          </button>
        </div>
        <div
          className="profile-personality-options"
          aria-label="Personality tags">
          {selectedPersonalityTags.map((tag) => {
            const visual = getOptionVisual(tag.label)
            const TagIcon = visual.icon
            return (
              <span className="profile-personality-tag" key={tag.id}>
                <span
                  className="profile-option-icon"
                  style={{ "--option-accent": visual.color } as CSSProperties}
                  aria-hidden="true">
                  <TagIcon size={14} strokeWidth={2} />
                </span>
                {tag.label}
              </span>
            )
          })}
        </div>
        {selectedPersonalityTags.length === 0 && (
          <p className="profile-empty-selection">
            No personality tags selected yet.
          </p>
        )}
      </section>
      {saveMessage && (
        <p className="profile-feedback" role="status">
          {saveMessage}
        </p>
      )}
      {activeEditor && (
        <div
          className="profile-dialog-backdrop"
          onClick={() => !isSaving && setActiveEditor(null)}
          onKeyDown={(event) => {
            if (event.key === "Escape" && !isSaving) setActiveEditor(null)
          }}>
          <section
            className="profile-edit-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="profile-dialog-title"
            onClick={(event) => event.stopPropagation()}>
            <header className="profile-dialog-header">
              <h2 id="profile-dialog-title">
                {activeEditor === "display_name"
                  ? "Edit display name"
                  : activeEditor === "bio"
                    ? "Edit bio"
                    : activeEditor === "interests"
                      ? "Edit interests"
                      : "Edit personality tags"}
              </h2>
              <button
                className="profile-edit-button"
                type="button"
                aria-label="Close dialog"
                disabled={isSaving}
                onClick={() => setActiveEditor(null)}>
                <X size={18} aria-hidden="true" />
              </button>
            </header>
            {activeEditor === "display_name" && (
              <label className="profile-dialog-field">
                Display name
                <input
                  autoFocus
                  value={String(editorDraft)}
                  onChange={(event) =>
                    setEditorDraft(event.currentTarget.value)
                  }
                  aria-invalid={Boolean(errors.display_name)}
                  aria-describedby={
                    errors.display_name ? "profile-name-error" : undefined
                  }
                />
                {errors.display_name && (
                  <span className="profile-field-error" id="profile-name-error">
                    {errors.display_name}
                  </span>
                )}
              </label>
            )}
            {activeEditor === "bio" && (
              <label className="profile-dialog-field">
                Bio
                <textarea
                  autoFocus
                  rows={5}
                  value={String(editorDraft)}
                  onChange={(event) =>
                    setEditorDraft(event.currentTarget.value)
                  }
                  aria-invalid={Boolean(errors.bio)}
                  aria-describedby={
                    errors.bio ? "profile-bio-error" : undefined
                  }
                />
                {errors.bio && (
                  <span className="profile-field-error" id="profile-bio-error">
                    {errors.bio}
                  </span>
                )}
              </label>
            )}
            {(activeEditor === "interests" ||
              activeEditor === "personality_tags") && (
              <fieldset className="profile-dialog-options">
                <legend>
                  {activeEditor === "interests"
                    ? "Choose your interests"
                    : "Choose your personality tags"}
                </legend>
                {(activeEditor === "interests"
                  ? options.interests
                  : options.personality_tags
                ).map((option) => {
                  const selectedIds = Array.isArray(editorDraft)
                    ? editorDraft
                    : []
                  const inputId = `profile-option-${activeEditor}-${option.id}`
                  const visual = getOptionVisual(option.label)
                  const OptionIcon = visual.icon
                  return (
                    <label
                      className="profile-dialog-option"
                      htmlFor={inputId}
                      key={option.id}>
                      <input
                        id={inputId}
                        type="checkbox"
                        checked={selectedIds.includes(option.id)}
                        onChange={() => toggleEditorOption(option.id)}
                      />
                      <span
                        className="profile-option-icon"
                        style={
                          {
                            "--option-accent": visual.color
                          } as CSSProperties
                        }
                        aria-hidden="true">
                        <OptionIcon size={14} strokeWidth={2} />
                      </span>
                      <span>{option.label}</span>
                    </label>
                  )
                })}
              </fieldset>
            )}
            {saveError && (
              <p
                className="profile-feedback profile-feedback-error"
                role="alert">
                {saveError}
              </p>
            )}
            <footer className="profile-dialog-actions">
              <button
                className="profile-dialog-cancel"
                type="button"
                disabled={isSaving}
                onClick={() => setActiveEditor(null)}>
                Cancel
              </button>
              <button
                className="profile-save-button"
                type="button"
                disabled={isSaving}
                onClick={saveEditor}>
                {isSaving ? "Saving..." : "Save changes"}
              </button>
            </footer>
          </section>
        </div>
      )}
    </section>
  )
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

export default ProfilePage
