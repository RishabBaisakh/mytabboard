import React from "react"

type ConfirmDialogProps = {
  title: string
  confirmLabel: string
  isBusy: boolean
  error?: string
  onConfirm: () => void
  onCancel: () => void
  children: React.ReactNode
}

export function ConfirmDialog({
  title,
  confirmLabel,
  isBusy,
  error,
  onConfirm,
  onCancel,
  children
}: ConfirmDialogProps) {
  return (
    <div
      className="goals-dialog-backdrop"
      onClick={() => !isBusy && onCancel()}>
      <section
        className="goals-dialog goals-confirm-dialog"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
        aria-describedby="confirm-dialog-body"
        onClick={(event) => event.stopPropagation()}>
        <h2 id="confirm-dialog-title">{title}</h2>
        <div id="confirm-dialog-body" className="goals-confirm-body">
          {children}
        </div>
        {error && (
          <p className="goals-form-error" role="alert">
            {error}
          </p>
        )}
        <footer className="goals-dialog-actions">
          <button
            className="goals-cancel-button"
            type="button"
            autoFocus
            disabled={isBusy}
            onClick={onCancel}>
            Cancel
          </button>
          <button
            className="goals-delete-button"
            type="button"
            disabled={isBusy}
            onClick={onConfirm}>
            {isBusy ? "Deleting..." : confirmLabel}
          </button>
        </footer>
      </section>
    </div>
  )
}
