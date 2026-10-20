import { useEffect, useState } from "react"
import { Outlet } from "react-router-dom"

import { useAppDispatch } from "../../store/hooks"
import { loadProfile } from "../../store/profileSlice"
import { Sidebar } from "./Sidebar"

const SIDEBAR_COLLAPSED_KEY = "tabboard.sidebarCollapsed"

export function AppLayout() {
  const dispatch = useAppDispatch()
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(
    () => localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === "true"
  )

  useEffect(() => {
    void dispatch(loadProfile())
  }, [dispatch])

  function toggleSidebar() {
    const next = !isSidebarCollapsed
    localStorage.setItem(SIDEBAR_COLLAPSED_KEY, String(next))
    setIsSidebarCollapsed(next)
  }

  return (
    <div
      className={`app-layout${isSidebarCollapsed ? " is-sidebar-collapsed" : ""}`}>
      <Sidebar collapsed={isSidebarCollapsed} onToggle={toggleSidebar} />

      <main className="main-content">
        <Outlet />
      </main>
    </div>
  )
}
