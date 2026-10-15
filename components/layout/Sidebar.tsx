import { NavLink } from "react-router-dom"

const links = [
  { label: "Dashboard", path: "/" },
  { label: "Goals", path: "/goals" },
  { label: "Tasks", path: "/tasks" },
  { label: "News & Insights", path: "/newsandinsights" },
  { label: "Profile", path: "/profile" },
  { label: "Settings", path: "/settings" }
]

export function Sidebar() {
  return (
    <aside className="sidebar">
      <h2>MyTabBoard</h2>

      <nav className="sidebar-nav">
        {links.map((link) => (
          <NavLink
            key={link.path}
            to={link.path}
            end={link.path === "/"}
            className={({ isActive }) =>
              isActive ? "nav-link is-active" : "nav-link"
            }>
            {link.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  )
}
