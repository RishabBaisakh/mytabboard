import {
  ChevronRight,
  CreditCard,
  LayoutDashboard,
  LogOut,
  Palette,
  Sun,
  UserRound
} from "lucide-react"
import React from "react"
import { Link, useNavigate } from "react-router-dom"

import { authService } from "../../services/auth"
import "../../styles/pages/settings.css"

function SettingsPage() {
  const navigate = useNavigate()
  const [theme, setTheme] = React.useState("System")
  const [startPage, setStartPage] = React.useState("Dashboard")
  const [isLoggingOut, setIsLoggingOut] = React.useState(false)

  async function handleLogout() {
    setIsLoggingOut(true)
    try {
      await authService.logout()
      navigate("/login", { replace: true })
    } finally {
      setIsLoggingOut(false)
    }
  }

  return (
    <section className="settings-page" aria-labelledby="settings-title">
      <header className="page-header">
        <h1 id="settings-title">Settings</h1>
        <p className="page-subtitle">Customize your TabBoard experience.</p>
      </header>
      <div className="settings-content">
        <section className="settings-section" aria-labelledby="account-title">
          <h2 id="account-title">Account</h2>
          <div className="settings-options">
            <Link className="settings-option" to="/profile">
              <span className="settings-option-icon" aria-hidden="true">
                <UserRound size={18} />
              </span>
              <span className="settings-option-copy">
                <strong>Profile Information</strong>
                <span>Update your name, email, and profile details.</span>
              </span>
              <ChevronRight
                className="settings-option-arrow"
                size={18}
                aria-hidden="true"
              />
            </Link>
            <div className="settings-option">
              <span className="settings-option-icon" aria-hidden="true">
                <CreditCard size={18} />
              </span>
              <span className="settings-option-copy">
                <strong>Subscription</strong>
                <span>Manage your plan and billing.</span>
              </span>
            </div>
          </div>
        </section>

        <section
          className="settings-section"
          aria-labelledby="appearance-title">
          <div className="settings-section-heading">
            <h2 id="appearance-title">Appearance</h2>
          </div>
          <div className="settings-controls">
            <label className="settings-control-row" htmlFor="settings-theme">
              <span className="settings-control-label">
                <span
                  className="settings-control-icon settings-control-icon-theme"
                  aria-hidden="true">
                  <Sun size={17} />
                </span>
                Theme
              </span>
              <select
                id="settings-theme"
                value={theme}
                onChange={(event) => setTheme(event.currentTarget.value)}>
                <option>System</option>
                <option>Light</option>
                <option>Dark</option>
              </select>
            </label>
            <label
              className="settings-control-row"
              htmlFor="settings-start-page">
              <span className="settings-control-label">
                <span
                  className="settings-control-icon settings-control-icon-start"
                  aria-hidden="true">
                  <LayoutDashboard size={17} />
                </span>
                Start Page
              </span>
              <select
                id="settings-start-page"
                value={startPage}
                onChange={(event) => setStartPage(event.currentTarget.value)}>
                <option>Dashboard</option>
                <option>Planner</option>
                <option>Tasks</option>
                <option>Goals</option>
                <option>News &amp; Insights</option>
              </select>
            </label>
          </div>
        </section>
      </div>
      <div className="settings-page-footer">
        <button
          className="settings-logout"
          type="button"
          onClick={handleLogout}
          disabled={isLoggingOut}>
          <LogOut size={17} strokeWidth={1.9} aria-hidden="true" />
          Log out
        </button>
      </div>
    </section>
  )
}

export default SettingsPage
