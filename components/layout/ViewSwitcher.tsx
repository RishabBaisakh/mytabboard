import { useLocation, useNavigate } from "react-router-dom"

export function ViewSwitcher() {
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const isAuthView = pathname === "/login" || pathname === "/signup"

  return (
    <nav className="view-switcher" aria-label="Preview layout">
      <button
        type="button"
        aria-pressed={isAuthView}
        onClick={() => navigate("/login")}>
        Auth
      </button>
      <button
        type="button"
        aria-pressed={!isAuthView}
        onClick={() => navigate("/")}>
        App
      </button>
    </nav>
  )
}
