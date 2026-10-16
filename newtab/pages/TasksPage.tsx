import { CalendarDays, MoreHorizontal, Plus } from "lucide-react"
import React from "react"

import "../../styles/pages/tasks.css"

type TaskCategory = "Work" | "Personal" | "Health" | "Learning"
type TaskFilter = "All" | "Today" | "Upcoming" | "Completed"

type Task = {
  id: string
  title: string
  category: TaskCategory
  dueDate: string
  dueTime: string
  completed: boolean
}

function toDateInputValue(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

function getDateOffset(offset: number) {
  const date = new Date()
  date.setDate(date.getDate() + offset)
  return toDateInputValue(date)
}

const today = getDateOffset(0)

const initialTasks: Task[] = [
  {
    id: "task-1",
    title: "Review project brief",
    category: "Work",
    dueDate: today,
    dueTime: "10:00",
    completed: false
  },
  {
    id: "task-2",
    title: "Morning run",
    category: "Health",
    dueDate: today,
    dueTime: "07:30",
    completed: true
  },
  {
    id: "task-3",
    title: "Read a chapter",
    category: "Learning",
    dueDate: today,
    dueTime: "20:00",
    completed: false
  },
  {
    id: "task-4",
    title: "Pick up groceries",
    category: "Personal",
    dueDate: getDateOffset(1),
    dueTime: "17:30",
    completed: false
  },
  {
    id: "task-5",
    title: "Send weekly update",
    category: "Work",
    dueDate: getDateOffset(-1),
    dueTime: "16:00",
    completed: true
  }
]

function TasksPage() {
  const [tasks, setTasks] = React.useState(initialTasks)
  const [activeFilter, setActiveFilter] = React.useState<TaskFilter>("All")
  const [isAddDialogOpen, setIsAddDialogOpen] = React.useState(false)
  const [openMenuId, setOpenMenuId] = React.useState<string | null>(null)
  const [newTitle, setNewTitle] = React.useState("")
  const [newCategory, setNewCategory] = React.useState<TaskCategory>("Work")
  const [newDate, setNewDate] = React.useState(today)
  const [newTime, setNewTime] = React.useState("09:00")

  const counts: Record<TaskFilter, number> = {
    All: tasks.length,
    Today: tasks.filter((task) => task.dueDate === today).length,
    Upcoming: tasks.filter((task) => task.dueDate > today && !task.completed)
      .length,
    Completed: tasks.filter((task) => task.completed).length
  }

  const visibleTasks = tasks.filter((task) => {
    if (activeFilter === "Today") return task.dueDate === today
    if (activeFilter === "Upcoming") {
      return task.dueDate > today && !task.completed
    }
    if (activeFilter === "Completed") return task.completed
    return true
  })

  function toggleTask(taskId: string) {
    setTasks((currentTasks) =>
      currentTasks.map((task) =>
        task.id === taskId ? { ...task, completed: !task.completed } : task
      )
    )
  }

  function addTask(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const title = newTitle.trim()
    if (!title) return

    setTasks((currentTasks) => [
      {
        id: String(Date.now()),
        title,
        category: newCategory,
        dueDate: newDate,
        dueTime: newTime,
        completed: false
      },
      ...currentTasks
    ])
    setNewTitle("")
    setNewCategory("Work")
    setNewDate(today)
    setNewTime("09:00")
    setIsAddDialogOpen(false)
    setActiveFilter("All")
  }

  function deleteTask(taskId: string) {
    setTasks((currentTasks) =>
      currentTasks.filter((task) => task.id !== taskId)
    )
    setOpenMenuId(null)
  }

  return (
    <section className="tasks-page" aria-labelledby="tasks-title">
      <header className="page-header tasks-page-header">
        <div>
          <h1 id="tasks-title">Tasks</h1>
          <p className="page-subtitle">
            Manage your tasks and stay productive.
          </p>
        </div>
        <button
          className="tasks-add-button"
          type="button"
          onClick={() => setIsAddDialogOpen(true)}>
          <Plus size={17} strokeWidth={2} aria-hidden="true" />
          Add task
        </button>
      </header>

      <div className="tasks-main">
        <div
          className="tasks-filter-row"
          role="group"
          aria-label="Filter tasks">
          {(["All", "Today", "Upcoming", "Completed"] as const).map(
            (filter) => (
              <button
                className="tasks-filter-button"
                key={filter}
                type="button"
                aria-pressed={activeFilter === filter}
                onClick={() => setActiveFilter(filter)}>
                {filter}
                <span>({counts[filter]})</span>
              </button>
            )
          )}
        </div>

        <ul className="tasks-list" aria-label={`${activeFilter} tasks`}>
          {visibleTasks.map((task) => {
            const dueDate = new Date(`${task.dueDate}T${task.dueTime}:00`)
            const dateLabel = dueDate.toLocaleString(undefined, {
              month: "short",
              day: "numeric",
              hour: "numeric",
              minute: "2-digit"
            })

            return (
              <li className="tasks-list-row" key={task.id}>
                <input
                  className="tasks-checkbox"
                  type="checkbox"
                  checked={task.completed}
                  aria-label={`${task.completed ? "Reopen" : "Complete"} ${task.title}`}
                  onChange={() => toggleTask(task.id)}
                />
                <span
                  className={`tasks-title${task.completed ? " is-completed" : ""}`}
                  title={task.title}>
                  {task.title}
                </span>
                <span
                  className={`tasks-tag tasks-tag-${task.category.toLowerCase()}`}>
                  {task.category}
                </span>
                <time
                  className="tasks-due-date"
                  dateTime={`${task.dueDate}T${task.dueTime}`}>
                  <CalendarDays size={14} aria-hidden="true" />
                  {dateLabel}
                </time>
                <div className="tasks-row-menu-wrap">
                  <button
                    className="tasks-more-button"
                    type="button"
                    aria-label={`More options for ${task.title}`}
                    aria-haspopup="menu"
                    aria-expanded={openMenuId === task.id}
                    onClick={() =>
                      setOpenMenuId((currentId) =>
                        currentId === task.id ? null : task.id
                      )
                    }>
                    <MoreHorizontal size={19} aria-hidden="true" />
                  </button>
                  {openMenuId === task.id && (
                    <div className="tasks-row-menu" role="menu">
                      <button
                        type="button"
                        role="menuitem"
                        onClick={() => {
                          toggleTask(task.id)
                          setOpenMenuId(null)
                        }}>
                        {task.completed ? "Mark incomplete" : "Mark complete"}
                      </button>
                      <button
                        type="button"
                        role="menuitem"
                        onClick={() => deleteTask(task.id)}>
                        Delete task
                      </button>
                    </div>
                  )}
                </div>
              </li>
            )
          })}
          {visibleTasks.length === 0 && (
            <li className="tasks-empty-state">No tasks in this view.</li>
          )}
        </ul>
      </div>

      {isAddDialogOpen && (
        <div className="tasks-dialog-backdrop">
          <section
            className="tasks-add-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="tasks-add-title">
            <h2 id="tasks-add-title">Add task</h2>
            <form onSubmit={addTask}>
              <label>
                Task title
                <input
                  autoFocus
                  required
                  value={newTitle}
                  onChange={(event) => setNewTitle(event.currentTarget.value)}
                  placeholder="What needs to get done?"
                />
              </label>
              <div className="tasks-form-row">
                <label>
                  Tag
                  <select
                    value={newCategory}
                    onChange={(event) =>
                      setNewCategory(event.currentTarget.value as TaskCategory)
                    }>
                    <option>Work</option>
                    <option>Personal</option>
                    <option>Health</option>
                    <option>Learning</option>
                  </select>
                </label>
                <label>
                  Date
                  <input
                    type="date"
                    value={newDate}
                    onChange={(event) => setNewDate(event.currentTarget.value)}
                  />
                </label>
                <label>
                  Time
                  <input
                    type="time"
                    value={newTime}
                    onChange={(event) => setNewTime(event.currentTarget.value)}
                  />
                </label>
              </div>
              <div className="tasks-dialog-actions">
                <button type="button" onClick={() => setIsAddDialogOpen(false)}>
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

export default TasksPage
