import { useState, type FormEvent } from "react"
import { Link } from "react-router-dom"

function SignupPage() {
  const [feedback, setFeedback] = useState("")

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setFeedback("Account creation is not connected yet.")
  }

  return (
    <form className="auth-form" onSubmit={handleSubmit}>
      <h2>Create your account</h2>
      <label className="auth-field">
        Your name
        <input
          type="text"
          name="name"
          placeholder="Your name"
          autoComplete="name"
          required
        />
      </label>
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
      <button className="auth-submit" type="submit">
        Create account
      </button>
      <p className="auth-feedback" role="status" aria-live="polite">
        {feedback}
      </p>
      <p className="auth-switch">
        Already have an account? <Link to="/login">Sign in</Link>
      </p>
    </form>
  )
}

export default SignupPage
