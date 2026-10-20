import { ArrowLeft, ArrowRight, Check, Plus } from "lucide-react"
import React from "react"

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

import "../../styles/pages/planner.css"

const dayTasks = [
  {
    time: "8:30 AM",
    title: "Plan the day",
    detail: "Set your priorities",
    tone: "blue"
  },
  {
    time: "10:00 AM",
    title: "Product design sync",
    detail: "Review the latest concepts",
    tone: "teal"
  },
  {
    time: "1:00 PM",
    title: "Focus time",
    detail: "Work on dashboard updates",
    tone: "amber"
  },
  {
    time: "3:30 PM",
    title: "Team check-in",
    detail: "Share progress and next steps",
    tone: "coral"
  },
  {
    time: "10:00 AM",
    title: "Product design sync",
    detail: "Review the latest concepts",
    tone: "teal"
  },
  {
    time: "1:00 PM",
    title: "Focus time",
    detail: "Work on dashboard updates",
    tone: "amber"
  },
  {
    time: "3:30 PM",
    title: "Team check-in",
    detail: "Share progress and next steps",
    tone: "coral"
  }
]

const weekTasks = [
  { day: "MON", title: "Review weekly priorities", done: true },
  { day: "TUE", title: "Prepare product design concepts", done: false },
  { day: "WED", title: "Meet with the product team", done: true },
  { day: "THU", title: "Finish dashboard updates", done: false },
  { day: "FRI", title: "Share the weekly progress recap", done: false }
]

function PlannerPage() {
  const [selectedView, setSelectedView] = React.useState<PlannerView>("Day")
  const [plannerTasks, setPlannerTasks] = React.useState(dayTasks)
  const [weeklyTasks, setWeeklyTasks] = React.useState(weekTasks)
  const [selectedDate, setSelectedDate] = React.useState(() =>
    getLocalDate(new Date())
  )
  const [isQuickAddOpen, setIsQuickAddOpen] = React.useState(false)
  const [newTaskTitle, setNewTaskTitle] = React.useState("")
  const [newTaskTime, setNewTaskTime] = React.useState("16:00")
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

  function addTask(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const title = newTaskTitle.trim()
    if (!title) return

    const time = new Date(`1970-01-01T${newTaskTime}:00`).toLocaleTimeString(
      undefined,
      { hour: "numeric", minute: "2-digit" }
    )
    setPlannerTasks((tasks) => [
      ...tasks,
      { time, title, detail: "Added to your schedule", tone: "blue" }
    ])
    setNewTaskTitle("")
    setNewTaskTime("16:00")
    setIsQuickAddOpen(false)
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
          <ol className="planner-timeline">
            {plannerTasks.map(({ time, title, detail, tone }) => (
              <li
                className={`planner-timeline-item tone-${tone}`}
                key={`${time}-${title}`}>
                <time>{time}</time>
                <span className="planner-timeline-bar" aria-hidden="true" />
                <div className="planner-timeline-copy">
                  <h3>{title}</h3>
                  <span>{detail}</span>
                </div>
              </li>
            ))}
          </ol>
        </section>

        <section
          className="planner-section"
          aria-labelledby="planner-week-title">
          <header className="planner-section-header planner-week-header">
            <h2 id="planner-week-title">This Week</h2>
          </header>
          <ul className="planner-week-list">
            {weeklyTasks.map(({ day, title, done }) => (
              <li className="planner-week-task" key={day}>
                <button
                  className="planner-week-check"
                  type="button"
                  role="checkbox"
                  aria-checked={done}
                  aria-label={
                    done ? `Mark ${title} incomplete` : `Mark ${title} complete`
                  }
                  onClick={() =>
                    setWeeklyTasks((tasks) =>
                      tasks.map((task) =>
                        task.day === day ? { ...task, done: !task.done } : task
                      )
                    )
                  }>
                  {done && (
                    <Check size={12} strokeWidth={2.5} aria-hidden="true" />
                  )}
                </button>
                <span>{day}</span>
                <p title={title}>{title}</p>
              </li>
            ))}
          </ul>
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
                <button type="submit">Add task</button>
              </div>
            </form>
          </section>
        </div>
      )}
    </section>
  )
}

export default PlannerPage
