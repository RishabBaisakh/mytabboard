import {
  CalendarDays,
  ChevronDown,
  Pencil,
  Plus,
  RefreshCw,
  Trash2
} from "lucide-react"
import { useEffect, useState, type FormEvent } from "react"

import { CategoryGrid } from "../../components/goals/CategoryGrid"
import { ConfirmDialog } from "../../components/goals/ConfirmDialog"
import { GoalCategoryBadge } from "../../components/goals/GoalCategoryBadge"
import { ApiError } from "../../services/api"
import { buildGoalPayload, getGoalFormValues } from "../../services/goalForm"
import {
  DEFAULT_GOAL_TIMELINE,
  getGoalStatus,
  getGoalTimelineLabel,
  GOAL_TIMELINE_OPTIONS,
  goalsService,
  isValidDateValue,
  type Goal,
  type GoalTimeline,
  type GoalWritePayload
} from "../../services/goals"
import { tasksService, type Task } from "../../services/tasks"
import {
  loadGoalCategories,
  selectGoalCategories,
  selectGoalCategoriesError,
  selectGoalCategoriesStatus
} from "../../store/goalCategoriesSlice"
import {
  goalCreated,
  goalUpdated,
  loadGoals,
  removeGoal,
  selectAllGoals,
  selectGoalsCategory,
  selectGoalsError,
  selectGoalsStatus,
  selectGoalsUnfilteredCount
} from "../../store/goalsSlice"
import { useAppDispatch, useAppSelector } from "../../store/hooks"
import {
  loadTasks,
  selectAllTasks,
  selectTasksError,
  selectTasksStatus
} from "../../store/tasksSlice"
import { toLocalDateValue } from "./plannerCalendar"

import "../../styles/pages/goals.css"

type GoalFilter = "Active" | "Completed" | "All"

function formatGoalDate(value?: string | null) {
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
  const dispatch = useAppDispatch()
  const goals = useAppSelector(selectAllGoals)
  const tasks = useAppSelector(selectAllTasks)
  const goalsStatus = useAppSelector(selectGoalsStatus)
  const tasksStatus = useAppSelector(selectTasksStatus)
  const goalsError = useAppSelector(selectGoalsError)
  const tasksError = useAppSelector(selectTasksError)
  const isLoading =
    goalsStatus === "idle" ||
    goalsStatus === "loading" ||
    tasksStatus === "idle" ||
    tasksStatus === "loading"
  const loadError = goalsError || tasksError || ""
  const categories = useAppSelector(selectGoalCategories)
  const categoriesStatus = useAppSelector(selectGoalCategoriesStatus)
  const categoriesError = useAppSelector(selectGoalCategoriesError)
  const selectedCategory = useAppSelector(selectGoalsCategory)
  const unfilteredCount = useAppSelector(selectGoalsUnfilteredCount)
  const categoriesReady = categoriesStatus === "succeeded"
  const [category, setCategory] = useState<string | null>(null)
  const [filter, setFilter] = useState<GoalFilter>("Active")
  const [expandedGoals, setExpandedGoals] = useState<Set<number>>(
    () => new Set()
  )
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null)
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [startDate, setStartDate] = useState(() => toLocalDateValue(new Date()))
  const [dueDate, setDueDate] = useState("")
  const [timeline, setTimeline] = useState<GoalTimeline>(DEFAULT_GOAL_TIMELINE)
  const [motivation, setMotivation] = useState("")
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})
  const [saveError, setSaveError] = useState("")
  const [saveMessage, setSaveMessage] = useState("")
  const [isSaving, setIsSaving] = useState(false)
  const [goalToDelete, setGoalToDelete] = useState<Goal | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState("")

  useEffect(() => {
    void dispatch(loadGoals(selectedCategory))
    void dispatch(loadTasks())
    void dispatch(loadGoalCategories())
    // Only on mount: later category changes are dispatched by the filter handler.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch])

  function changeCategoryFilter(value: string) {
    void dispatch(loadGoals(value || null))
  }

  function openGoalDialog(
    goal: Goal | null,
    presetCategory: string | null = null
  ) {
    const values = getGoalFormValues(
      goal,
      toLocalDateValue(new Date()),
      presetCategory
    )
    setCategory(values.category)
    setEditingGoal(goal)
    setTitle(values.title)
    setDescription(values.description)
    setStartDate(values.startDate)
    setDueDate(values.dueDate)
    setTimeline(values.timeline)
    setMotivation(values.motivation)
    setFormErrors({})
    setSaveError("")
    setIsDialogOpen(true)
  }

  function openCreateDialog(presetCategory: string | null = null) {
    openGoalDialog(null, presetCategory)
  }

  function openEditDialog(goal: Goal) {
    openGoalDialog(goal)
  }

  function closeDeleteDialog() {
    if (isDeleting) return
    setGoalToDelete(null)
    setDeleteError("")
  }

  async function confirmDelete() {
    if (!goalToDelete || isDeleting) return
    setIsDeleting(true)
    setDeleteError("")
    setSaveMessage("")
    try {
      await dispatch(removeGoal(goalToDelete.id)).unwrap()
      setSaveMessage("Goal deleted.")
      setGoalToDelete(null)
    } catch (error) {
      setDeleteError(
        error instanceof Error
          ? error.message
          : "Unable to delete this goal. Please try again."
      )
    } finally {
      setIsDeleting(false)
    }
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
    const nextErrors: Record<string, string> = {}
    if (!cleanTitle) nextErrors.title = "Enter a goal title."
    if (!startDate) nextErrors.start_date = "Choose a start date."
    else if (!isValidDateValue(startDate)) {
      nextErrors.start_date = "Enter a valid start date."
    }
    if (!getGoalTimelineLabel(timeline)) {
      nextErrors.timeline = "Choose a timeline."
    }
    if (Object.keys(nextErrors).length > 0) {
      setFormErrors(nextErrors)
      return
    }

    const payload: GoalWritePayload = buildGoalPayload(
      {
        title,
        description,
        startDate,
        dueDate,
        timeline,
        motivation,
        category
      },
      editingGoal ? editingGoal.category ?? null : undefined
    )

    setIsSaving(true)
    setFormErrors({})
    setSaveError("")
    setSaveMessage("")
    try {
      if (editingGoal) {
        const savedGoal = await goalsService.update(editingGoal.id, payload)
        dispatch(goalUpdated({ ...editingGoal, ...savedGoal }))
        setSaveMessage("Goal updated.")
      } else {
        const savedGoal = await goalsService.create(payload)
        dispatch(goalCreated(savedGoal))
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
          onClick={() => openCreateDialog()}>
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

      {categoriesReady && unfilteredCount !== 0 && (
        <label className="goals-category-filter">
          Category
          <select
            value={selectedCategory ?? ""}
            onChange={(event) =>
              changeCategoryFilter(event.currentTarget.value)
            }>
            <option value="">All categories</option>
            {categories.map((option) => (
              <option key={option.key} value={option.key}>
                {option.name}
              </option>
            ))}
          </select>
        </label>
      )}

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
            onClick={() => {
              if (goalsStatus === "failed") void dispatch(loadGoals())
              if (tasksStatus === "failed") void dispatch(loadTasks())
            }}>
            <RefreshCw size={15} aria-hidden="true" />
            Try again
          </button>
        </div>
      ) : goals.length === 0 &&
        selectedCategory !== null &&
        unfilteredCount !== 0 ? (
        <div className="goals-empty-state" role="status">
          <p>
            No goals in{" "}
            {categories.find((option) => option.key === selectedCategory)
              ?.name ?? "this category"}{" "}
            yet.
          </p>
          <button
            className="goals-retry-button"
            type="button"
            onClick={() => changeCategoryFilter("")}>
            Show all goals
          </button>
        </div>
      ) : goals.length === 0 && categoriesReady && categories.length > 0 ? (
        <section
          className="goals-category-empty"
          aria-labelledby="goals-category-empty-title">
          <h2 id="goals-category-empty-title">Start with a life area</h2>
          <p>Pick an area to create your first goal.</p>
          <CategoryGrid
            categories={categories}
            selectedKey={null}
            onSelect={(key) => openCreateDialog(key)}
          />
        </section>
      ) : goals.length === 0 ? (
        <div className="goals-empty-state">
          <p>No goals yet. Add a goal to get started.</p>
          {categoriesStatus === "failed" && (
            <div className="goals-load-error" role="alert">
              <p>{categoriesError}</p>
              <button
                className="goals-retry-button"
                type="button"
                onClick={() => void dispatch(loadGoalCategories())}>
                <RefreshCw size={15} aria-hidden="true" />
                Try again
              </button>
            </div>
          )}
        </div>
      ) : filteredGoals.length === 0 ? (
        <p className="goals-empty-state">No {filter.toLowerCase()} goals.</p>
      ) : (
        <div className="goal-list" aria-label={`${filter} goals`}>
          {filteredGoals.map((goal) => {
            const goalTasks = tasks.filter((task) => task.goal === goal.id)
            const progress =
              goalTasks.length === 0
                ? 0
                : Math.round(
                    (goalTasks.filter((task) => task.status === "completed")
                      .length /
                      goalTasks.length) *
                      100
                  )
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
                      <GoalCategoryBadge goal={goal} />
                      {getGoalTimelineLabel(goal.timeline) && (
                        <span className="goal-timeline">
                          {getGoalTimelineLabel(goal.timeline)}
                        </span>
                      )}
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
                    {goal.motivation && (
                      <p className="goal-motivation">
                        <span>Motivation behind it</span>
                        {goal.motivation}
                      </p>
                    )}
                    {(goal.start_date || goal.due_date) && (
                      <div className="goal-dates">
                        {goal.start_date && (
                          <time
                            className="goal-due-date"
                            dateTime={goal.start_date}>
                            <CalendarDays size={14} aria-hidden="true" />
                            Starts {formatGoalDate(goal.start_date)}
                          </time>
                        )}
                        {goal.due_date && (
                          <time
                            className="goal-due-date"
                            dateTime={goal.due_date}>
                            <CalendarDays size={14} aria-hidden="true" />
                            Due {formatGoalDate(goal.due_date)}
                          </time>
                        )}
                      </div>
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
                  <button
                    className="goals-edit-button goals-delete-icon"
                    type="button"
                    aria-label={`Delete goal: ${goal.title}`}
                    title="Delete goal"
                    disabled={isDeleting && goalToDelete?.id === goal.id}
                    onClick={() => {
                      setDeleteError("")
                      setGoalToDelete(goal)
                    }}>
                    <Trash2 size={16} aria-hidden="true" />
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

      {goalToDelete && (
        <ConfirmDialog
          title="Delete goal?"
          confirmLabel="Delete goal"
          isBusy={isDeleting}
          error={deleteError}
          onConfirm={() => void confirmDelete()}
          onCancel={closeDeleteDialog}>
          <p>
            &ldquo;{goalToDelete.title}&rdquo; will be permanently deleted. Its
            linked tasks will be kept as independent tasks.
          </p>
        </ConfirmDialog>
      )}

      {isDialogOpen && (
        <div
          className="goals-dialog-backdrop"
          onClick={() => !isSaving && setIsDialogOpen(false)}>
          <section
            className={`goals-dialog${categoriesReady ? " has-category-grid" : ""}`}
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
              <div className="goals-category-field">
                <span id="goal-category-label">
                  Life area <span>(Optional)</span>
                </span>
                {categoriesReady ? (
                  <>
                    <CategoryGrid
                      categories={categories}
                      selectedKey={category}
                      onSelect={(key) =>
                        setCategory((current) => (current === key ? null : key))
                      }
                    />
                    <select
                      aria-labelledby="goal-category-label"
                      value={category ?? ""}
                      onChange={(event) =>
                        setCategory(event.currentTarget.value || null)
                      }
                      aria-invalid={Boolean(formErrors.category)}
                      aria-describedby="goal-category-help">
                      <option value="">No category</option>
                      {categories.map((option) => (
                        <option key={option.key} value={option.key}>
                          {option.name}
                        </option>
                      ))}
                    </select>
                    <p className="goals-category-help" id="goal-category-help">
                      {categories.find((option) => option.key === category)
                        ?.description ?? "No category selected."}
                    </p>
                  </>
                ) : categoriesStatus === "failed" ? (
                  <div className="goals-load-error" role="alert">
                    <p>{categoriesError}</p>
                    <button
                      className="goals-retry-button"
                      type="button"
                      onClick={() => void dispatch(loadGoalCategories())}>
                      <RefreshCw size={15} aria-hidden="true" />
                      Try again
                    </button>
                  </div>
                ) : (
                  <p className="goals-category-help" role="status">
                    Loading categories...
                  </p>
                )}
                {formErrors.category && (
                  <span className="goals-field-error" role="alert">
                    {formErrors.category}
                  </span>
                )}
              </div>
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
                Why does this goal matter to you? <span>(Optional)</span>
                <textarea
                  rows={3}
                  value={motivation}
                  placeholder="e.g. It will help me grow in my career."
                  onChange={(event) => setMotivation(event.currentTarget.value)}
                />
                {formErrors.motivation && (
                  <span className="goals-field-error">
                    {formErrors.motivation}
                  </span>
                )}
              </label>
              <label className="goals-form-field">
                Timeline
                <select
                  required
                  value={timeline}
                  onChange={(event) =>
                    setTimeline(event.currentTarget.value as GoalTimeline)
                  }
                  aria-invalid={Boolean(formErrors.timeline)}>
                  {GOAL_TIMELINE_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                {formErrors.timeline && (
                  <span className="goals-field-error">
                    {formErrors.timeline}
                  </span>
                )}
              </label>
              <label className="goals-form-field">
                Start date
                <input
                  type="date"
                  required
                  value={startDate}
                  onChange={(event) => setStartDate(event.currentTarget.value)}
                  aria-invalid={Boolean(formErrors.start_date)}
                  aria-describedby={
                    formErrors.start_date ? "goal-start-date-error" : undefined
                  }
                />
                {formErrors.start_date && (
                  <span
                    className="goals-field-error"
                    id="goal-start-date-error">
                    {formErrors.start_date}
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
