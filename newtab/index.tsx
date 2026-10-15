import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom"

import { AppLayout } from "~components/layout/AppLayout"

import DashboardPage from "./pages/DashboardPage"
import GoalsPage from "./pages/GoalsPage"
import NewsInsightsPage from "./pages/NewsInsightsPage"
import ProfilePage from "./pages/ProfilePage"
import SettingsPage from "./pages/SettingsPage"
import TasksPage from "./pages/TasksPage"

export default function NewTab() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppLayout />}>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/goals" element={<GoalsPage />} />
          <Route path="/tasks" element={<TasksPage />} />
          <Route path="/newsandinsights" element={<NewsInsightsPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
