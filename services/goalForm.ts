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
}

export function getGoalFormValues(
  goal: Goal | null,
  today: string
): GoalFormValues {
  if (!goal) {
    return {
      title: "",
      description: "",
      startDate: today,
      dueDate: "",
      timeline: DEFAULT_GOAL_TIMELINE,
      motivation: ""
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
    motivation: goal.motivation ?? ""
  }
}

export function buildGoalPayload(values: GoalFormValues): GoalWritePayload {
  return {
    title: values.title.trim(),
    description: values.description.trim(),
    start_date: values.startDate,
    due_date: values.dueDate || null,
    timeline: values.timeline,
    motivation: values.motivation.trim()
  }
}
