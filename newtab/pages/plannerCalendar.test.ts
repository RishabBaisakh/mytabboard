import { describe, expect, it } from "vitest"

import {
  dateForViewChange,
  formatPlannerDay,
  formatPlannerWeek,
  getWeekStart,
  navigateCalendarPeriod
} from "./plannerCalendar"

function localDate(year: number, month: number, day: number) {
  return new Date(year, month - 1, day)
}

describe("Planner calendar navigation", () => {
  it("formats the selected day with weekday, month, day, and year", () => {
    expect(formatPlannerDay(localDate(2026, 10, 19))).toBe(
      "Monday · October 19, 2026"
    )
  })

  it("uses Monday as the first day and Sunday as the last day of a week", () => {
    expect(getWeekStart(localDate(2026, 10, 21))).toEqual(
      localDate(2026, 10, 19)
    )
    expect(formatPlannerWeek(localDate(2026, 10, 21))).toBe(
      "October 19 – 25, 2026"
    )
  })

  it("formats weeks crossing a month or year unambiguously", () => {
    expect(formatPlannerWeek(localDate(2026, 10, 1))).toBe(
      "September 28 – October 4, 2026"
    )
    expect(formatPlannerWeek(localDate(2027, 1, 1))).toBe(
      "December 28, 2026 – January 3, 2027"
    )
  })

  it("navigates one day or one Monday-to-Sunday week", () => {
    expect(navigateCalendarPeriod(localDate(2026, 10, 19), "Day", 1)).toEqual(
      localDate(2026, 10, 20)
    )
    expect(navigateCalendarPeriod(localDate(2026, 10, 21), "Week", 1)).toEqual(
      localDate(2026, 10, 26)
    )
    expect(navigateCalendarPeriod(localDate(2026, 10, 21), "Week", -1)).toEqual(
      localDate(2026, 10, 12)
    )
  })

  it("preserves the selected date entering Week and returns to Monday leaving Week", () => {
    const selected = localDate(2026, 10, 21)
    expect(dateForViewChange(selected, "Day", "Week")).toEqual(selected)
    expect(dateForViewChange(selected, "Week", "Day")).toEqual(
      localDate(2026, 10, 19)
    )
  })

  it("returns to today's date when switching from the current week to Day", () => {
    const today = localDate(2026, 10, 21)
    expect(dateForViewChange(today, "Week", "Day", today)).toEqual(today)
  })
})
