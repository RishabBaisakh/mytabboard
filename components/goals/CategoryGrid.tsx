import { CircleSlash } from "lucide-react"
import React from "react"

import type { GoalCategory } from "../../services/goals"
import { CategoryCard } from "./CategoryCard"

import "../../styles/pages/goal-categories.css"

type CategoryGridProps = {
  categories: GoalCategory[]
  selectedKey: string | null
  onSelect: (key: string) => void
  // When provided, a "No category" card is rendered, selected while selectedKey is null.
  onSelectNone?: () => void
  label?: string
}

export function CategoryGrid({
  categories,
  selectedKey,
  onSelect,
  onSelectNone,
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
      {onSelectNone && (
        <button
          className={`category-card category-card-none${selectedKey === null ? " is-selected" : ""}`}
          type="button"
          aria-pressed={selectedKey === null}
          onClick={onSelectNone}>
          <span className="category-card-art" aria-hidden="true">
            <CircleSlash size={26} strokeWidth={1.7} />
          </span>
          <span className="category-card-copy">
            <span className="category-card-name">No category</span>
            <span className="category-card-description">
              Skip this for now.
            </span>
          </span>
        </button>
      )}
    </div>
  )
}
