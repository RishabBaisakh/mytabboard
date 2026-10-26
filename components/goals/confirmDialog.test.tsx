import React from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it, vi } from "vitest"

import { ConfirmDialog } from "./ConfirmDialog"

function buttons(element: React.ReactElement) {
  const found: React.ReactElement<{
    onClick: () => void
    disabled?: boolean
    children?: React.ReactNode
  }>[] = []
  const walk = (node: React.ReactNode) => {
    if (!React.isValidElement(node)) return
    const el = node as React.ReactElement<{ children?: React.ReactNode }>
    if (el.type === "button") found.push(el as never)
    React.Children.forEach(el.props.children, walk)
  }
  walk(
    (ConfirmDialog as (p: never) => React.ReactElement)(element.props as never)
  )
  return found
}

function render(
  overrides: Partial<React.ComponentProps<typeof ConfirmDialog>> = {}
) {
  const onConfirm = vi.fn()
  const onCancel = vi.fn()
  const element = (
    <ConfirmDialog
      title="Delete goal?"
      confirmLabel="Delete goal"
      isBusy={false}
      onConfirm={onConfirm}
      onCancel={onCancel}
      {...overrides}>
      <p>will be permanently deleted; tasks kept</p>
    </ConfirmDialog>
  )
  return { element, onConfirm, onCancel }
}

describe("ConfirmDialog", () => {
  it("shows the warning text and an accessible alertdialog", () => {
    const html = renderToStaticMarkup(render().element)
    expect(html).toContain('role="alertdialog"')
    expect(html).toContain("permanently deleted")
  })

  it("cancel does not confirm; confirm does", () => {
    const { element, onConfirm, onCancel } = render()
    const [cancel, confirm] = buttons(element)
    cancel.props.onClick()
    expect(onCancel).toHaveBeenCalledTimes(1)
    expect(onConfirm).not.toHaveBeenCalled()
    confirm.props.onClick()
    expect(onConfirm).toHaveBeenCalledTimes(1)
  })

  it("disables both buttons and shows progress while deleting", () => {
    const { element } = render({ isBusy: true })
    expect(buttons(element).every((b) => b.props.disabled)).toBe(true)
    expect(renderToStaticMarkup(element)).toContain("Deleting...")
  })

  it("shows an error message", () => {
    const html = renderToStaticMarkup(render({ error: "Nope" }).element)
    expect(html).toContain("Nope")
  })
})
