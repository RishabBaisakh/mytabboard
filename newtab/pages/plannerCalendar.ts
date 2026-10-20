export type PlannerView = "Day" | "Week"

export function toLocalDateValue(date: Date) {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0")
  ].join("-")
}

export function getLocalDate(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}

export function addCalendarDays(date: Date, days: number) {
  const result = getLocalDate(date)
  result.setDate(result.getDate() + days)
  return result
}

export function getWeekStart(date: Date) {
  const mondayOffset = (date.getDay() + 6) % 7
  return addCalendarDays(date, -mondayOffset)
}

export function navigateCalendarPeriod(
  date: Date,
  view: PlannerView,
  direction: -1 | 1
) {
  const baseDate = view === "Week" ? getWeekStart(date) : date
  return addCalendarDays(baseDate, direction * (view === "Week" ? 7 : 1))
}

export function dateForViewChange(
  selectedDate: Date,
  currentView: PlannerView,
  nextView: PlannerView,
  today = new Date()
) {
  if (currentView !== "Week" || nextView !== "Day") return selectedDate
  const normalizedToday = getLocalDate(today)
  return toLocalDateValue(selectedDate) === toLocalDateValue(normalizedToday)
    ? normalizedToday
    : getWeekStart(selectedDate)
}

export function formatPlannerDay(date: Date) {
  const weekday = date.toLocaleDateString("en-US", { weekday: "long" })
  const monthDayYear = date.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric"
  })
  return `${weekday} · ${monthDayYear}`
}

export function formatPlannerWeek(date: Date) {
  const monday = getWeekStart(date)
  const sunday = addCalendarDays(monday, 6)
  const sameYear = monday.getFullYear() === sunday.getFullYear()
  const sameMonth = sameYear && monday.getMonth() === sunday.getMonth()

  if (sameMonth) {
    const month = monday.toLocaleDateString("en-US", { month: "long" })
    return `${month} ${monday.getDate()} – ${sunday.getDate()}, ${sunday.getFullYear()}`
  }

  const start = monday.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    ...(sameYear ? {} : { year: "numeric" })
  })
  const end = sunday.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric"
  })
  return `${start} – ${end}`
}
