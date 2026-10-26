import {
  ArrowRight,
  Bell,
  Bot,
  CalendarDays,
  Clock3,
  Lightbulb,
  ListPlus,
  Search,
  Sparkles,
  Target
} from "lucide-react"
import React from "react"
import { Link } from "react-router-dom"

import { ShortcutsWidget } from "../../components/ShortcutsWidget"
import { StepProgress } from "../../components/StepProgress"
import { WeatherWidget } from "../../components/WeatherWidget"
import { isTaskCompleted, tasksService } from "../../services/tasks"
import { useAppDispatch, useAppSelector } from "../../store/hooks"
import { taskUpdated } from "../../store/tasksSlice"
import { getScheduledTasks } from "./plannerTasks"
import { useTodayTasks } from "./useTodayTasks"

import "../../styles/pages/dashboard.css"

const quickActions = [
  {
    label: "Add task",
    detail: "Capture a to-do",
    icon: ListPlus,
    to: "/tasks"
  },
  {
    label: "Add goal",
    detail: "Set a new target",
    icon: Target,
    to: "/goals"
  },
  {
    label: "Browse ideas",
    detail: "Find inspiration",
    icon: Lightbulb,
    to: "/newsandinsights"
  },
  {
    label: "Open AI assistant",
    detail: "Coming soon",
    icon: Bot
  }
]

function formatTime(value: string) {
  return new Date(value).toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit"
  })
}

function DashboardPage() {
  const dispatch = useAppDispatch()
  const today = useTodayTasks()
  const [pendingIds, setPendingIds] = React.useState<Set<string>>(
    () => new Set()
  )
  const [toggleError, setToggleError] = React.useState("")
  const todayItems = getScheduledTasks(today.tasks).map(({ task }) => task)
  const completedCount = todayItems.filter(isTaskCompleted).length

  async function toggleTask(id: string, complete: boolean) {
    if (pendingIds.has(id)) return
    setPendingIds((current) => new Set(current).add(id))
    setToggleError("")
    try {
      const updated = await tasksService.update(id, {
        status: complete ? "completed" : "todo"
      })
      today.replaceTask(updated)
      dispatch(taskUpdated(updated))
    } catch (error) {
      setToggleError(
        error instanceof Error ? error.message : "Unable to update this task."
      )
    } finally {
      setPendingIds((current) => {
        const next = new Set(current)
        next.delete(id)
        return next
      })
    }
  }

  const displayName = useAppSelector(
    (state) => state.profile.profile?.display_name
  )
  const currentDate = new Date()
  const hour = currentDate.getHours()
  const greeting =
    hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening"
  const firstName = displayName?.trim().split(/\s+/)[0]
  const dateLabel = currentDate.toLocaleDateString(undefined, {
    weekday: "long",
    month: "short",
    day: "numeric",
    year: "numeric"
  })

  return (
    <section className="dashboard-page" aria-labelledby="dashboard-title">
      <div className="dashboard-topbar">
        <form className="dashboard-search" role="search">
          <Search
            className="dashboard-search-icon"
            size={18}
            aria-hidden="true"
          />
          <label className="visually-hidden" htmlFor="dashboard-search">
            Search your workspace
          </label>
          <input
            id="dashboard-search"
            type="search"
            placeholder="Search your workspace..."
          />
        </form>
        <div className="dashboard-tools">
          <WeatherWidget />
          <time className="dashboard-date" dateTime={currentDate.toISOString()}>
            {dateLabel}
          </time>
          <button
            className="dashboard-notifications"
            type="button"
            aria-label="Notifications, 3 unread"
            title="Notifications">
            <Bell size={19} strokeWidth={1.8} aria-hidden="true" />
            <span className="notification-badge" aria-hidden="true">
              3
            </span>
          </button>
        </div>
      </div>
      <header className="page-header">
        <h1 id="dashboard-title">
          {greeting}
          {firstName ? `, ${firstName}` : ""}! 👋
        </h1>
        <p className="page-subtitle">
          Small steps every day lead to big results.
        </p>
      </header>

      <div className="dashboard-grid">
        <section
          className="dashboard-primary"
          aria-label="Main dashboard workspace">
          <section
            className="today-progress"
            aria-labelledby="today-progress-title">
            <header className="today-progress-header">
              <h2 id="today-progress-title">Today&apos;s progress</h2>
              {today.status === "succeeded" && todayItems.length > 0 && (
                <p>
                  {completedCount} of {todayItems.length} tasks complete
                </p>
              )}
            </header>
            {today.status === "loading" && today.tasks.length === 0 ? (
              <div
                className="today-progress-skeleton"
                role="status"
                aria-label="Loading today's progress"
              />
            ) : today.status === "failed" ? (
              <div className="today-progress-message" role="alert">
                <span>{today.error}</span>
                <button type="button" onClick={today.reload}>
                  Try again
                </button>
              </div>
            ) : todayItems.length === 0 ? (
              <p className="today-progress-message">
                No tasks scheduled for today.
              </p>
            ) : (
              <StepProgress
                label="Today's task completion"
                steps={todayItems.map((task) => ({
                  id: task.id,
                  label: task.title,
                  complete: isTaskCompleted(task)
                }))}
              />
            )}
          </section>
          <div className="workspace-lower">
            <section className="planner-promo" aria-labelledby="planner-title">
              <div className="planner-promo-copy">
                <p className="planner-eyebrow">Make room for what matters</p>
                <h2 id="planner-title">Build the life you want</h2>
                <p className="planner-tagline">
                  <span>Stay focused, stay consistent, stay you.</span>
                </p>
                <Link className="planner-link" to="/planner">
                  View planner
                  <ArrowRight size={16} aria-hidden="true" />
                </Link>
              </div>
            </section>

            <section
              className="quick-actions"
              aria-labelledby="quick-actions-title">
              <header className="quick-actions-heading">
                <div>
                  <h2 id="quick-actions-title">Quick actions</h2>
                  <p>A little momentum goes a long way</p>
                </div>
              </header>
              <div className="quick-actions-list">
                {quickActions.map(({ label, detail, icon: Icon, to }) => {
                  const content = (
                    <>
                      <span className="quick-action-icon" aria-hidden="true">
                        <Icon size={19} strokeWidth={1.8} />
                      </span>
                      <span className="quick-action-copy">
                        <span className="quick-action-label">{label}</span>
                        <span className="quick-action-detail">{detail}</span>
                      </span>
                      {to && (
                        <ArrowRight
                          className="quick-action-arrow"
                          size={15}
                          aria-hidden="true"
                        />
                      )}
                    </>
                  )

                  return to ? (
                    <Link className="quick-action" key={label} to={to}>
                      {content}
                    </Link>
                  ) : (
                    <div
                      className="quick-action quick-action-disabled"
                      key={label}
                      aria-label={`${label}, ${detail}`}>
                      {content}
                    </div>
                  )
                })}
              </div>
            </section>
          </div>
        </section>

        <aside className="dashboard-side" aria-label="Daily overview">
          <section className="dashboard-panel" aria-labelledby="schedule-title">
            <header className="panel-heading">
              <div>
                <h2 id="schedule-title">Today&apos;s Schedule</h2>
                <p>What&apos;s on your agenda</p>
              </div>
              <CalendarDays size={19} aria-hidden="true" />
            </header>

            {today.status === "loading" && today.tasks.length === 0 ? (
              <p className="schedule-state" role="status">
                Loading tasks...
              </p>
            ) : today.status === "failed" ? (
              <p className="schedule-state" role="alert">
                {today.error}
              </p>
            ) : todayItems.length === 0 ? (
              <p className="schedule-state">Nothing scheduled for today.</p>
            ) : (
              <ul className="schedule-list">
                {todayItems.map((task) => {
                  const done = isTaskCompleted(task)
                  return (
                    <li className="schedule-item" key={task.id}>
                      <label className="schedule-check">
                        <input
                          type="checkbox"
                          checked={done}
                          disabled={pendingIds.has(task.id)}
                          onChange={() => void toggleTask(task.id, !done)}
                          aria-label={`${task.title}: ${done ? "complete" : "incomplete"}`}
                        />
                      </label>
                      <div className="schedule-details">
                        <p className="schedule-title">{task.title}</p>
                        <div className="schedule-meta">
                          <span>
                            <Clock3 size={13} aria-hidden="true" />
                            {formatTime(task.scheduled_start)} –{" "}
                            {formatTime(task.scheduled_end)}
                          </span>
                        </div>
                      </div>
                    </li>
                  )
                })}
              </ul>
            )}
            {toggleError && (
              <p className="schedule-state" role="alert">
                {toggleError}
              </p>
            )}
          </section>
        </aside>
      </div>
      <ShortcutsWidget />
    </section>
  )
}

export default DashboardPage
