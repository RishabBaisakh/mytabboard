import { Outlet } from "react-router-dom"

export function AuthLayout() {
  return (
    <main className="auth-layout">
      <p className="auth-brand">TabBoard</p>
      <section className="auth-card" aria-labelledby="auth-title">
        <header className="auth-heading">
          <h1 id="auth-title">Welcome to TabBoard</h1>
          <p>
            Your AI-powered new tab workspace for tasks, planning, insights and
            daily productivity
          </p>
        </header>
        <Outlet />
      </section>
    </main>
  )
}
