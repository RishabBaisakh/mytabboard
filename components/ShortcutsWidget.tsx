import { LayoutGrid, X } from "lucide-react"
import { useEffect, useRef, useState } from "react"

import { SHORTCUTS, type Shortcut } from "./shortcuts"

// Fixed catalog domains only; nothing user-specific is sent.
function faviconUrl(href: string) {
  const domain = new URL(href).hostname
  return `https://www.google.com/s2/favicons?domain=${domain}&sz=64`
}

function ShortcutIcon({ href, icon: Icon }: Pick<Shortcut, "href" | "icon">) {
  const [failed, setFailed] = useState(false)

  if (failed) return <Icon size={19} strokeWidth={1.8} />
  return (
    <img
      className="shortcut-favicon"
      src={faviconUrl(href)}
      alt=""
      width={22}
      height={22}
      loading="lazy"
      decoding="async"
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
    />
  )
}

export function ShortcutsWidget() {
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const launcherRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!isOpen) return

    function handlePointerDown(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key !== "Escape") return
      setIsOpen(false)
      launcherRef.current?.focus()
    }

    document.addEventListener("mousedown", handlePointerDown)
    document.addEventListener("keydown", handleKeyDown)
    return () => {
      document.removeEventListener("mousedown", handlePointerDown)
      document.removeEventListener("keydown", handleKeyDown)
    }
  }, [isOpen])

  return (
    <div className="shortcuts-widget" ref={containerRef}>
      <section
        className={`shortcuts-panel${isOpen ? " is-open" : ""}`}
        id="shortcuts-panel"
        aria-labelledby="shortcuts-title">
        <header className="shortcuts-header">
          <div>
            <h2 id="shortcuts-title">Shortcuts</h2>
            <p>Your favorite destinations</p>
          </div>
          <button
            className="shortcuts-close"
            type="button"
            aria-label="Close shortcuts"
            onClick={() => {
              setIsOpen(false)
              launcherRef.current?.focus()
            }}>
            <X size={16} aria-hidden="true" />
          </button>
        </header>
        <nav className="shortcuts-grid" aria-label="Shortcuts">
          {SHORTCUTS.map(({ label, href, icon: Icon }) => (
            <a
              className="shortcut"
              href={href}
              key={label}
              target="_blank"
              rel="noreferrer">
              <span className="shortcut-icon" aria-hidden="true">
                <ShortcutIcon href={href} icon={Icon} />
              </span>
              <span className="shortcut-label">{label}</span>
            </a>
          ))}
        </nav>
      </section>
      <button
        className="shortcuts-launcher"
        type="button"
        ref={launcherRef}
        aria-label={isOpen ? "Close shortcuts" : "Open shortcuts"}
        aria-expanded={isOpen}
        aria-controls="shortcuts-panel"
        onClick={() => setIsOpen((open) => !open)}>
        <LayoutGrid size={22} strokeWidth={1.8} aria-hidden="true" />
      </button>
    </div>
  )
}
