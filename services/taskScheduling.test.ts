import { describe, expect, it } from "vitest"

import {
  calculateTaskSchedule,
  getTaskScheduleFormValues
} from "./taskScheduling"

describe("task scheduling", () => {
  it("calculates timezone-aware timestamps and rolls an overnight duration forward", () => {
    const schedule = calculateTaskSchedule("2026-10-18", "23:30", 90)
    const start = new Date(schedule.scheduled_start)
    const end = new Date(schedule.scheduled_end)

    expect(schedule.scheduled_start).toMatch(/Z$/)
    expect(schedule.scheduled_end).toMatch(/Z$/)
    expect(end.getTime() - start.getTime()).toBe(90 * 60_000)
    expect(end.getDate()).not.toBe(start.getDate())
  })

  it("restores local date, start time, and duration when editing a task", () => {
    const schedule = calculateTaskSchedule("2026-10-18", "14:15", 75)

    expect(
      getTaskScheduleFormValues(
        schedule.scheduled_start,
        schedule.scheduled_end
      )
    ).toEqual({
      date: "2026-10-18",
      start_time: "14:15",
      duration_minutes: 75
    })
  })

  it.each([0, -5, 1.5, Number.NaN])(
    "rejects invalid duration %s",
    (duration) => {
      expect(() =>
        calculateTaskSchedule("2026-10-18", "09:00", duration)
      ).toThrow(/duration/i)
    }
  )
})
