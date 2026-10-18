import { HashRouter, Navigate, Route, Routes } from "react-router-dom"

import { AppLayout } from "~components/layout/AppLayout"
import { AuthLayout } from "~components/layout/AuthLayout"
import { SessionGuard } from "~components/layout/SessionGuard"

import "../styles/globals.css"

import DashboardPage from "./pages/DashboardPage"
import GoalsPage from "./pages/GoalsPage"
import LoginPage from "./pages/LoginPage"
import NewsInsightsPage from "./pages/NewsInsightsPage"
import PlannerPage from "./pages/PlannerPage"
import ProfilePage from "./pages/ProfilePage"
import SettingsPage from "./pages/SettingsPage"
import SignupPage from "./pages/SignupPage"
import TasksPage from "./pages/TasksPage"

export default function NewTab() {
  return (
    <HashRouter>
      <>
        <Routes>
          <Route element={<SessionGuard guestOnly />}>
            <Route element={<AuthLayout />}>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/signup" element={<SignupPage />} />
            </Route>
          </Route>
          <Route element={<SessionGuard />}>
            <Route element={<AppLayout />}>
              <Route path="/" element={<DashboardPage />} />
              <Route path="/planner" element={<PlannerPage />} />
              <Route path="/goals" element={<GoalsPage />} />
              <Route path="/tasks" element={<TasksPage />} />
              <Route path="/newsandinsights" element={<NewsInsightsPage />} />
              <Route path="/profile" element={<ProfilePage />} />
              <Route path="/settings" element={<SettingsPage />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
          </Route>
        </Routes>
      </>
    </HashRouter>
  )
}
