import { useState, type FormEvent } from "react"
import { Link } from "react-router-dom"

function LoginPage() {
  const [feedback, setFeedback] = useState("")

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setFeedback("Authentication is not connected yet.")
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
      <button className="auth-submit" type="submit">
        Sign in
      </button>
      <p className="auth-feedback" role="status" aria-live="polite">
        {feedback}
      </p>
      <p className="auth-switch">
        New to TabBoard? <Link to="/signup">Create an account</Link>
      </p>
    </form>
  )
}

export default LoginPage
