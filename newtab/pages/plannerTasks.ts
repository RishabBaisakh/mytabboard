import type { Task, TaskStatus } from "../../services/tasks"
import {
  addCalendarDays,
  getLocalDate,
  getWeekStart,
  toLocalDateValue
} from "./plannerCalendar"

export type PlannerTone = "blue" | "teal" | "amber" | "coral"

export type PlannerTimelineItem = {
  id: string
  time: string
  timeRange: string
  title: string
  detail: string
  tone: PlannerTone
  done: boolean
}

export type PlannerWeekItem = {
  id: string
  day: string
  title: string
  done: boolean
}

const STATUS_TONES: Record<TaskStatus, PlannerTone> = {
  completed: "teal",
  cancelled: "coral",
  in_progress: "blue",
  todo: "amber"
}

const STATUS_LABELS: Record<TaskStatus, string> = {
  completed: "Completed",
  cancelled: "Cancelled",
  in_progress: "In progress",
  todo: "To do"
}

function parseSchedule(task: Task) {
  const start = new Date(task.scheduled_start)
  if (Number.isNaN(start.getTime())) return null
  const end = new Date(task.scheduled_end)
  return { start, end: Number.isNaN(end.getTime()) ? null : end }
}

function formatTime(date: Date) {
  return date.toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit"
  })
}

// Tasks are placed on the local day of their start; unscheduled/invalid ones are skipped.
export function getScheduledTasksForRange(
  tasks: Task[],
  firstDay: Date,
  dayCount: number
) {
  const first = toLocalDateValue(firstDay)
  const last = toLocalDateValue(addCalendarDays(firstDay, dayCount - 1))
  return tasks
    .map((task) => ({ task, schedule: parseSchedule(task) }))
    .filter(
      (
        entry
      ): entry is {
        task: Task
        schedule: NonNullable<typeof entry.schedule>
      } => {
        if (!entry.schedule) return false
        const day = toLocalDateValue(entry.schedule.start)
        return day >= first && day <= last
      }
    )
    .sort(
      (a, b) =>
        a.schedule.start.getTime() - b.schedule.start.getTime() ||
        a.task.id.localeCompare(b.task.id)
    )
}

export function getDayTimelineItems(
  tasks: Task[],
  date: Date
): PlannerTimelineItem[] {
  return getScheduledTasksForRange(tasks, getLocalDate(date), 1).map(
    ({ task, schedule }) => ({
      id: task.id,
      time: formatTime(schedule.start),
      timeRange: schedule.end
        ? `${formatTime(schedule.start)} – ${formatTime(schedule.end)}`
        : formatTime(schedule.start),
      title: task.title,
      detail: task.description || STATUS_LABELS[task.status],
      tone: STATUS_TONES[task.status],
      done: task.status === "completed"
    })
  )
}

export function getWeekItems(tasks: Task[], date: Date): PlannerWeekItem[] {
  return getScheduledTasksForRange(tasks, getWeekStart(date), 7).map(
    ({ task, schedule }) => ({
      id: task.id,
      day: schedule.start
        .toLocaleDateString("en-US", { weekday: "short" })
        .toUpperCase(),
      title: task.title,
      done: task.status === "completed"
    })
  )
}
