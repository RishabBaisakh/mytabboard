import {
  DEFAULT_GOAL_TIMELINE,
  getGoalTimelineLabel,
  type Goal,
  type GoalTimeline,
  type GoalWritePayload
} from "./goals"

export type GoalFormValues = {
  title: string
  description: string
  startDate: string
  dueDate: string
  timeline: GoalTimeline
  motivation: string
  category: string | null
}

export function getGoalFormValues(
  goal: Goal | null,
  today: string,
  presetCategory: string | null = null
): GoalFormValues {
  if (!goal) {
    return {
      title: "",
      description: "",
      startDate: today,
      dueDate: "",
      timeline: DEFAULT_GOAL_TIMELINE,
      motivation: "",
      category: presetCategory
    }
  }
  return {
    title: goal.title,
    description: goal.description ?? "",
    // Legacy goals may lack start_date; prefill without persisting until saved.
    startDate: goal.start_date || today,
    dueDate: goal.due_date ?? "",
    timeline: getGoalTimelineLabel(goal.timeline)
      ? goal.timeline
      : DEFAULT_GOAL_TIMELINE,
    motivation: goal.motivation ?? "",
    category: goal.category ?? null
  }
}

// `originalCategory` is undefined when creating. When editing, pass the goal's
// saved category: it is only sent when the user changed it (null clears it).
export function buildGoalPayload(
  values: GoalFormValues,
  originalCategory?: string | null
): GoalWritePayload {
  const payload: GoalWritePayload = {
    title: values.title.trim(),
    description: values.description.trim(),
    start_date: values.startDate,
    due_date: values.dueDate || null,
    timeline: values.timeline,
    motivation: values.motivation.trim()
  }
  const includeCategory =
    originalCategory === undefined
      ? values.category !== null
      : values.category !== originalCategory
  if (includeCategory) payload.category = values.category
  return payload
}
