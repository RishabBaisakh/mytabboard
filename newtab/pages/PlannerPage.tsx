import { CalendarDays, ChevronDown, Plus } from "lucide-react"
import React from "react"

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
  }
]

const weekTasks = [
  { day: "MON", title: "Review weekly priorities" },
  { day: "TUE", title: "Prepare product design concepts" },
  { day: "WED", title: "Meet with the product team" },
  { day: "THU", title: "Finish dashboard updates" },
  { day: "FRI", title: "Share the weekly progress recap" }
]

function PlannerPage() {
  const [selectedView, setSelectedView] = React.useState("Day")
  const [plannerTasks, setPlannerTasks] = React.useState(dayTasks)
  const [selectedDate, setSelectedDate] = React.useState(() => {
    const today = new Date()
    today.setMinutes(today.getMinutes() - today.getTimezoneOffset())
    return today.toISOString().slice(0, 10)
  })
  const [isQuickAddOpen, setIsQuickAddOpen] = React.useState(false)
  const [newTaskTitle, setNewTaskTitle] = React.useState("")
  const [newTaskTime, setNewTaskTime] = React.useState("16:00")
  const dateLabel = new Date(`${selectedDate}T00:00:00`).toLocaleDateString(
    undefined,
    {
      weekday: "long",
      month: "short",
      day: "numeric",
      year: "numeric"
    }
  )
  const selectedDay = new Date(`${selectedDate}T00:00:00`)
  const dayHeading = selectedDay.toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric"
  })

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
        <div className="planner-header-controls">
          <label className="planner-date-control" title="Choose date">
            <CalendarDays size={18} strokeWidth={1.8} aria-hidden="true" />
            <time dateTime={selectedDate}>{dateLabel}</time>
            <ChevronDown size={16} strokeWidth={1.8} aria-hidden="true" />
            <input
              className="planner-date-input"
              type="date"
              aria-label="Choose date"
              value={selectedDate}
              onChange={(event) => setSelectedDate(event.currentTarget.value)}
            />
          </label>
          <div
            className="planner-view-switcher"
            role="group"
            aria-label="Planner view">
            {["Day", "Week", "Month"].map((view) => (
              <button
                key={view}
                type="button"
                aria-pressed={selectedView === view}
                onClick={() => setSelectedView(view)}>
                {view}
              </button>
            ))}
          </div>
        </div>
      </header>

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
            {weekTasks.map(({ day, title }) => (
              <li className="planner-week-task" key={day}>
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
