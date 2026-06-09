import { ReactNode } from 'react';

/**
 * A labelled metadata field used by both the modal's right rail and the task
 * detail page's meta rail, so the two surfaces read identically.
 *
 * Renders a mono uppercase eyebrow above its value/control, with an optional
 * hairline divider above (set `divider` for all but the first field).
 */
export function MetaField({
  label,
  children,
  divider = false,
}: {
  label: string;
  children: ReactNode;
  divider?: boolean;
}) {
  return (
    <div className={divider ? 'pt-3 border-t border-[var(--at-line)]' : ''}>
      <div
        className="task-meta text-[10px] text-[var(--mantine-color-dimmed)] mb-1.5"
      >
        {label}
      </div>
      {children}
    </div>
  );
}
