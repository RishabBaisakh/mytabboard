import React from "react"

import type { GoalCategory } from "../../services/goals"
import { CategoryCard } from "./CategoryCard"

import "../../styles/pages/goal-categories.css"

type CategoryGridProps = {
  categories: GoalCategory[]
  selectedKey: string | null
  onSelect: (key: string) => void
  label?: string
}

export function CategoryGrid({
  categories,
  selectedKey,
  onSelect,
  label = "Life areas"
}: CategoryGridProps) {
  return (
    <div className="category-grid" role="group" aria-label={label}>
      {categories.map((category) => (
        <CategoryCard
          key={category.key}
          category={category}
          selected={category.key === selectedKey}
          onSelect={onSelect}
        />
      ))}
    </div>
  )
}
