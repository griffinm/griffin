import { useState } from 'react'
import { Popover, SimpleGrid, Tooltip, UnstyledButton } from '@mantine/core'
import { DROPDOWN_COLOR_TOKENS, getSwatchColor } from './colors'

interface ColorTokenPickerProps {
  value: string
  onChange: (_token: string) => void
  ariaLabel?: string
}

const swatch = (color: string, selected: boolean) => ({
  width: 22,
  height: 22,
  borderRadius: 999,
  backgroundColor: color,
  boxShadow: selected
    ? '0 0 0 2px var(--mantine-color-body), 0 0 0 4px var(--mantine-color-blue-5)'
    : 'inset 0 0 0 1px rgba(0, 0, 0, 0.08)',
  transition: 'transform 100ms ease',
})

const label = (token: string) => token.charAt(0).toUpperCase() + token.slice(1)

/**
 * A small round swatch that opens a grid of Mantine color tokens — the single
 * "color scheme" for a dropdown option (drives both pill background and text).
 */
export function ColorTokenPicker({ value, onChange, ariaLabel }: ColorTokenPickerProps) {
  const [opened, setOpened] = useState(false)

  return (
    <Popover opened={opened} onChange={setOpened} position="bottom" withinPortal shadow="md" radius="md">
      <Popover.Target>
        <Tooltip label={ariaLabel} disabled={!ariaLabel} withArrow openDelay={300}>
          <UnstyledButton
            aria-label={ariaLabel}
            onClick={() => setOpened((o) => !o)}
            style={swatch(getSwatchColor(value), false)}
          />
        </Tooltip>
      </Popover.Target>
      <Popover.Dropdown p={8}>
        <SimpleGrid cols={7} spacing={8}>
          {DROPDOWN_COLOR_TOKENS.map((token) => (
            <Tooltip key={token} label={label(token)} withArrow openDelay={200}>
              <UnstyledButton
                aria-label={label(token)}
                onClick={() => {
                  onChange(token)
                  setOpened(false)
                }}
                style={swatch(getSwatchColor(token), value === token)}
              />
            </Tooltip>
          ))}
        </SimpleGrid>
      </Popover.Dropdown>
    </Popover>
  )
}
