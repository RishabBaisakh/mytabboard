import {
  CalendarDays,
  LayoutDashboard,
  ListTodo,
  Newspaper,
  PanelLeftClose,
  PanelLeftOpen,
  Settings,
  Target
} from "lucide-react"
import { NavLink } from "react-router-dom"

import { useAppSelector } from "../../store/hooks"
import { PROFILE_AVATAR_URL } from "../profileAvatar"

const links = [
  { label: "Dashboard", path: "/", icon: LayoutDashboard },
  { label: "Planner", path: "/planner", icon: CalendarDays },
  { label: "Tasks", path: "/tasks", icon: ListTodo },
  { label: "Goals", path: "/goals", icon: Target },
  { label: "News & Insights", path: "/newsandinsights", icon: Newspaper },
  { label: "Settings", path: "/settings", icon: Settings }
]

type SidebarProps = {
  collapsed: boolean
  onToggle: () => void
}

export function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const displayName = useAppSelector(
    (state) => state.profile.profile?.display_name
  )
  const ToggleIcon = collapsed ? PanelLeftOpen : PanelLeftClose
  const toggleLabel = collapsed ? "Expand sidebar" : "Collapse sidebar"

  return (
    <aside className={`sidebar${collapsed ? " is-collapsed" : ""}`}>
      <div className="sidebar-header">
        <h2>TabBoard</h2>
        <button
          className="sidebar-toggle"
          type="button"
          aria-label={toggleLabel}
          data-tooltip={collapsed ? toggleLabel : undefined}
          onClick={onToggle}>
          <ToggleIcon size={18} strokeWidth={1.8} aria-hidden="true" />
        </button>
      </div>

      <nav className="sidebar-nav" aria-label="Main navigation">
        {links.map((link) => (
          <NavLink
            key={link.path}
            to={link.path}
            end={link.path === "/"}
            data-tooltip={collapsed ? link.label : undefined}
            className={({ isActive }) =>
              isActive ? "nav-link is-active" : "nav-link"
            }>
            <link.icon
              className="nav-icon"
              size={18}
              strokeWidth={1.8}
              aria-hidden="true"
            />
            <span className="nav-label">{link.label}</span>
            {link.path === "/" && (
              <span className="nav-badge" aria-label="3 notifications">
                3
              </span>
            )}
          </NavLink>
        ))}
      </nav>

      <NavLink
        className="sidebar-profile"
        to="/profile"
        aria-label={displayName ? `Profile: ${displayName}` : "Profile"}
        data-tooltip={collapsed ? displayName || "Profile" : undefined}>
        <img
          className="profile-avatar"
          src={PROFILE_AVATAR_URL}
          alt=""
          aria-hidden="true"
        />
        <span className="profile-name">{displayName || ""}</span>
      </NavLink>
    </aside>
  )
}
