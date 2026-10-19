import { useEffect } from "react"
import { Outlet } from "react-router-dom"

import { useAppDispatch } from "../../store/hooks"
import { loadProfile } from "../../store/profileSlice"
import { Sidebar } from "./Sidebar"

export function AppLayout() {
  const dispatch = useAppDispatch()

  useEffect(() => {
    void dispatch(loadProfile())
  }, [dispatch])

  return (
    <div className="app-layout">
      <Sidebar />

      <main className="main-content">
        <Outlet />
      </main>
    </div>
  )
}
