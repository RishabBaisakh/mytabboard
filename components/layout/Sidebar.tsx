import {
  CalendarDays,
  LayoutDashboard,
  ListTodo,
  Newspaper,
  Settings,
  Target
} from "lucide-react"
import { NavLink } from "react-router-dom"

import { PROFILE_AVATAR_URL } from "../profileAvatar"

const links = [
  { label: "Dashboard", path: "/", icon: LayoutDashboard },
  { label: "Planner", path: "/planner", icon: CalendarDays },
  { label: "Tasks", path: "/tasks", icon: ListTodo },
  { label: "Goals", path: "/goals", icon: Target },
  { label: "News & Insights", path: "/newsandinsights", icon: Newspaper },
  { label: "Settings", path: "/settings", icon: Settings }
]

export function Sidebar() {
  return (
    <aside className="sidebar">
      <h2>TabBoard</h2>

      <nav className="sidebar-nav">
        {links.map((link) => (
          <NavLink
            key={link.path}
            to={link.path}
            end={link.path === "/"}
            className={({ isActive }) =>
              isActive ? "nav-link is-active" : "nav-link"
            }>
            <link.icon
              className="nav-icon"
              size={18}
              strokeWidth={1.8}
              aria-hidden="true"
            />
            {link.label}
            {link.path === "/" && (
              <span className="nav-badge" aria-label="3 notifications">
                3
              </span>
            )}
          </NavLink>
        ))}
      </nav>

      <NavLink className="sidebar-profile" to="/profile">
        <img
          className="profile-avatar"
          src={PROFILE_AVATAR_URL}
          alt=""
          aria-hidden="true"
        />
        <span className="profile-name">John Doe</span>
      </NavLink>
    </aside>
  )
}
