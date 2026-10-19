import { useEffect, useState } from "react"
import { Navigate, Outlet, useLocation } from "react-router-dom"

import { ApiError } from "../../services/api"
import { authService } from "../../services/auth"
import { onboardingService } from "../../services/onboarding"

type SessionGuardProps = {
  guestOnly?: boolean
  onboardingOnly?: boolean
}

type SessionStatus =
  | "checking"
  | "authenticated"
  | "onboarding"
  | "anonymous"
  | "error"

export function SessionGuard({
  guestOnly = false,
  onboardingOnly = false
}: SessionGuardProps) {
  const location = useLocation()
  const [attempt, setAttempt] = useState(0)
  const [status, setStatus] = useState<SessionStatus>("checking")
  const [errorMessage, setErrorMessage] = useState("")

  useEffect(() => {
    let isCurrent = true
    setStatus("checking")
    setErrorMessage("")

    async function checkSession() {
      try {
        const hasTokens = await authService.hasStoredTokens()
        if (!hasTokens) {
          if (isCurrent) setStatus("anonymous")
          return
        }

        await authService.currentUser()
        const onboarding = await onboardingService.status()
        if (isCurrent) {
          setStatus(onboarding.is_complete ? "authenticated" : "onboarding")
        }
      } catch (error) {
        if (!isCurrent) return

        if (error instanceof ApiError && error.status === 401) {
          setStatus("anonymous")
          return
        }

        setErrorMessage(
          error instanceof Error
            ? error.message
            : "Unable to verify your session right now."
        )
        setStatus("error")
      }
    }

    void checkSession()
    return () => {
      isCurrent = false
    }
  }, [attempt])

  if (status === "checking") {
    return (
      <main className="auth-layout">
        <section className="auth-card" role="status" aria-live="polite">
          Checking your session...
        </section>
      </main>
    )
  }

  if (status === "error" && !guestOnly) {
    return (
      <main className="auth-layout">
        <section className="auth-card" aria-live="polite">
          <p className="auth-feedback" role="alert">
            {errorMessage}
          </p>
          <button
            className="auth-submit"
            type="button"
            onClick={() => setAttempt((current) => current + 1)}>
            Retry
          </button>
        </section>
      </main>
    )
  }

  if (guestOnly && status === "authenticated") {
    return <Navigate to="/" replace />
  }

  if (guestOnly && status === "onboarding") {
    return <Navigate to="/onboarding" replace />
  }

  if (onboardingOnly && status === "authenticated") {
    return <Navigate to="/" replace />
  }

  if (!guestOnly && status === "anonymous") {
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  if (!guestOnly && !onboardingOnly && status === "onboarding") {
    return <Navigate to="/onboarding" replace />
  }

  if (onboardingOnly && status === "anonymous") {
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  if (onboardingOnly && status === "onboarding") {
    return <Outlet />
  }

  return <Outlet />
}
