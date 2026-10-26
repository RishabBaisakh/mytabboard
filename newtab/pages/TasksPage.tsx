import {
  CalendarDays,
  Check,
  Clock3,
  Pencil,
  Plus,
  RefreshCw
} from "lucide-react"
import { useEffect, useState, type FormEvent } from "react"

import { ApiError } from "../../services/api"
import type { Task, TaskPriority, TaskStatus } from "../../services/tasks"
import { tasksService } from "../../services/tasks"
import {
  calculateTaskSchedule,
  getTaskScheduleFormValues
} from "../../services/taskScheduling"
import {
  loadGoals,
  selectAllGoals,
  selectGoalsError,
  selectGoalsStatus,
  selectIncompleteGoals
} from "../../store/goalsSlice"
import { useAppDispatch, useAppSelector } from "../../store/hooks"
import {
  loadTasks,
  selectAllTasks,
  selectTasksError,
  selectTasksStatus,
  taskCreated,
  taskUpdated
} from "../../store/tasksSlice"

import "../../styles/pages/tasks.css"

type TaskFilter = "All" | "Today" | "Upcoming" | "Completed"

function getLocalDateValue(date: Date) {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0")
  ].join("-")
}

function formatTimestamp(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return "Invalid date"
  return date.toLocaleString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit"
  })
}

function getServerFieldErrors(error: unknown): Record<string, string> {
  if (
    !(error instanceof ApiError) ||
    !error.payload ||
    typeof error.payload !== "object"
  ) {
    return {}
  }

  const payload = error.payload as Record<string, unknown>
  const fields =
    payload.errors && typeof payload.errors === "object"
      ? (payload.errors as Record<string, unknown>)
      : payload

  function collectMessages(value: unknown): string[] {
    if (typeof value === "string") return [value]
    if (Array.isArray(value)) return value.flatMap(collectMessages)
    if (value && typeof value === "object") {
      return Object.values(value).flatMap(collectMessages)
    }
    return []
  }

  return Object.fromEntries(
    Object.entries(fields)
      .map(
        ([field, value]) => [field, collectMessages(value).join(" ")] as const
      )
      .filter(([, message]) => message.length > 0)
  )
}

function TasksPage() {
  const dispatch = useAppDispatch()
  const tasks = useAppSelector(selectAllTasks)
  const tasksStatus = useAppSelector(selectTasksStatus)
  const tasksError = useAppSelector(selectTasksError)
  const goals = useAppSelector(selectAllGoals)
  const incompleteGoals = useAppSelector(selectIncompleteGoals)
  const goalsStatus = useAppSelector(selectGoalsStatus)
  const goalsError = useAppSelector(selectGoalsError)

  const [activeFilter, setActiveFilter] = useState<TaskFilter>("All")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [title, setTitle] = useState("")
  const [date, setDate] = useState(() => getLocalDateValue(new Date()))
  const [startTime, setStartTime] = useState("09:00")
  const [duration, setDuration] = useState("60")
  const [status, setStatus] = useState<TaskStatus>("in_progress")
  const [priority, setPriority] = useState<TaskPriority>("medium")
  const [goalId, setGoalId] = useState("")
  const [description, setDescription] = useState("")
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})
  const [saveError, setSaveError] = useState("")
  const [saveMessage, setSaveMessage] = useState("")
  const [isSaving, setIsSaving] = useState(false)
  const [pendingCompletionIds, setPendingCompletionIds] = useState<Set<string>>(
    () => new Set()
  )
  const [taskErrors, setTaskErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    void dispatch(loadTasks())
    void dispatch(loadGoals())
  }, [dispatch])

  function resetForm() {
    setEditingTask(null)
    setTitle("")
    setDate(getLocalDateValue(new Date()))
    setStartTime("09:00")
    setDuration("60")
    setStatus("in_progress")
    setPriority("medium")
    setGoalId("")
    setDescription("")
    setFormErrors({})
    setSaveError("")
  }

  function openCreateDialog() {
    resetForm()
    if (goalsStatus === "idle" || goalsStatus === "failed") {
      void dispatch(loadGoals())
    }
    if (tasksStatus === "idle" || tasksStatus === "failed") {
      void dispatch(loadTasks())
    }
    setIsDialogOpen(true)
  }

  function openEditDialog(task: Task) {
    let scheduleValues
    try {
      scheduleValues = getTaskScheduleFormValues(
        task.scheduled_start,
        task.scheduled_end
      )
    } catch (error) {
      setTaskErrors((current) => ({
        ...current,
        [task.id]:
          error instanceof Error ? error.message : "Invalid task schedule."
      }))
      return
    }

    setEditingTask(task)
    setTitle(task.title)
    setDate(scheduleValues.date)
    setStartTime(scheduleValues.start_time)
    setDuration(String(scheduleValues.duration_minutes))
    setStatus(task.status)
    setPriority(task.priority)
    setGoalId(task.goal === null ? "" : String(task.goal))
    setDescription(task.description)
    setFormErrors({})
    setSaveError("")
    setIsDialogOpen(true)
    if (goalsStatus === "idle" || goalsStatus === "failed") {
      void dispatch(loadGoals())
    }
  }

  async function saveTask(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (isSaving) return

    const nextErrors: Record<string, string> = {}
    if (!title.trim()) nextErrors.title = "Enter a task title."
    if (!date) nextErrors.date = "Choose a task date."
    if (!startTime) nextErrors.start_time = "Choose a start time."

    const durationMinutes = Number(duration)
    if (!duration) nextErrors.duration_minutes = "Enter a task duration."
    else if (!Number.isInteger(durationMinutes) || durationMinutes <= 0) {
      nextErrors.duration_minutes =
        "Duration must be a whole number greater than zero."
    }

    let schedule: ReturnType<typeof calculateTaskSchedule> | null = null
    if (Object.keys(nextErrors).length === 0) {
      try {
        schedule = calculateTaskSchedule(date, startTime, durationMinutes)
      } catch (error) {
        nextErrors.date =
          error instanceof Error
            ? error.message
            : "Enter a valid task schedule."
      }
    }

    if (!schedule || Object.keys(nextErrors).length > 0) {
      setFormErrors(nextErrors)
      return
    }

    const payload = {
      title: title.trim(),
      description,
      status,
      priority,
      goal: goalId ? Number(goalId) : null,
      ...schedule
    }

    setIsSaving(true)
    setFormErrors({})
    setSaveError("")
    setSaveMessage("")
    try {
      if (editingTask) {
        const savedTask = await tasksService.update(editingTask.id, payload)
        dispatch(taskUpdated(savedTask))
        setSaveMessage("Task updated.")
      } else {
        const savedTask = await tasksService.create(payload)
        dispatch(taskCreated(savedTask))
        setActiveFilter("All")
        setSaveMessage("Task created.")
      }
      setIsDialogOpen(false)
    } catch (error) {
      const errors = getServerFieldErrors(error)
      setFormErrors(errors)
      setSaveError(
        Object.values(errors).join(" ") ||
          (error instanceof Error
            ? error.message
            : "Unable to save this task. Please try again.")
      )
    } finally {
      setIsSaving(false)
    }
  }

  async function markTaskComplete(task: Task) {
    if (task.status === "completed" || pendingCompletionIds.has(task.id)) return
    setPendingCompletionIds((current) => new Set(current).add(task.id))
    setTaskErrors((current) => ({ ...current, [task.id]: "" }))
    setSaveMessage("")
    try {
      const updatedTask = await tasksService.update(task.id, {
        status: "completed"
      })
      dispatch(taskUpdated(updatedTask))
      setSaveMessage(`“${task.title}” marked complete.`)
    } catch (error) {
      setTaskErrors((current) => ({
        ...current,
        [task.id]:
          error instanceof Error
            ? error.message
            : "Unable to update this task. Please try again."
      }))
    } finally {
      setPendingCompletionIds((current) => {
        const next = new Set(current)
        next.delete(task.id)
        return next
      })
    }
  }

  const today = getLocalDateValue(new Date())
  function taskDate(task: Task) {
    return getLocalDateValue(new Date(task.scheduled_start))
  }

  const counts: Record<TaskFilter, number> = {
    All: tasks.length,
    Today: tasks.filter((task) => taskDate(task) === today).length,
    Upcoming: tasks.filter(
      (task) => taskDate(task) > today && task.status !== "completed"
    ).length,
    Completed: tasks.filter((task) => task.status === "completed").length
  }

  const visibleTasks = tasks.filter((task) => {
    if (activeFilter === "Today") return taskDate(task) === today
    if (activeFilter === "Upcoming") {
      return taskDate(task) > today && task.status !== "completed"
    }
    if (activeFilter === "Completed") return task.status === "completed"
    return true
  })

  const isTasksLoading = tasksStatus === "idle" || tasksStatus === "loading"
  const taskLoadError = tasksStatus === "failed" ? tasksError : null
  const currentTaskGoal = editingTask?.goal
    ? goals.find((goal) => goal.id === editingTask.goal)
    : undefined

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
          onClick={openCreateDialog}>
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

        {saveMessage && (
          <p className="tasks-feedback" role="status">
            {saveMessage}
          </p>
        )}

        {isTasksLoading ? (
          <p className="tasks-state-message" role="status">
            Loading tasks...
          </p>
        ) : taskLoadError ? (
          <div className="tasks-load-error" role="alert">
            <p>{taskLoadError}</p>
            <button
              className="tasks-retry-button"
              type="button"
              onClick={() => void dispatch(loadTasks())}>
              <RefreshCw size={15} aria-hidden="true" />
              Try again
            </button>
          </div>
        ) : tasks.length === 0 ? (
          <p className="tasks-empty-state">
            No tasks yet. Add a task to get started.
          </p>
        ) : (
          <ul className="tasks-list" aria-label={`${activeFilter} tasks`}>
            {visibleTasks.map((task) => (
              <li className="tasks-list-row" key={task.id}>
                {task.status === "completed" ? (
                  <span className="tasks-complete-mark" aria-label="Completed">
                    <Check size={15} aria-hidden="true" />
                  </span>
                ) : (
                  <button
                    className="tasks-complete-button"
                    type="button"
                    aria-label={`Mark ${task.title} as complete`}
                    title="Mark as complete"
                    disabled={pendingCompletionIds.has(task.id)}
                    onClick={() => void markTaskComplete(task)}>
                    {pendingCompletionIds.has(task.id) ? (
                      "..."
                    ) : (
                      <Check size={15} aria-hidden="true" />
                    )}
                  </button>
                )}
                <div className="tasks-row-copy">
                  <span
                    className={`tasks-title${task.status === "completed" ? " is-completed" : ""}`}
                    title={task.title}>
                    {task.title}
                  </span>
                  <div className="tasks-row-details">
                    <time dateTime={task.scheduled_start}>
                      <CalendarDays size={13} aria-hidden="true" />
                      Starts {formatTimestamp(task.scheduled_start)}
                    </time>
                    <time dateTime={task.scheduled_end}>
                      <Clock3 size={13} aria-hidden="true" />
                      Ends {formatTimestamp(task.scheduled_end)}
                    </time>
                    {task.goal !== null && (
                      <span className="tasks-goal-label">
                        {goals.find((goal) => goal.id === task.goal)?.title ??
                          "Goal"}
                      </span>
                    )}
                  </div>
                  {taskErrors[task.id] && (
                    <p className="tasks-row-error" role="alert">
                      {taskErrors[task.id]}
                    </p>
                  )}
                </div>
                <span className={`tasks-status tasks-status-${task.status}`}>
                  {task.status.replaceAll("_", " ")}
                </span>
                <span
                  className={`tasks-priority tasks-priority-${task.priority}`}>
                  {task.priority}
                </span>
                <button
                  className="tasks-edit-button"
                  type="button"
                  aria-label={`Edit task: ${task.title}`}
                  title="Edit task"
                  onClick={() => openEditDialog(task)}>
                  <Pencil size={16} aria-hidden="true" />
                </button>
              </li>
            ))}
            {visibleTasks.length === 0 && (
              <li className="tasks-empty-state">No tasks in this view.</li>
            )}
          </ul>
        )}
      </div>

      {isDialogOpen && (
        <div
          className="tasks-dialog-backdrop"
          onClick={() => !isSaving && setIsDialogOpen(false)}>
          <section
            className="tasks-add-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="tasks-add-title"
            onClick={(event) => event.stopPropagation()}>
            <h2 id="tasks-add-title">
              {editingTask ? "Edit task" : "Create task"}
            </h2>
            <form onSubmit={saveTask}>
              <label className="tasks-form-field">
                Title
                <input
                  autoFocus
                  required
                  value={title}
                  onChange={(event) => setTitle(event.currentTarget.value)}
                  aria-invalid={Boolean(formErrors.title)}
                  aria-describedby={
                    formErrors.title ? "task-title-error" : undefined
                  }
                />
                {formErrors.title && (
                  <span className="tasks-field-error" id="task-title-error">
                    {formErrors.title}
                  </span>
                )}
              </label>
              <div className="tasks-form-grid">
                <label className="tasks-form-field">
                  Date
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={(event) => setDate(event.currentTarget.value)}
                    aria-invalid={Boolean(formErrors.date)}
                  />
                  {formErrors.date && (
                    <span className="tasks-field-error">{formErrors.date}</span>
                  )}
                </label>
                <label className="tasks-form-field">
                  Start time
                  <input
                    type="time"
                    required
                    value={startTime}
                    onChange={(event) =>
                      setStartTime(event.currentTarget.value)
                    }
                    aria-invalid={Boolean(formErrors.start_time)}
                  />
                  {formErrors.start_time && (
                    <span className="tasks-field-error">
                      {formErrors.start_time}
                    </span>
                  )}
                </label>
                <label className="tasks-form-field">
                  Duration (minutes)
                  <input
                    type="number"
                    required
                    min="1"
                    step="1"
                    value={duration}
                    onChange={(event) => setDuration(event.currentTarget.value)}
                    aria-invalid={Boolean(formErrors.duration_minutes)}
                  />
                  {formErrors.duration_minutes && (
                    <span className="tasks-field-error">
                      {formErrors.duration_minutes}
                    </span>
                  )}
                </label>
                <label className="tasks-form-field">
                  Status
                  <select
                    value={status}
                    onChange={(event) =>
                      setStatus(event.currentTarget.value as TaskStatus)
                    }>
                    <option value="todo">To do</option>
                    <option value="in_progress">In progress</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </label>
                <label className="tasks-form-field">
                  Priority
                  <select
                    value={priority}
                    onChange={(event) =>
                      setPriority(event.currentTarget.value as TaskPriority)
                    }>
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </label>
                <label className="tasks-form-field">
                  Goal <span>(Optional)</span>
                  <select
                    value={goalId}
                    onChange={(event) => setGoalId(event.currentTarget.value)}>
                    <option value="">No goal</option>
                    {editingTask &&
                      goalId &&
                      !incompleteGoals.some(
                        (goal) => String(goal.id) === goalId
                      ) && (
                        <option value={goalId}>
                          {currentTaskGoal?.title ?? "Current goal"}
                        </option>
                      )}
                    {incompleteGoals.map((goal) => (
                      <option value={goal.id} key={goal.id}>
                        {goal.category_detail
                          ? `${goal.title} · ${goal.category_detail.name}`
                          : goal.title}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              {goalsStatus === "loading" && (
                <p className="tasks-form-note" role="status">
                  Loading goals...
                </p>
              )}
              {goalsStatus === "failed" && (
                <p className="tasks-form-error" role="alert">
                  Goals are unavailable. You can still create a task without a
                  goal. {goalsError}
                  <button
                    type="button"
                    onClick={() => void dispatch(loadGoals())}>
                    Retry
                  </button>
                </p>
              )}
              {saveError && (
                <p className="tasks-form-error" role="alert">
                  {saveError}
                </p>
              )}
              <footer className="tasks-dialog-actions">
                <button
                  type="button"
                  disabled={isSaving}
                  onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </button>
                <button type="submit" disabled={isSaving}>
                  {isSaving
                    ? "Saving..."
                    : editingTask
                      ? "Save changes"
                      : "Create task"}
                </button>
              </footer>
            </form>
          </section>
        </div>
      )}
    </section>
  )
}

export default TasksPage
