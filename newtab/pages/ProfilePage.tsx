import {
  BookOpen,
  Compass,
  Heart,
  Lightbulb,
  Palette,
  Sparkles,
  Target,
  Zap
} from "lucide-react"
import React from "react"

import { PROFILE_AVATAR_URL } from "../../components/profileAvatar"

import "../../styles/pages/profile.css"

const profileTags = ["Product thinker", "Habit builder", "Curious mind"]

const interests = [
  { label: "Design systems", icon: Palette, tone: "coral" },
  { label: "Tiny habits", icon: Target, tone: "green" },
  { label: "Good books", icon: BookOpen, tone: "blue" },
  { label: "New ideas", icon: Lightbulb, tone: "amber" },
  { label: "Exploring", icon: Compass, tone: "teal" }
]

const journeyMilestones = [
  { label: "Stay curious", detail: "The beginning", tone: "amber" },
  { label: "Find my rhythm", detail: "The practice", tone: "teal" },
  { label: "Make it matter", detail: "The direction", tone: "coral" }
]

function ProfilePage() {
  return (
    <section className="profile-page" aria-labelledby="profile-page-title">
      <header className="profile-page-heading">
        <div>
          <p className="profile-eyebrow">A work in progress</p>
          <h1 id="profile-page-title">My corner of the world</h1>
          <p className="profile-page-subtitle">
            The person behind the plans, projects, and small daily wins.
          </p>
        </div>
        <Sparkles
          className="profile-heading-sparkle"
          size={26}
          aria-hidden="true"
        />
      </header>

      <section className="profile-journey" aria-labelledby="journey-title">
        <div className="profile-section-heading">
          <div>
            <p className="profile-eyebrow">A few chapters so far</p>
            <h2 id="journey-title">My journey</h2>
          </div>
          <span className="journey-note">Still becoming</span>
        </div>
        <ol className="profile-journey-list">
          {journeyMilestones.map(({ label, detail, tone }, index) => (
            <li className={`journey-step journey-${tone}`} key={label}>
              <span className="journey-step-marker" aria-hidden="true">
                {index + 1}
              </span>
              <div>
                <h3>{label}</h3>
                <p>{detail}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <article className="profile-identity-card">
        <div className="profile-portrait-wrap">
          <img
            className="profile-portrait"
            src={PROFILE_AVATAR_URL}
            alt="Cartoon portrait of John Doe"
          />
        </div>
        <div className="profile-identity-copy">
          <p className="profile-eyebrow">The human behind TabBoard</p>
          <h2>John Doe</h2>
          <p className="profile-handle">
            @johndoe <span>·</span> Portland, OR
          </p>
          <div className="profile-tags" aria-label="Profile tags">
            {profileTags.map((tag) => (
              <span key={tag}>{tag}</span>
            ))}
          </div>
        </div>
        <span className="profile-card-mark" aria-hidden="true">
          JD
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
              Curious, quietly ambitious, and happiest when making things.
            </p>
          </div>
          <Zap className="profile-vibe-spark" size={18} aria-hidden="true" />
        </section>
      </div>

      <section className="profile-about" aria-labelledby="about-title">
        <div className="profile-about-accent" aria-hidden="true" />
        <div>
          <p className="profile-eyebrow">In a nutshell</p>
          <h2 id="about-title">A little about me</h2>
          <p>
            I’m a product-minded maker who likes turning fuzzy ideas into
            thoughtful experiences. Outside the screen, you’ll find me
            collecting books, taking the long way home, and learning to slow
            down enough to notice the good stuff.
          </p>
        </div>
      </section>

      <section className="profile-interests" aria-labelledby="interests-title">
        <div className="profile-section-heading">
          <div>
            <p className="profile-eyebrow">Things I keep coming back to</p>
            <h2 id="interests-title">Current interests</h2>
          </div>
        </div>
        <ul className="profile-interest-list">
          {interests.map(({ label, icon: Icon, tone }) => (
            <li className={`interest-tag interest-${tone}`} key={label}>
              <Icon size={15} strokeWidth={1.9} aria-hidden="true" />
              {label}
            </li>
          ))}
        </ul>
      </section>
    </section>
  )
}

export default ProfilePage
