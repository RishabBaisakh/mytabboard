import type { Task, TaskStatus } from "../../services/tasks"
import { addCalendarDays, getLocalDate, getWeekStart } from "./plannerCalendar"

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

// The backend already filtered by date; this only drops unparseable schedules and sorts.
export function getScheduledTasks(tasks: Task[]) {
  return tasks
    .map((task) => ({ task, schedule: parseSchedule(task) }))
    .filter(
      (
        entry
      ): entry is {
        task: Task
        schedule: NonNullable<typeof entry.schedule>
      } => entry.schedule !== null
    )
    .sort(
      (a, b) =>
        a.schedule.start.getTime() - b.schedule.start.getTime() ||
        a.task.id.localeCompare(b.task.id)
    )
}

export function getDayTimelineItems(tasks: Task[]): PlannerTimelineItem[] {
  return getScheduledTasks(tasks).map(({ task, schedule }) => ({
    id: task.id,
    time: formatTime(schedule.start),
    timeRange: schedule.end
      ? `${formatTime(schedule.start)} – ${formatTime(schedule.end)}`
      : formatTime(schedule.start),
    title: task.title,
    detail: task.description || STATUS_LABELS[task.status],
    tone: STATUS_TONES[task.status],
    done: task.status === "completed"
  }))
}

// A task crossing midnight is listed once per local day it overlaps within the week.
export function getWeekItems(tasks: Task[], date: Date): PlannerWeekItem[] {
  const weekStart = getWeekStart(date)
  const weekEnd = addCalendarDays(weekStart, 6)
  const items: PlannerWeekItem[] = []

  for (const { task, schedule } of getScheduledTasks(tasks)) {
    const startDay = getLocalDate(schedule.start)
    // The end instant is exclusive, so an end exactly at midnight belongs to the previous day.
    const lastInstant =
      schedule.end && schedule.end > schedule.start
        ? new Date(schedule.end.getTime() - 1)
        : schedule.start
    const endDay = getLocalDate(lastInstant)
    // Clamp so tasks the server returned for a UTC-adjacent day still appear in the week.
    let day = startDay < weekStart ? weekStart : startDay
    const last = endDay > weekEnd ? weekEnd : endDay
    if (day > last) day = last < weekStart ? weekStart : last

    do {
      items.push({
        id: task.id,
        day: day
          .toLocaleDateString("en-US", { weekday: "short" })
          .toUpperCase(),
        title: task.title,
        done: task.status === "completed"
      })
      day = addCalendarDays(day, 1)
    } while (day <= last)
  }

  return items
}
