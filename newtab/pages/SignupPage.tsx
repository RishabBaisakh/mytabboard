import { useState, type FormEvent } from "react"
import { Link, useNavigate } from "react-router-dom"

import { GoogleSignInButton } from "../../components/GoogleSignInButton"
import { authService } from "../../services/auth"

function SignupPage() {
  const navigate = useNavigate()
  const [feedback, setFeedback] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const email = String(form.get("email") ?? "").trim()
    const password = String(form.get("password") ?? "")
    const confirmPassword = String(form.get("confirmPassword") ?? "")
    setFeedback("")

    if (password !== confirmPassword) {
      setFeedback("Passwords do not match.")
      return
    }

    setIsLoading(true)

    try {
      await authService.signup({
        username: email.split("@")[0],
        email,
        password
      })
      navigate("/", { replace: true })
    } catch (error) {
      setFeedback(
        error instanceof Error
          ? error.message
          : "Unable to create your account right now."
      )
    } finally {
      setIsLoading(false)
    }
  }

  async function handleGoogleSignIn() {
    setFeedback("")
    setIsLoading(true)

    try {
      await authService.loginWithGoogle()
      navigate("/", { replace: true })
    } catch (error) {
      setFeedback(
        error instanceof Error
          ? error.message
          : "Unable to sign in with Google."
      )
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form className="auth-form" onSubmit={handleSubmit}>
      <h2>Create your account</h2>
      <label className="auth-field">
        Email address
        <input
          type="email"
          name="email"
          placeholder="you@example.com"
          autoComplete="email"
          required
        />
      </label>
      <label className="auth-field">
        Password
        <input
          type="password"
          name="password"
          placeholder="Create a password"
          autoComplete="new-password"
          minLength={8}
          required
        />
      </label>
      <label className="auth-field">
        Confirm password
        <input
          type="password"
          name="confirmPassword"
          placeholder="Enter your password again"
          autoComplete="new-password"
          minLength={8}
          required
        />
      </label>
      <button className="auth-submit" type="submit" disabled={isLoading}>
        {isLoading ? "Creating account..." : "Create account"}
      </button>
      <div className="auth-divider">
        <span>or continue with</span>
      </div>
      <GoogleSignInButton onClick={handleGoogleSignIn} disabled={isLoading} />
      <p className="auth-feedback" role="alert" aria-live="polite">
        {feedback}
      </p>
      <p className="auth-switch">
        Already have an account? <Link to="/login">Sign in</Link>
      </p>
    </form>
  )
}

export default SignupPage
