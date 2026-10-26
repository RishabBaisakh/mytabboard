import { describe, expect, it } from "vitest"

import { isTaskCompleted, taskListPath } from "../../services/tasks"
import { getDayRange } from "./plannerRequests"

describe("dashboard today progress", () => {
  it("counts only the completed status as complete", () => {
    expect(isTaskCompleted({ status: "completed" })).toBe(true)
    for (const status of ["todo", "in_progress", "cancelled"] as const) {
      expect(isTaskCompleted({ status })).toBe(false)
    }
  })

  it("requests today's local date as a single-day range", () => {
    expect(taskListPath(getDayRange(new Date(2026, 9, 25, 23, 30)))).toBe(
      "/api/v1/tasks/?start_date=2026-10-25&end_date=2026-10-25"
    )
  })
})
