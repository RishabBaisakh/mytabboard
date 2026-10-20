import { describe, expect, it } from "vitest"

import { buildGoalPayload, getGoalFormValues } from "./goalForm"
import type { Goal } from "./goals"

const today = "2026-10-20"

describe("getGoalFormValues", () => {
  it("defaults a new goal to short-term with empty motivation", () => {
    const values = getGoalFormValues(null, today)
    expect(values.timeline).toBe("short_term")
    expect(values.motivation).toBe("")
    expect(values.startDate).toBe(today)
  })

  it("shows the saved timeline and motivation when editing", () => {
    const goal: Goal = {
      id: 1,
      title: "Run",
      start_date: "2026-01-01",
      due_date: "2026-12-31",
      timeline: "long_term",
      motivation: "Health"
    }
    const values = getGoalFormValues(goal, today)
    expect(values.timeline).toBe("long_term")
    expect(values.motivation).toBe("Health")
    expect(values.startDate).toBe("2026-01-01")
    expect(values.dueDate).toBe("2026-12-31")
  })

  it("falls back to short-term for legacy records", () => {
    const legacy = { id: 2, title: "Old", start_date: "" } as unknown as Goal
    const values = getGoalFormValues(legacy, today)
    expect(values.timeline).toBe("short_term")
    expect(values.motivation).toBe("")
    expect(values.startDate).toBe(today)
  })
})

describe("buildGoalPayload", () => {
  it("includes trimmed timeline and motivation", () => {
    const payload = buildGoalPayload({
      title: "  Learn  ",
      description: " d ",
      startDate: today,
      dueDate: "",
      timeline: "mid_term",
      motivation: "  because  "
    })
    expect(payload).toEqual({
      title: "Learn",
      description: "d",
      start_date: today,
      due_date: null,
      timeline: "mid_term",
      motivation: "because"
    })
  })
})
