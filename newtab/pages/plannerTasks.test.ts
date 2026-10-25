import { describe, expect, it } from "vitest"

import type { Task } from "../../services/tasks"
import { getDayTimelineItems, getWeekItems } from "./plannerTasks"

function makeTask(
  id: string,
  start: Date,
  minutes: number,
  overrides: Partial<Task> = {}
): Task {
  return {
    id,
    user: 1,
    title: `Task ${id}`,
    description: "",
    status: "todo",
    priority: "medium",
    goal: null,
    scheduled_start: start.toISOString(),
    scheduled_end: new Date(start.getTime() + minutes * 60_000).toISOString(),
    completed_at: null,
    created_at: start.toISOString(),
    updated_at: start.toISOString(),
    ...overrides
  }
}

// Wednesday, local time
const day = new Date(2026, 9, 21)

describe("getDayTimelineItems", () => {
  it("returns only tasks starting on the selected local day, sorted by start", () => {
    const tasks = [
      makeTask("late", new Date(2026, 9, 21, 15, 30), 30),
      makeTask("early", new Date(2026, 9, 21, 8, 30), 60),
      makeTask("other", new Date(2026, 9, 22, 9, 0), 60),
      makeTask("lateNight", new Date(2026, 9, 21, 23, 45), 30)
    ]
    expect(getDayTimelineItems(tasks, day).map((item) => item.id)).toEqual([
      "early",
      "late",
      "lateNight"
    ])
  })

  it("maps status, description and time range", () => {
    const [item] = getDayTimelineItems(
      [
        makeTask("a", new Date(2026, 9, 21, 9, 0), 90, {
          status: "completed",
          description: "Notes"
        })
      ],
      day
    )
    expect(item.detail).toBe("Notes")
    expect(item.done).toBe(true)
    expect(item.tone).toBe("teal")
    expect(item.timeRange).toContain("–")
  })

  it("skips tasks with an invalid schedule and returns empty for no tasks", () => {
    const bad = makeTask("bad", day, 30, { scheduled_start: "" })
    expect(getDayTimelineItems([bad], day)).toEqual([])
    expect(getDayTimelineItems([], day)).toEqual([])
  })

  it("does not duplicate a task that appears once", () => {
    const task = makeTask("a", new Date(2026, 9, 21, 9, 0), 30)
    expect(getDayTimelineItems([task], day)).toHaveLength(1)
  })
})

describe("getWeekItems", () => {
  it("includes Monday-Sunday tasks of the selected week only", () => {
    const tasks = [
      makeTask("mon", new Date(2026, 9, 19, 9, 0), 30),
      makeTask("sun", new Date(2026, 9, 25, 9, 0), 30),
      makeTask("prev", new Date(2026, 9, 18, 9, 0), 30),
      makeTask("next", new Date(2026, 9, 26, 9, 0), 30)
    ]
    const items = getWeekItems(tasks, day)
    expect(items.map((item) => item.id)).toEqual(["mon", "sun"])
    expect(items.map((item) => item.day)).toEqual(["MON", "SUN"])
  })
})
