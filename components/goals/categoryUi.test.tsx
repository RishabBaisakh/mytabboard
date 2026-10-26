import React from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it, vi } from "vitest"

import type { Goal, GoalCategory } from "../../services/goals"
import { CategoryGrid } from "./CategoryGrid"
import { getCategoryVisual } from "./categoryVisuals"
import { GoalCategoryBadge } from "./GoalCategoryBadge"

// Names deliberately differ from any hardcoded copy to prove they come from the API.
const categories: GoalCategory[] = [
  {
    key: "health_wellness",
    name: "API Health",
    description: "API health text"
  },
  {
    key: "personal_life",
    name: "API Personal",
    description: "API personal text"
  },
  { key: "mystery_key", name: "API Mystery", description: "unknown key text" }
]

function findButtons(node: React.ReactNode): React.ReactElement[] {
  const found: React.ReactElement[] = []
  const walk = (value: React.ReactNode) => {
    if (!React.isValidElement(value)) return
    const element = value as React.ReactElement<{
      children?: React.ReactNode
    }>
    if (typeof element.type === "function") {
      walk((element.type as (props: unknown) => React.ReactNode)(element.props))
      return
    }
    if (element.type === "button") found.push(element)
    React.Children.forEach(element.props.children, walk)
  }
  walk(node)
  return found
}

describe("CategoryGrid", () => {
  it("renders API-provided names and descriptions with a selected state", () => {
    const html = renderToStaticMarkup(
      <CategoryGrid
        categories={categories}
        selectedKey="personal_life"
        onSelect={() => {}}
      />
    )
    for (const category of categories) {
      expect(html).toContain(category.name)
      expect(html).toContain(category.description)
    }
    expect(html.match(/aria-pressed="true"/g)).toHaveLength(1)
    expect(html).toContain("is-selected")
  })

  it("reports the clicked category key", () => {
    const onSelect = vi.fn()
    const buttons = findButtons(
      <CategoryGrid
        categories={categories}
        selectedKey={null}
        onSelect={onSelect}
      />
    )
    expect(buttons).toHaveLength(3)
    ;(buttons[1].props as { onClick: () => void }).onClick()
    expect(onSelect).toHaveBeenCalledWith("personal_life")
  })

  it("renders a No category card that is selected when the key is null", () => {
    const onSelectNone = vi.fn()
    const element = (
      <CategoryGrid
        categories={categories}
        selectedKey={null}
        onSelect={() => {}}
        onSelectNone={onSelectNone}
      />
    )
    const html = renderToStaticMarkup(element)
    expect(html).toContain("No category")
    expect(html.match(/aria-pressed="true"/g)).toHaveLength(1)
    const buttons = findButtons(element)
    expect(buttons).toHaveLength(4)
    ;(buttons[3].props as { onClick: () => void }).onClick()
    expect(onSelectNone).toHaveBeenCalled()
  })

  it("omits the No category card by default", () => {
    expect(
      renderToStaticMarkup(
        <CategoryGrid
          categories={categories}
          selectedKey={null}
          onSelect={() => {}}
        />
      )
    ).not.toContain("No category")
  })

  it("falls back to a neutral visual for unknown keys", () => {
    expect(getCategoryVisual("mystery_key")).toBe(getCategoryVisual(null))
    expect(getCategoryVisual("health_wellness")).not.toBe(
      getCategoryVisual(null)
    )
  })
})

describe("GoalCategoryBadge", () => {
  const goal: Goal = {
    id: 1,
    title: "Run",
    start_date: "2026-10-01",
    timeline: "short_term",
    motivation: "",
    category: "health_wellness",
    category_detail: categories[0]
  }

  it("shows the API category name", () => {
    expect(renderToStaticMarkup(<GoalCategoryBadge goal={goal} />)).toContain(
      "API Health"
    )
  })

  it("renders nothing for uncategorised goals", () => {
    expect(
      renderToStaticMarkup(
        <GoalCategoryBadge
          goal={{ ...goal, category: null, category_detail: null }}
        />
      )
    ).toBe("")
    expect(
      renderToStaticMarkup(
        <GoalCategoryBadge
          goal={{ ...goal, category: undefined, category_detail: undefined }}
        />
      )
    ).toBe("")
  })
})
