export type TaskSchedule = {
  scheduled_start: string
  scheduled_end: string
}

export type TaskScheduleFormValues = {
  date: string
  start_time: string
  duration_minutes: number
}

export function calculateTaskSchedule(
  date: string,
  startTime: string,
  durationMinutes: number
): TaskSchedule {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    throw new Error("Enter a valid task date.")
  }
  if (!/^\d{2}:\d{2}$/.test(startTime)) {
    throw new Error("Enter a valid start time.")
  }
  if (!Number.isInteger(durationMinutes) || durationMinutes <= 0) {
    throw new Error("Duration must be a whole number greater than zero.")
  }

  const [year, month, day] = date.split("-").map(Number)
  const [hours, minutes] = startTime.split(":").map(Number)
  const start = new Date(year, month - 1, day, hours, minutes)

  if (
    start.getFullYear() !== year ||
    start.getMonth() !== month - 1 ||
    start.getDate() !== day ||
    start.getHours() !== hours ||
    start.getMinutes() !== minutes
  ) {
    throw new Error("Enter a valid task date and start time.")
  }

  const end = new Date(start.getTime() + durationMinutes * 60_000)
  return {
    scheduled_start: start.toISOString(),
    scheduled_end: end.toISOString()
  }
}

export function getTaskScheduleFormValues(
  scheduledStart: string,
  scheduledEnd: string
): TaskScheduleFormValues {
  const start = new Date(scheduledStart)
  const end = new Date(scheduledEnd)
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    throw new Error("Task schedule is invalid.")
  }

  const date = [
    start.getFullYear(),
    String(start.getMonth() + 1).padStart(2, "0"),
    String(start.getDate()).padStart(2, "0")
  ].join("-")
  const startTime = `${String(start.getHours()).padStart(2, "0")}:${String(
    start.getMinutes()
  ).padStart(2, "0")}`

  return {
    date,
    start_time: startTime,
    duration_minutes: Math.round((end.getTime() - start.getTime()) / 60_000)
  }
}
