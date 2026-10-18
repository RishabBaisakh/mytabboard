import { useState, type FormEvent } from "react"
import { Link, useNavigate } from "react-router-dom"

import { GoogleSignInButton } from "../../components/GoogleSignInButton"
import { authService } from "../../services/auth"

function LoginPage() {
  const navigate = useNavigate()
  const [feedback, setFeedback] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    setFeedback("")
    setIsLoading(true)

    try {
      await authService.login({
        email: String(form.get("email") ?? ""),
        password: String(form.get("password") ?? "")
      })
      navigate("/", { replace: true })
    } catch (error) {
      setFeedback(
        error instanceof Error ? error.message : "Unable to sign in right now."
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
      <h2>Sign in</h2>
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
          placeholder="Enter your password"
          autoComplete="current-password"
          required
        />
      </label>
      <button className="auth-submit" type="submit" disabled={isLoading}>
        {isLoading ? "Signing in..." : "Sign in"}
      </button>
      <div className="auth-divider">
        <span>or continue with</span>
      </div>
      <GoogleSignInButton onClick={handleGoogleSignIn} disabled={isLoading} />
      <p className="auth-feedback" role="alert" aria-live="polite">
        {feedback}
      </p>
      <p className="auth-switch">
        New to TabBoard? <Link to="/signup">Create an account</Link>
      </p>
    </form>
  )
}

export default LoginPage
