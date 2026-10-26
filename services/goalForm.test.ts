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
      motivation: "  because  ",
      category: null
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

describe("goal form category handling", () => {
  const base = {
    title: "Learn",
    description: "",
    startDate: today,
    dueDate: "",
    timeline: "short_term" as const,
    motivation: ""
  }
  const goal: Goal = {
    id: 1,
    title: "Run",
    start_date: "2026-01-01",
    timeline: "short_term",
    motivation: "",
    category: "health_wellness",
    category_detail: {
      key: "health_wellness",
      name: "Health & Wellness",
      description: "Body and mind"
    }
  }

  it("starts with no category, or the preset one from a category card", () => {
    expect(getGoalFormValues(null, today).category).toBeNull()
    expect(getGoalFormValues(null, today, "financial_life").category).toBe(
      "financial_life"
    )
  })

  it("preselects the goal's category when editing, and null for old goals", () => {
    expect(getGoalFormValues(goal, today).category).toBe("health_wellness")
    expect(
      getGoalFormValues({ ...goal, category: null }, today).category
    ).toBeNull()
    expect(
      getGoalFormValues({ ...goal, category: undefined }, today).category
    ).toBeNull()
  })

  it("create sends the category key only when one is chosen", () => {
    expect(
      buildGoalPayload({ ...base, category: "career_learning" })
    ).toMatchObject({ category: "career_learning" })
    expect(buildGoalPayload({ ...base, category: null })).not.toHaveProperty(
      "category"
    )
  })

  it("edit omits an untouched category, sends a changed key, and sends explicit null when cleared", () => {
    const untouched = buildGoalPayload(
      { ...base, category: "health_wellness" },
      "health_wellness"
    )
    expect(untouched).not.toHaveProperty("category")
    expect(
      buildGoalPayload({ ...base, category: "personal_life" }, "health_wellness")
    ).toMatchObject({ category: "personal_life" })
    const cleared = buildGoalPayload(
      { ...base, category: null },
      "health_wellness"
    )
    expect(cleared).toHaveProperty("category", null)
  })

  it("does not add a category to an uncategorised goal that was left alone", () => {
    expect(buildGoalPayload({ ...base, category: null }, null)).not.toHaveProperty(
      "category"
    )
  })
})
