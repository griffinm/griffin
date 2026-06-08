import { useEffect, useRef, type ReactNode } from 'react'

/**
 * Shared presentational primitives for the "@" command menu (see `AtMenuList`).
 * Every stage — actions, note search, dropdown picker — is built from these so
 * the popup keeps one cohesive look. All colors come from Mantine CSS variables,
 * so the menu adapts to light/dark automatically.
 */

/** Small keyboard-key chip used in row affordances and the footer hints. */
export function Kbd({
  children,
  className = '',
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <kbd
      className={`inline-flex h-[1.1rem] min-w-[1.1rem] items-center justify-center rounded border border-[var(--mantine-color-default-border)] bg-[var(--mantine-color-body)] px-1 font-sans text-[10px] font-medium leading-none text-[var(--mantine-color-dimmed)] ${className}`}
    >
      {children}
    </kbd>
  )
}

/** Uppercase breadcrumb label shown at the top of a drilled-in stage. */
export function MenuSectionLabel({ children }: { children: ReactNode }) {
  return (
    <div className="select-none px-2.5 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-wider text-[var(--mantine-color-dimmed)]">
      {children}
    </div>
  )
}

/** Persistent keyboard-hint footer documenting the menu controls. */
function MenuFooter() {
  return (
    <div className="flex select-none items-center gap-3 border-t border-[var(--mantine-color-default-border)] px-2.5 py-1.5 text-[11px] text-[var(--mantine-color-dimmed)]">
      <span className="flex items-center gap-1">
        <Kbd>↑</Kbd>
        <Kbd>↓</Kbd>
        navigate
      </span>
      <span className="flex items-center gap-1">
        <Kbd>↵</Kbd>
        select
      </span>
      <span className="flex items-center gap-1">
        <Kbd>esc</Kbd>
        dismiss
      </span>
    </div>
  )
}

/**
 * Floating panel wrapping a single menu stage: optional breadcrumb label, a
 * scrollable body, and the keyboard-hint footer. The `.at-menu-panel` class
 * carries the entrance animation (see styles/animations.css).
 */
export function MenuPanel({
  label,
  children,
}: {
  label?: ReactNode
  children: ReactNode
}) {
  return (
    <div className="at-menu-panel w-80 overflow-hidden rounded-lg border border-[var(--mantine-color-default-border)] bg-[var(--mantine-color-body)] shadow-xl">
      {label && <MenuSectionLabel>{label}</MenuSectionLabel>}
      <div className="max-h-72 overflow-y-auto p-1">{children}</div>
      <MenuFooter />
    </div>
  )
}

/** Non-interactive status line for loading / empty / error states. */
export function MenuStatus({
  children,
  tone = 'dimmed',
}: {
  children: ReactNode
  tone?: 'dimmed' | 'error'
}) {
  return (
    <div
      className="px-2.5 py-2 text-sm"
      style={{
        color:
          tone === 'error'
            ? 'var(--mantine-color-red-text)'
            : 'var(--mantine-color-dimmed)',
      }}
    >
      {children}
    </div>
  )
}

/**
 * A selectable command row. The keyboard-selected state is a tinted fill with a
 * trailing ↵ hint (distinct from the neutral mouse-hover fill), and the selected
 * row scrolls itself into view as the user arrows through a long list.
 */
export function MenuRow({
  selected,
  onSelect,
  leading,
  title,
  description,
}: {
  selected: boolean
  onSelect: () => void
  /** Leading visual — an icon (tinted on selection) or a color dot. */
  leading?: ReactNode
  title: ReactNode
  /** Optional secondary line, e.g. a search snippet. */
  description?: ReactNode
}) {
  const rowRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (selected) rowRef.current?.scrollIntoView({ block: 'nearest' })
  }, [selected])

  return (
    <div
      ref={rowRef}
      role="option"
      aria-selected={selected}
      // Keep the editor focused so selection inserts at the suggestion range.
      onMouseDown={(e) => e.preventDefault()}
      onClick={onSelect}
      className={`flex cursor-pointer items-start gap-2.5 rounded-md px-2 py-1.5 ${
        selected
          ? 'bg-[var(--mantine-primary-color-light)]'
          : 'hover:bg-[var(--mantine-color-default-hover)]'
      }`}
    >
      {leading && (
        <span
          className={`mt-0.5 flex h-4 w-4 flex-shrink-0 items-center justify-center ${
            selected
              ? 'text-[var(--mantine-primary-color-filled)]'
              : 'text-[var(--mantine-color-dimmed)]'
          }`}
        >
          {leading}
        </span>
      )}
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-medium leading-5 text-[var(--mantine-color-text)]">
          {title}
        </div>
        {description && (
          <div className="mt-0.5 line-clamp-2 text-xs text-[var(--mantine-color-dimmed)]">
            {description}
          </div>
        )}
      </div>
      {selected && <Kbd className="mt-0.5">↵</Kbd>}
    </div>
  )
}
