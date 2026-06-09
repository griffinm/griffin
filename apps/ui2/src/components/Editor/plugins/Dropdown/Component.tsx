import { useEffect, useRef, useState, type ReactNode } from 'react'
import { Menu, Text } from '@mantine/core'
import { NodeViewWrapper } from '@tiptap/react'
import type { NodeViewProps } from '@tiptap/react'
import { IconCheck, IconChevronDown } from '@tabler/icons-react'
import {
  useDropdown,
  useDropdownInstance,
  useCreateDropdownInstance,
  useUpdateDropdownInstance,
} from '@/hooks/useDropdowns'
import { getPillStyle } from '@/components/dropdowns/colors'
import type { DropdownOptions } from './Extension'

export function Component(props: NodeViewProps) {
  const { node, updateAttributes, editor } = props
  const dropdownId = node.attrs.dropdownId as string
  const instanceId = node.attrs.instanceId as string
  // noteId comes from the plugin's mutable storage (kept in sync by Editor.tsx),
  // falling back to the configured option.
  const noteId =
    (editor.storage?.dropdown?.noteId as string | undefined) ??
    (props.extension.options as DropdownOptions).noteId

  const [menuOpen, setMenuOpen] = useState(false)
  const createdRef = useRef(false)

  const { data: dropdown, isError: dropdownError } = useDropdown(dropdownId)
  const { data: instance } = useDropdownInstance(instanceId)
  const createInstance = useCreateDropdownInstance()
  const updateInstance = useUpdateDropdownInstance()

  // Lazily create the instance row for a freshly inserted (or duplicated)
  // placement, then persist its id back onto the node.
  useEffect(() => {
    if (!instanceId && dropdownId && noteId && !createdRef.current) {
      createdRef.current = true
      createInstance.mutate(
        { dropdownId, noteId },
        { onSuccess: (created) => updateAttributes({ instanceId: created.id }) },
      )
    }
  }, [instanceId, dropdownId, noteId]) // eslint-disable-line react-hooks/exhaustive-deps

  const options = dropdown?.options ?? []
  const defaultOption = options.find((o) => o.isDefault) ?? options[0]
  const selectedOptionId = instance?.selectedOptionId ?? null
  const activeOption =
    options.find((o) => o.id === selectedOptionId) ?? defaultOption

  // Ensure an instance row exists (creating it on demand if lazy creation has
  // not completed), returning its id so the selection can be persisted.
  const ensureInstanceId = async (): Promise<string | null> => {
    if (instanceId) return instanceId
    if (!dropdownId || !noteId) return null
    createdRef.current = true
    const created = await createInstance.mutateAsync({ dropdownId, noteId })
    updateAttributes({ instanceId: created.id })
    return created.id
  }

  const handleSelect = async (optionId: string) => {
    if (optionId === activeOption?.id) return
    const id = await ensureInstanceId()
    if (!id) return
    updateInstance.mutate({ id, selectedOptionId: optionId })
  }

  const wrap = (child: ReactNode) => (
    <NodeViewWrapper as="span" className="dropdown-component">
      <span contentEditable={false}>{child}</span>
    </NodeViewWrapper>
  )

  if (!dropdownId || dropdownError) {
    return wrap(
      <span
        className="dropdown-pill"
        style={getPillStyle('gray')}
        title="This dropdown was deleted"
      >
        deleted dropdown
      </span>,
    )
  }

  if (!dropdown) {
    return wrap(
      <span className="dropdown-pill" style={getPillStyle('gray')}>
        …
      </span>,
    )
  }

  return wrap(
    <Menu
      opened={menuOpen}
      onChange={setMenuOpen}
      position="bottom-start"
      offset={4}
      withinPortal
      shadow="md"
      radius="md"
      transitionProps={{ transition: 'pop', duration: 120 }}
    >
      <Menu.Target>
        <span
          className="dropdown-pill dropdown-pill--interactive"
          style={getPillStyle(activeOption?.color)}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault()
              setMenuOpen((o) => !o)
            }
          }}
        >
          <span>{activeOption?.label ?? 'Select…'}</span>
          <IconChevronDown
            size={12}
            className="dropdown-pill__caret"
            style={menuOpen ? { transform: 'rotate(180deg)' } : undefined}
          />
        </span>
      </Menu.Target>
      <Menu.Dropdown>
        {options.length === 0 ? (
          <Menu.Item disabled>
            <Text size="xs" c="dimmed">
              No options — configure first
            </Text>
          </Menu.Item>
        ) : (
          options.map((o) => (
            <Menu.Item
              key={o.id}
              onClick={() => handleSelect(o.id)}
              leftSection={
                <IconCheck
                  size={14}
                  style={{ opacity: o.id === activeOption?.id ? 1 : 0 }}
                />
              }
            >
              <span className="dropdown-pill" style={getPillStyle(o.color)}>
                {o.label}
              </span>
            </Menu.Item>
          ))
        )}
      </Menu.Dropdown>
    </Menu>,
  )
}
