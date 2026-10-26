import React from "react"

import type { GoalCategory } from "../../services/goals"
import { getCategoryVisual } from "./categoryVisuals"

type CategoryCardProps = {
  category: GoalCategory
  selected: boolean
  onSelect: (key: string) => void
}

export function CategoryCard({
  category,
  selected,
  onSelect
}: CategoryCardProps) {
  const { icon: Icon, color, tint } = getCategoryVisual(category.key)

  return (
    <button
      className={`category-card${selected ? " is-selected" : ""}`}
      type="button"
      aria-pressed={selected}
      style={
        {
          "--category-color": color,
          "--category-tint": tint
        } as React.CSSProperties
      }
      onClick={() => onSelect(category.key)}>
      <span className="category-card-art" aria-hidden="true">
        <Icon size={26} strokeWidth={1.7} />
      </span>
      <span className="category-card-copy">
        <span className="category-card-name">{category.name}</span>
        <span className="category-card-description">
          {category.description}
        </span>
      </span>
    </button>
  )
}
