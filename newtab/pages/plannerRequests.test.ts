import { describe, expect, it } from "vitest"

import { formatLocalDate, taskListPath } from "../../services/tasks"
import {
  createLatestGuard,
  getDayRange,
  getWeekRange,
  rangeKey
} from "./plannerRequests"

describe("planner request ranges", () => {
  it("daily view sends the selected day as start and end", () => {
    expect(taskListPath(getDayRange(new Date(2026, 9, 21, 23, 59)))).toBe(
      "/api/v1/tasks/?start_date=2026-10-21&end_date=2026-10-21"
    )
  })

  it("weekly view sends Monday through Sunday", () => {
    // Sunday belongs to the week starting the previous Monday.
    expect(taskListPath(getWeekRange(new Date(2026, 9, 25)))).toBe(
      "/api/v1/tasks/?start_date=2026-10-19&end_date=2026-10-25"
    )
    expect(taskListPath(getWeekRange(new Date(2026, 9, 21)))).toBe(
      "/api/v1/tasks/?start_date=2026-10-19&end_date=2026-10-25"
    )
  })

  it("week range spanning a month boundary formats correctly", () => {
    const { startDate, endDate } = getWeekRange(new Date(2026, 9, 29))
    expect(formatLocalDate(startDate)).toBe("2026-10-26")
    expect(formatLocalDate(endDate)).toBe("2026-11-01")
  })

  it("week range crossing a year boundary", () => {
    expect(taskListPath(getWeekRange(new Date(2026, 11, 31)))).toBe(
      "/api/v1/tasks/?start_date=2026-12-28&end_date=2027-01-03"
    )
  })

  it("matches the Oct 26 - Nov 1 2026 example from any day in the week", () => {
    for (let d = 26; d <= 31; d++) {
      expect(taskListPath(getWeekRange(new Date(2026, 9, d)))).toBe(
        "/api/v1/tasks/?start_date=2026-10-26&end_date=2026-11-01"
      )
    }
    expect(taskListPath(getWeekRange(new Date(2026, 10, 1)))).toBe(
      "/api/v1/tasks/?start_date=2026-10-26&end_date=2026-11-01"
    )
  })

  it("changes key when the selected day changes, not within the same week", () => {
    const a = rangeKey(getDayRange(new Date(2026, 9, 21)))
    const b = rangeKey(getDayRange(new Date(2026, 9, 22)))
    expect(a).not.toBe(b)
    expect(rangeKey(getWeekRange(new Date(2026, 9, 21)))).toBe(
      rangeKey(getWeekRange(new Date(2026, 9, 22)))
    )
  })
})

describe("createLatestGuard", () => {
  it("rejects stale responses once a newer request begins", () => {
    const guard = createLatestGuard()
    const first = guard.begin()
    const second = guard.begin()
    expect(first()).toBe(false)
    expect(second()).toBe(true)
  })

  it("cancel invalidates the in-flight request", () => {
    const guard = createLatestGuard()
    const request = guard.begin()
    guard.cancel()
    expect(request()).toBe(false)
  })
})
