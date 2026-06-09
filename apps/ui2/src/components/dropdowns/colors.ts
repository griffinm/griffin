import { CSSProperties } from 'react';

/**
 * Mantine theme color tokens offered when configuring a dropdown option. Each
 * option stores a single color token; the pill is rendered with Mantine's
 * `-light` (soft tint) background and `-light-color` (readable, hue-matched)
 * text from that one token, so it stays theme-aware in light/dark.
 */
export const DROPDOWN_COLOR_TOKENS = [
  'gray',
  'dark',
  'red',
  'pink',
  'grape',
  'violet',
  'indigo',
  'blue',
  'cyan',
  'teal',
  'green',
  'lime',
  'yellow',
  'orange',
] as const;

export type DropdownColorToken = (typeof DROPDOWN_COLOR_TOKENS)[number];

export const DEFAULT_COLOR = 'gray';

/**
 * Inline style for a dropdown pill from its single color-scheme token. Exposes
 * the background + hover background as CSS vars so `.dropdown-pill` can do a
 * theme-aware hover (using Mantine's own `-light-hover` variant) without the
 * stylesheet needing to know the token.
 */
export function getPillStyle(color: string | undefined): CSSProperties {
  const c = color || DEFAULT_COLOR;
  return {
    '--pill-bg': `var(--mantine-color-${c}-light)`,
    '--pill-bg-hover': `var(--mantine-color-${c}-light-hover)`,
    backgroundColor: 'var(--pill-bg)',
    color: `var(--mantine-color-${c}-light-color)`,
  } as CSSProperties;
}

/** Solid accent color for a small "color dot" representing a scheme. */
export function getSwatchColor(token: string | undefined): string {
  return `var(--mantine-color-${token || DEFAULT_COLOR}-filled)`;
}

/** The color token of a dropdown's default option (used for list "dots"). */
export function defaultColorOf(dropdown: {
  options: { isDefault: boolean; color: string }[];
}): string {
  const option = dropdown.options.find((o) => o.isDefault) ?? dropdown.options[0];
  return option?.color ?? DEFAULT_COLOR;
}

/** A small round color dot representing a scheme, for menus/lists. */
export function dotStyle(token: string | undefined, size = 10): CSSProperties {
  return {
    width: size,
    height: size,
    borderRadius: 999,
    backgroundColor: getSwatchColor(token),
    flexShrink: 0,
    display: 'inline-block',
  };
}
