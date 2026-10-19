import {
  CalendarDays,
  ChevronDown,
  Pencil,
  Plus,
  RefreshCw
} from "lucide-react"
import { useEffect, useState, type FormEvent } from "react"

import { ApiError } from "../../services/api"
import {
  goalsService,
  type Goal,
  type GoalWritePayload
} from "../../services/goals"
import { tasksService, type Task } from "../../services/tasks"

import "../../styles/pages/goals.css"

type GoalFilter = "Active" | "Completed" | "All"
type GoalStatus = "active" | "completed" | "archived"

function getTaskProgress(tasks: Task[]) {
  if (tasks.length === 0) return 0
  return Math.round(
    (tasks.filter((task) => task.status === "completed").length /
      tasks.length) *
      100
  )
}

function getGoalStatus(goal: Goal, tasks: Task[]): GoalStatus {
  if (goal.status) return goal.status
  return tasks.length > 0 && getTaskProgress(tasks) === 100
    ? "completed"
    : "active"
}

function formatDueDate(value?: string | null) {
  if (!value) return ""
  const date = new Date(`${value}T00:00:00`)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric"
  })
}

function formatTaskTime(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ""
  return date.toLocaleString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
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

function GoalsPage() {
  const [goals, setGoals] = useState<Goal[]>([])
  const [tasks, setTasks] = useState<Task[]>([])
  const [filter, setFilter] = useState<GoalFilter>("Active")
  const [expandedGoals, setExpandedGoals] = useState<Set<number>>(
    () => new Set()
  )
  const [loadAttempt, setLoadAttempt] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState("")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null)
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [dueDate, setDueDate] = useState("")
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})
  const [saveError, setSaveError] = useState("")
  const [saveMessage, setSaveMessage] = useState("")
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    let isCurrent = true
    setIsLoading(true)
    setLoadError("")

    Promise.all([goalsService.list(), tasksService.list()])
      .then(([loadedGoals, loadedTasks]) => {
        if (!isCurrent) return
        setGoals(loadedGoals)
        setTasks(loadedTasks)
      })
      .catch((error: unknown) => {
        if (!isCurrent) return
        setLoadError(
          error instanceof Error
            ? error.message
            : "Unable to load goals right now."
        )
      })
      .finally(() => {
        if (isCurrent) setIsLoading(false)
      })

    return () => {
      isCurrent = false
    }
  }, [loadAttempt])

  function openCreateDialog() {
    setEditingGoal(null)
    setTitle("")
    setDescription("")
    setDueDate("")
    setFormErrors({})
    setSaveError("")
    setIsDialogOpen(true)
  }

  function openEditDialog(goal: Goal) {
    setEditingGoal(goal)
    setTitle(goal.title)
    setDescription(goal.description ?? "")
    setDueDate(goal.due_date ?? "")
    setFormErrors({})
    setSaveError("")
    setIsDialogOpen(true)
  }

  function toggleGoal(goalId: number) {
    setExpandedGoals((current) => {
      const next = new Set(current)
      if (next.has(goalId)) next.delete(goalId)
      else next.add(goalId)
      return next
    })
  }

  async function saveGoal(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (isSaving) return

    const cleanTitle = title.trim()
    if (!cleanTitle) {
      setFormErrors({ title: "Enter a goal title." })
      return
    }

    const payload: GoalWritePayload = {
      title: cleanTitle,
      description: description.trim(),
      due_date: dueDate || null
    }

    setIsSaving(true)
    setFormErrors({})
    setSaveError("")
    setSaveMessage("")
    try {
      if (editingGoal) {
        const savedGoal = await goalsService.update(editingGoal.id, payload)
        setGoals((current) =>
          current.map((goal) =>
            goal.id === editingGoal.id ? { ...goal, ...savedGoal } : goal
          )
        )
        setSaveMessage("Goal updated.")
      } else {
        const savedGoal = await goalsService.create(payload)
        setGoals((current) => [...current, savedGoal])
        setSaveMessage("Goal created.")
      }
      setIsDialogOpen(false)
    } catch (error) {
      const errors = getServerFieldErrors(error)
      setFormErrors(errors)
      setSaveError(
        Object.values(errors).join(" ") ||
          (error instanceof Error
            ? error.message
            : "Unable to save this goal. Please try again.")
      )
    } finally {
      setIsSaving(false)
    }
  }

  const filteredGoals = goals.filter((goal) => {
    if (filter === "All") return true
    const goalTasks = tasks.filter((task) => task.goal === goal.id)
    return getGoalStatus(goal, goalTasks) === filter.toLowerCase()
  })

  return (
    <section className="goals-page" aria-labelledby="goals-title">
      <header className="page-header goals-page-header">
        <div>
          <h1 id="goals-title">Goals</h1>
          <p className="page-subtitle">
            Set your goals and track your progress.
          </p>
        </div>
        <button
          className="goals-add-button"
          type="button"
          onClick={openCreateDialog}>
          <Plus size={17} aria-hidden="true" />
          Add Goal
        </button>
      </header>

      <div className="goals-filter-row" role="group" aria-label="Filter goals">
        {(["Active", "Completed", "All"] as const).map((option) => (
          <button
            className="goals-filter-button"
            key={option}
            type="button"
            aria-pressed={filter === option}
            onClick={() => setFilter(option)}>
            {option}
          </button>
        ))}
      </div>

      {saveMessage && (
        <p className="goals-feedback" role="status">
          {saveMessage}
        </p>
      )}

      {isLoading ? (
        <p className="goals-state-message" role="status">
          Loading goals...
        </p>
      ) : loadError ? (
        <div className="goals-load-error" role="alert">
          <p>{loadError}</p>
          <button
            className="goals-retry-button"
            type="button"
            onClick={() => setLoadAttempt((attempt) => attempt + 1)}>
            <RefreshCw size={15} aria-hidden="true" />
            Try again
          </button>
        </div>
      ) : goals.length === 0 ? (
        <p className="goals-empty-state">
          No goals yet. Add a goal to get started.
        </p>
      ) : filteredGoals.length === 0 ? (
        <p className="goals-empty-state">No {filter.toLowerCase()} goals.</p>
      ) : (
        <div className="goal-list" aria-label={`${filter} goals`}>
          {filteredGoals.map((goal) => {
            const goalTasks = tasks.filter((task) => task.goal === goal.id)
            const progress = getTaskProgress(goalTasks)
            const hasTasks = goalTasks.length > 0
            const isExpanded = expandedGoals.has(goal.id)
            const goalStatus = getGoalStatus(goal, goalTasks)
            const taskListId = `goal-tasks-${goal.id}`

            return (
              <article className="goal-card" key={goal.id}>
                <div className="goal-card-main">
                  {hasTasks ? (
                    <button
                      className="goal-expand-button"
                      type="button"
                      aria-label={`${isExpanded ? "Collapse" : "Expand"} tasks for ${goal.title}`}
                      aria-expanded={isExpanded}
                      aria-controls={taskListId}
                      onClick={() => toggleGoal(goal.id)}>
                      <ChevronDown
                        size={18}
                        className={isExpanded ? "is-expanded" : ""}
                        aria-hidden="true"
                      />
                    </button>
                  ) : (
                    <span className="goal-expand-spacer" aria-hidden="true" />
                  )}
                  <div className="goal-card-copy">
                    <div className="goal-title-row">
                      <h2>{goal.title}</h2>
                      {hasTasks && (
                        <span className="goal-task-count">
                          {goalTasks.length}{" "}
                          {goalTasks.length === 1 ? "task" : "tasks"}
                        </span>
                      )}
                      {goalStatus !== "active" && (
                        <span
                          className={`goal-status goal-status-${goalStatus}`}>
                          {goalStatus}
                        </span>
                      )}
                    </div>
                    {goal.description && (
                      <p className="goal-description">{goal.description}</p>
                    )}
                    {goal.due_date && (
                      <time className="goal-due-date" dateTime={goal.due_date}>
                        <CalendarDays size={14} aria-hidden="true" />
                        Due {formatDueDate(goal.due_date)}
                      </time>
                    )}
                  </div>
                  <button
                    className="goals-edit-button"
                    type="button"
                    aria-label={`Edit goal: ${goal.title}`}
                    title="Edit goal"
                    onClick={() => openEditDialog(goal)}>
                    <Pencil size={16} aria-hidden="true" />
                  </button>
                </div>

                <div className="goal-progress">
                  <div
                    className="goal-progress-bar"
                    role="progressbar"
                    aria-label={`${goal.title} completion`}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-valuenow={progress}>
                    <span style={{ width: `${progress}%` }} />
                  </div>
                  <span className="goal-progress-label">{progress}%</span>
                </div>

                {hasTasks && (
                  <div
                    className="goal-task-list"
                    id={taskListId}
                    hidden={!isExpanded}>
                    {goalTasks.map((task) => (
                      <div className="goal-task-row" key={task.id}>
                        <time dateTime={task.scheduled_start}>
                          {formatTaskTime(task.scheduled_start) ||
                            "Unscheduled"}
                        </time>
                        <span className="goal-task-title">{task.title}</span>
                        <span
                          className={`goal-task-status goal-task-status-${task.status}`}>
                          {task.status.replaceAll("_", " ")}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </article>
            )
          })}
        </div>
      )}

      {isDialogOpen && (
        <div
          className="goals-dialog-backdrop"
          onClick={() => !isSaving && setIsDialogOpen(false)}>
          <section
            className="goals-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="goal-dialog-title"
            onClick={(event) => event.stopPropagation()}>
            <h2 id="goal-dialog-title">
              {editingGoal ? "Edit goal" : "Add goal"}
            </h2>
            <form onSubmit={saveGoal}>
              <label className="goals-form-field">
                Title
                <input
                  autoFocus
                  required
                  value={title}
                  onChange={(event) => setTitle(event.currentTarget.value)}
                  aria-invalid={Boolean(formErrors.title)}
                  aria-describedby={
                    formErrors.title ? "goal-title-error" : undefined
                  }
                />
                {formErrors.title && (
                  <span className="goals-field-error" id="goal-title-error">
                    {formErrors.title}
                  </span>
                )}
              </label>
              <label className="goals-form-field">
                Description <span>(Optional)</span>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(event) =>
                    setDescription(event.currentTarget.value)
                  }
                />
                {formErrors.description && (
                  <span className="goals-field-error">
                    {formErrors.description}
                  </span>
                )}
              </label>
              <label className="goals-form-field">
                Due date <span>(Optional)</span>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(event) => setDueDate(event.currentTarget.value)}
                  aria-invalid={Boolean(formErrors.due_date)}
                />
                {formErrors.due_date && (
                  <span className="goals-field-error">
                    {formErrors.due_date}
                  </span>
                )}
              </label>
              {saveError && (
                <p className="goals-form-error" role="alert">
                  {saveError}
                </p>
              )}
              <footer className="goals-dialog-actions">
                <button
                  className="goals-cancel-button"
                  type="button"
                  disabled={isSaving}
                  onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </button>
                <button
                  className="goals-save-button"
                  type="submit"
                  disabled={isSaving}>
                  {isSaving
                    ? "Saving..."
                    : editingGoal
                      ? "Save changes"
                      : "Add Goal"}
                </button>
              </footer>
            </form>
          </section>
        </div>
      )}
    </section>
  )
}

export default GoalsPage
