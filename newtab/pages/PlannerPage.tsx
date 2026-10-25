import { ArrowLeft, ArrowRight, Check, Plus } from "lucide-react"
import React from "react"

import { tasksService } from "../../services/tasks"
import { calculateTaskSchedule } from "../../services/taskScheduling"
import { useAppDispatch, useAppSelector } from "../../store/hooks"
import {
  loadTasks,
  selectAllTasks,
  selectTasksError,
  selectTasksStatus,
  taskCreated,
  taskUpdated
} from "../../store/tasksSlice"
import {
  dateForViewChange,
  formatPlannerDay,
  formatPlannerWeek,
  getLocalDate,
  getWeekStart,
  navigateCalendarPeriod,
  toLocalDateValue,
  type PlannerView
} from "./plannerCalendar"
import { getDayTimelineItems, getWeekItems } from "./plannerTasks"

import "../../styles/pages/planner.css"

function PlannerPage() {
  const [selectedView, setSelectedView] = React.useState<PlannerView>("Day")
  const dispatch = useAppDispatch()
  const tasks = useAppSelector(selectAllTasks)
  const tasksStatus = useAppSelector(selectTasksStatus)
  const tasksError = useAppSelector(selectTasksError)
  const isLoading = tasksStatus === "idle" || tasksStatus === "loading"
  const [actionError, setActionError] = React.useState("")
  const [isAdding, setIsAdding] = React.useState(false)
  const [pendingIds, setPendingIds] = React.useState<Set<string>>(
    () => new Set()
  )
  const [selectedDate, setSelectedDate] = React.useState(() =>
    getLocalDate(new Date())
  )
  const [isQuickAddOpen, setIsQuickAddOpen] = React.useState(false)
  const [newTaskTitle, setNewTaskTitle] = React.useState("")
  const [newTaskTime, setNewTaskTime] = React.useState("16:00")
  const timelineItems = getDayTimelineItems(tasks, selectedDate)
  const weekItems = getWeekItems(tasks, selectedDate)
  const dayHeading = selectedDate.toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric"
  })
  const dateLabel =
    selectedView === "Day"
      ? formatPlannerDay(selectedDate)
      : formatPlannerWeek(selectedDate)

  function navigatePeriod(direction: -1 | 1) {
    setSelectedDate((currentDate) =>
      navigateCalendarPeriod(currentDate, selectedView, direction)
    )
  }

  function changeView(view: PlannerView) {
    setSelectedDate((currentDate) =>
      dateForViewChange(currentDate, selectedView, view)
    )
    setSelectedView(view)
  }

  function goToToday() {
    setSelectedDate(getLocalDate(new Date()))
  }

  React.useEffect(() => {
    void dispatch(loadTasks())
  }, [dispatch])

  async function addTask(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const title = newTaskTitle.trim()
    if (!title || isAdding) return

    setIsAdding(true)
    setActionError("")
    try {
      const schedule = calculateTaskSchedule(
        toLocalDateValue(selectedDate),
        newTaskTime,
        60
      )
      const created = await tasksService.create({
        title,
        description: "",
        status: "todo",
        priority: "medium",
        goal: null,
        ...schedule
      })
      dispatch(taskCreated(created))
      setNewTaskTitle("")
      setNewTaskTime("16:00")
      setIsQuickAddOpen(false)
    } catch (error) {
      setActionError(
        error instanceof Error ? error.message : "Unable to add this task."
      )
    } finally {
      setIsAdding(false)
    }
  }

  async function toggleDone(id: string, done: boolean) {
    if (pendingIds.has(id)) return
    setPendingIds((current) => new Set(current).add(id))
    setActionError("")
    try {
      const updated = await tasksService.update(id, {
        status: done ? "todo" : "completed"
      })
      dispatch(taskUpdated(updated))
    } catch (error) {
      setActionError(
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

  return (
    <section className="planner-page" aria-labelledby="planner-title">
      <header className="page-header planner-page-header">
        <div>
          <h1 id="planner-title">Planner</h1>
          <p className="page-subtitle">
            Organize your day, week, and long-term goals.
          </p>
        </div>
      </header>

      <nav className="planner-calendar-nav" aria-label="Calendar navigation">
        <div
          className="planner-view-switcher"
          role="group"
          aria-label="Calendar view">
          {(["Day", "Week"] as const).map((view) => (
            <button
              key={view}
              type="button"
              aria-pressed={selectedView === view}
              onClick={() => changeView(view)}>
              {view}
            </button>
          ))}
        </div>
        <div className="planner-date-navigation">
          <button
            className="planner-date-arrow"
            type="button"
            aria-label={
              selectedView === "Day" ? "Previous day" : "Previous week"
            }
            title={selectedView === "Day" ? "Previous day" : "Previous week"}
            onClick={() => navigatePeriod(-1)}>
            <ArrowLeft size={18} aria-hidden="true" />
          </button>
          <time
            className="planner-date-label"
            dateTime={toLocalDateValue(
              selectedView === "Week"
                ? getWeekStart(selectedDate)
                : selectedDate
            )}
            aria-live="polite">
            {dateLabel}
          </time>
          <button
            className="planner-date-arrow"
            type="button"
            aria-label={selectedView === "Day" ? "Next day" : "Next week"}
            title={selectedView === "Day" ? "Next day" : "Next week"}
            onClick={() => navigatePeriod(1)}>
            <ArrowRight size={18} aria-hidden="true" />
          </button>
        </div>
        <button
          className="planner-today-button"
          type="button"
          onClick={goToToday}>
          Today
        </button>
      </nav>

      <div className="planner-actions">
        <button
          className="planner-quick-add"
          type="button"
          onClick={() => setIsQuickAddOpen(true)}>
          <Plus size={16} strokeWidth={2} aria-hidden="true" />
          Quick add
        </button>
      </div>

      <div className="planner-content-grid">
        <section
          className="planner-section"
          aria-labelledby="planner-day-title">
          <header className="planner-section-header">
            <p>Daily schedule</p>
            <h2 id="planner-day-title">{dayHeading}</h2>
          </header>
          {isLoading ? (
            <p className="planner-state-message" role="status">
              Loading tasks...
            </p>
          ) : tasksError ? (
            <div className="planner-state-message" role="alert">
              <p>{tasksError}</p>
              <button type="button" onClick={() => void dispatch(loadTasks())}>
                Try again
              </button>
            </div>
          ) : timelineItems.length === 0 ? (
            <p className="planner-state-message">
              No tasks scheduled for this day.
            </p>
          ) : (
            <ol className="planner-timeline">
              {timelineItems.map(
                ({ id, time, timeRange, title, detail, tone }) => (
                  <li className={`planner-timeline-item tone-${tone}`} key={id}>
                    <time title={timeRange}>{time}</time>
                    <span className="planner-timeline-bar" aria-hidden="true" />
                    <div className="planner-timeline-copy">
                      <h3>{title}</h3>
                      <span>{detail}</span>
                    </div>
                  </li>
                )
              )}
            </ol>
          )}
          {actionError && (
            <p className="planner-state-message" role="alert">
              {actionError}
            </p>
          )}
        </section>

        <section
          className="planner-section"
          aria-labelledby="planner-week-title">
          <header className="planner-section-header planner-week-header">
            <h2 id="planner-week-title">This Week</h2>
          </header>
          {isLoading || tasksError ? null : weekItems.length === 0 ? (
            <p className="planner-state-message">
              No tasks scheduled for this week.
            </p>
          ) : (
            <ul className="planner-week-list">
              {weekItems.map(({ id, day, title, done }) => (
                <li className="planner-week-task" key={id}>
                  <button
                    className="planner-week-check"
                    type="button"
                    role="checkbox"
                    aria-checked={done}
                    disabled={pendingIds.has(id)}
                    aria-label={
                      done
                        ? `Mark ${title} incomplete`
                        : `Mark ${title} complete`
                    }
                    onClick={() => void toggleDone(id, done)}>
                    {done && (
                      <Check size={12} strokeWidth={2.5} aria-hidden="true" />
                    )}
                  </button>
                  <span>{day}</span>
                  <p title={title}>{title}</p>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      {isQuickAddOpen && (
        <div className="planner-dialog-backdrop">
          <section
            className="planner-quick-add-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="planner-quick-add-title">
            <h2 id="planner-quick-add-title">Add a task</h2>
            <form onSubmit={addTask}>
              <label>
                Task
                <input
                  autoFocus
                  required
                  value={newTaskTitle}
                  onChange={(event) =>
                    setNewTaskTitle(event.currentTarget.value)
                  }
                  placeholder="What needs to get done?"
                />
              </label>
              <label>
                Time
                <input
                  type="time"
                  value={newTaskTime}
                  onChange={(event) =>
                    setNewTaskTime(event.currentTarget.value)
                  }
                />
              </label>
              <div className="planner-quick-add-actions">
                <button type="button" onClick={() => setIsQuickAddOpen(false)}>
                  Cancel
                </button>
                <button type="submit" disabled={isAdding}>
                  Add task
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </section>
  )
}

export default PlannerPage
