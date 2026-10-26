import React from "react"

import type { Goal } from "../../services/goals"
import { getCategoryVisual } from "./categoryVisuals"

import "../../styles/pages/goal-categories.css"

// Uncategorised goals render no badge.
export function GoalCategoryBadge({ goal }: { goal: Goal }) {
  const detail = goal.category_detail
  if (!detail) return null
  const { icon: Icon, color, tint } = getCategoryVisual(detail.key)

  return (
    <span
      className="goal-category-badge"
      title={detail.description}
      style={
        {
          "--category-color": color,
          "--category-tint": tint
        } as React.CSSProperties
      }>
      <Icon size={11} strokeWidth={2} aria-hidden="true" />
      {detail.name}
    </span>
  )
}
