import { useEffect, useState } from 'react'
import {
  ActionIcon,
  Button,
  CloseButton,
  Group,
  Loader,
  Modal,
  Stack,
  Text,
  TextInput,
  Tooltip,
  UnstyledButton,
} from '@mantine/core'
import { useMediaQuery } from '@mantine/hooks'
import {
  IconChevronLeft,
  IconChevronRight,
  IconPlus,
  IconSelector,
  IconStar,
  IconStarFilled,
  IconTrash,
} from '@tabler/icons-react'
import {
  useDropdowns,
  useDropdown,
  useCreateDropdown,
  useUpdateDropdown,
  useDeleteDropdown,
  useAddDropdownOption,
  useUpdateDropdownOption,
  useDeleteDropdownOption,
} from '@/hooks/useDropdowns'
import { DropdownOption } from '@/types/dropdown'
import { ConfirmationModal } from '@/views/NoteTree/ConfirmationModal'
import { ColorTokenPicker } from './DropdownColorPicker'
import { defaultColorOf, dotStyle, getPillStyle, getSwatchColor } from './colors'

interface DropdownConfigModalProps {
  opened: boolean
  onClose: () => void
}

// Tiny editorial section labels used throughout the panel.
const MICRO_LABEL =
  'text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--mantine-color-dimmed)]'

const BORDER = 'var(--mantine-color-default-border)'

// ---- A single editable option row -------------------------------------------

function OptionRow({
  dropdownId,
  option,
}: {
  dropdownId: string
  option: DropdownOption
}) {
  const [label, setLabel] = useState(option.label)
  const updateOption = useUpdateDropdownOption()
  const deleteOption = useDeleteDropdownOption()

  useEffect(() => {
    setLabel(option.label)
  }, [option.label])

  const commitLabel = () => {
    const trimmed = label.trim()
    if (trimmed && trimmed !== option.label) {
      updateOption.mutate({ dropdownId, optionId: option.id, option: { label: trimmed } })
    } else {
      setLabel(option.label)
    }
  }

  return (
    <div
      className="flex items-center gap-1.5 rounded-md py-1 pl-3 pr-1 transition-colors hover:bg-[var(--mantine-color-default-hover)]"
      // Color "tab" down the left edge — keeps the row readable by color.
      style={{ boxShadow: `inset 3px 0 0 ${getSwatchColor(option.color)}` }}
    >
      <Tooltip
        label={option.isDefault ? 'Default option' : 'Set as default'}
        withArrow
        openDelay={300}
      >
        <ActionIcon
          variant="subtle"
          color={option.isDefault ? 'yellow' : 'gray'}
          aria-label={option.isDefault ? 'Default option' : 'Set as default'}
          onClick={() => {
            if (!option.isDefault) {
              updateOption.mutate({
                dropdownId,
                optionId: option.id,
                option: { isDefault: true },
              })
            }
          }}
        >
          {option.isDefault ? <IconStarFilled size={15} /> : <IconStar size={15} />}
        </ActionIcon>
      </Tooltip>

      <ColorTokenPicker
        ariaLabel="Color scheme"
        value={option.color}
        onChange={(c) =>
          updateOption.mutate({ dropdownId, optionId: option.id, option: { color: c } })
        }
      />

      <TextInput
        variant="unstyled"
        size="sm"
        value={label}
        placeholder="Label"
        onChange={(e) => setLabel(e.currentTarget.value)}
        onBlur={commitLabel}
        onKeyDown={(e) => {
          if (e.key === 'Enter') e.currentTarget.blur()
        }}
        styles={{ input: { fontWeight: 500 } }}
        style={{ flex: 1, minWidth: 0 }}
      />

      <ActionIcon
        variant="subtle"
        color="red"
        aria-label="Remove option"
        onClick={() => deleteOption.mutate({ dropdownId, optionId: option.id })}
      >
        <IconTrash size={14} />
      </ActionIcon>
    </div>
  )
}

// ---- Detail pane: edit one dropdown definition ------------------------------

function DropdownDetail({
  dropdownId,
  onDeleted,
  onBack,
}: {
  dropdownId: string
  onDeleted: () => void
  onBack?: () => void
}) {
  const { data: dropdown } = useDropdown(dropdownId)
  const [name, setName] = useState('')
  const [newOptionLabel, setNewOptionLabel] = useState('')
  const [confirmDelete, setConfirmDelete] = useState(false)
  const updateDropdown = useUpdateDropdown()
  const addOption = useAddDropdownOption()
  const deleteDropdown = useDeleteDropdown()

  useEffect(() => {
    if (dropdown) setName(dropdown.name)
  }, [dropdown?.name]) // eslint-disable-line react-hooks/exhaustive-deps

  if (!dropdown) {
    return (
      <div className="grid flex-1 place-items-center">
        <Loader size="sm" />
      </div>
    )
  }

  const commitName = () => {
    const trimmed = name.trim()
    if (trimmed && trimmed !== dropdown.name) {
      updateDropdown.mutate({ id: dropdownId, name: trimmed })
    } else {
      setName(dropdown.name)
    }
  }

  const handleAddOption = () => {
    const trimmed = newOptionLabel.trim()
    if (!trimmed) return
    addOption.mutate({ dropdownId, option: { label: trimmed } })
    setNewOptionLabel('')
  }

  return (
    <div className="dropdown-detail flex flex-col gap-5 p-5" key={dropdownId}>
      {onBack && (
        <Button
          variant="subtle"
          size="compact-sm"
          color="gray"
          leftSection={<IconChevronLeft size={14} />}
          onClick={onBack}
          style={{ alignSelf: 'flex-start' }}
        >
          All dropdowns
        </Button>
      )}

      {/* Title row */}
      <div className="flex items-center gap-2">
        <TextInput
          variant="unstyled"
          value={name}
          placeholder="Dropdown name"
          onChange={(e) => setName(e.currentTarget.value)}
          onBlur={commitName}
          onKeyDown={(e) => {
            if (e.key === 'Enter') e.currentTarget.blur()
          }}
          styles={{ input: { fontSize: '1.1rem', fontWeight: 650, padding: 0 } }}
          style={{ flex: 1, minWidth: 0 }}
        />
        <Tooltip label="Delete dropdown" withArrow openDelay={300}>
          <ActionIcon
            variant="subtle"
            color="red"
            aria-label="Delete dropdown"
            onClick={() => setConfirmDelete(true)}
          >
            <IconTrash size={16} />
          </ActionIcon>
        </Tooltip>
      </div>

      {/* Live preview */}
      {dropdown.options.length > 0 && (
        <div>
          <div className={MICRO_LABEL}>Preview</div>
          <div
            className="mt-2 flex flex-wrap items-center gap-1.5 rounded-md p-3"
            style={{ background: 'var(--mantine-color-default-hover)' }}
          >
            {dropdown.options.map((o) => (
              <span key={o.id} className="dropdown-pill" style={getPillStyle(o.color)}>
                {o.label}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Options */}
      <div>
        <div className="mb-2 flex items-center justify-between">
          <span className={MICRO_LABEL}>Options</span>
          <Text size="xs" c="dimmed">
            ★ marks the default
          </Text>
        </div>

        <Stack gap={4}>
          {dropdown.options.length === 0 && (
            <Text size="xs" c="dimmed" py="xs">
              No options yet — add your first below.
            </Text>
          )}
          {dropdown.options.map((option) => (
            <OptionRow key={option.id} dropdownId={dropdownId} option={option} />
          ))}
        </Stack>

        <Group gap="xs" mt="sm" wrap="nowrap">
          <TextInput
            size="xs"
            placeholder="Add an option…"
            value={newOptionLabel}
            onChange={(e) => setNewOptionLabel(e.currentTarget.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleAddOption()
            }}
            style={{ flex: 1 }}
          />
          <Button
            size="xs"
            variant="light"
            leftSection={<IconPlus size={14} />}
            onClick={handleAddOption}
            loading={addOption.isPending}
          >
            Add
          </Button>
        </Group>
      </div>

      <ConfirmationModal
        opened={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        onConfirm={() => {
          deleteDropdown.mutate(dropdownId)
          setConfirmDelete(false)
          onDeleted()
        }}
        title="Delete dropdown"
        message={`Delete "${dropdown.name}"? Every placement of this dropdown in your notes will be removed.`}
        confirmLabel="Delete"
      />
    </div>
  )
}

// ---- Left rail: the dropdown list + create field ----------------------------

function DropdownRail({
  dropdowns,
  selectedId,
  onSelect,
  onDelete,
  onCreate,
  creating,
  isMobile,
}: {
  dropdowns: { id: string; name: string; options: DropdownOption[] }[]
  selectedId: string | null
  onSelect: (_id: string) => void
  onDelete: (_id: string) => void
  onCreate: (_name: string) => void
  creating: boolean
  isMobile: boolean
}) {
  const [newName, setNewName] = useState('')

  const submit = () => {
    const trimmed = newName.trim()
    if (!trimmed) return
    onCreate(trimmed)
    setNewName('')
  }

  return (
    <div
      className="flex min-h-0 flex-col"
      style={{
        width: isMobile ? '100%' : 240,
        borderRight: isMobile ? undefined : `1px solid ${BORDER}`,
      }}
    >
      <div className="min-h-0 flex-1 overflow-y-auto p-2">
        {dropdowns.length === 0 ? (
          <Text size="xs" c="dimmed" p="sm">
            No dropdowns yet.
          </Text>
        ) : (
          dropdowns.map((d) => {
            const active = d.id === selectedId
            return (
              <div
                key={d.id}
                className={`group flex items-center gap-1 rounded-md pr-1 ${
                  active
                    ? 'bg-[var(--mantine-color-default-hover)]'
                    : 'hover:bg-[var(--mantine-color-default-hover)]'
                }`}
                style={
                  active
                    ? { boxShadow: `inset 3px 0 0 ${getSwatchColor(defaultColorOf(d))}` }
                    : undefined
                }
              >
                <UnstyledButton
                  className="min-w-0 flex-1 py-1.5 pl-2.5"
                  onClick={() => onSelect(d.id)}
                >
                  <Group gap="xs" wrap="nowrap" justify="space-between">
                    <Group gap="xs" wrap="nowrap" style={{ minWidth: 0 }}>
                      <span style={dotStyle(defaultColorOf(d))} />
                      <Text size="sm" fw={active ? 600 : 500} truncate>
                        {d.name}
                      </Text>
                    </Group>
                    {isMobile && (
                      <IconChevronRight
                        size={14}
                        className="text-[var(--mantine-color-dimmed)]"
                      />
                    )}
                  </Group>
                </UnstyledButton>
                <ActionIcon
                  variant="subtle"
                  color="red"
                  size="sm"
                  aria-label="Delete dropdown"
                  className={isMobile ? '' : 'opacity-0 transition-opacity group-hover:opacity-100'}
                  onClick={() => onDelete(d.id)}
                >
                  <IconTrash size={14} />
                </ActionIcon>
              </div>
            )
          })
        )}
      </div>

      <div className="p-2" style={{ borderTop: `1px solid ${BORDER}` }}>
        <Group gap={6} wrap="nowrap">
          <TextInput
            size="xs"
            placeholder="New dropdown"
            value={newName}
            onChange={(e) => setNewName(e.currentTarget.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') submit()
            }}
            style={{ flex: 1 }}
          />
          <Tooltip label="Create dropdown" withArrow openDelay={300}>
            <ActionIcon
              variant="filled"
              onClick={submit}
              loading={creating}
              aria-label="Create dropdown"
            >
              <IconPlus size={16} />
            </ActionIcon>
          </Tooltip>
        </Group>
      </div>
    </div>
  )
}

// ---- Empty detail placeholder (desktop, nothing selected) -------------------

function EmptyDetail({ hasDropdowns }: { hasDropdowns: boolean }) {
  return (
    <div className="grid flex-1 place-items-center p-8 text-center">
      <div>
        <div
          className="mx-auto mb-3 grid place-items-center rounded-full"
          style={{ width: 46, height: 46, background: 'var(--mantine-color-default-hover)' }}
        >
          <IconSelector size={22} className="text-[var(--mantine-color-dimmed)]" />
        </div>
        <Text size="sm" fw={500}>
          {hasDropdowns ? 'Select a dropdown to edit' : 'Create your first dropdown'}
        </Text>
        <Text size="xs" c="dimmed" mt={4}>
          {hasDropdowns
            ? 'Or add a new one from the field on the left.'
            : 'Name it on the left — then add colored options.'}
        </Text>
      </div>
    </div>
  )
}

// ---- The modal --------------------------------------------------------------

export function DropdownConfigModal({ opened, onClose }: DropdownConfigModalProps) {
  const isMobile = useMediaQuery('(max-width: 768px)')
  const { data: dropdowns } = useDropdowns()
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
  const createDropdown = useCreateDropdown()
  const deleteDropdown = useDeleteDropdown()

  const list = dropdowns ?? []

  const handleClose = () => {
    setSelectedId(null)
    onClose()
  }

  const handleCreate = (name: string) => {
    createDropdown.mutate({ name }, { onSuccess: (d) => setSelectedId(d.id) })
  }

  const confirmTarget = list.find((d) => d.id === confirmDeleteId)
  const showRail = !isMobile || !selectedId
  const showDetail = !isMobile || !!selectedId

  return (
    <Modal
      opened={opened}
      onClose={handleClose}
      withCloseButton={false}
      padding={0}
      size={820}
      radius={isMobile ? 0 : 'md'}
      fullScreen={isMobile}
    >
      <div className="flex flex-col" style={{ height: isMobile ? '100dvh' : 520 }}>
        {/* Header */}
        <div
          className="flex items-center justify-between px-4 py-3"
          style={{ borderBottom: `1px solid ${BORDER}` }}
        >
          <div className="flex items-center gap-2.5">
            <div
              className="grid place-items-center rounded-md"
              style={{ width: 30, height: 30, background: 'var(--mantine-color-default-hover)' }}
            >
              <IconSelector size={16} />
            </div>
            <div>
              <Text fw={650} size="sm" style={{ lineHeight: 1.15 }}>
                Dropdowns
              </Text>
              <Text size="xs" c="dimmed" style={{ lineHeight: 1.15 }}>
                Reusable status menus for your notes
              </Text>
            </div>
          </div>
          <CloseButton onClick={handleClose} aria-label="Close" />
        </div>

        {/* Body */}
        <div className="flex min-h-0 flex-1">
          {showRail && (
            <DropdownRail
              dropdowns={list}
              selectedId={selectedId}
              onSelect={setSelectedId}
              onDelete={setConfirmDeleteId}
              onCreate={handleCreate}
              creating={createDropdown.isPending}
              isMobile={!!isMobile}
            />
          )}

          {showDetail &&
            (selectedId ? (
              <div key={selectedId} className="min-w-0 flex-1 overflow-y-auto">
                <DropdownDetail
                  dropdownId={selectedId}
                  onDeleted={() => setSelectedId(null)}
                  onBack={isMobile ? () => setSelectedId(null) : undefined}
                />
              </div>
            ) : (
              !isMobile && <EmptyDetail hasDropdowns={list.length > 0} />
            ))}
        </div>
      </div>

      <ConfirmationModal
        opened={!!confirmDeleteId}
        onClose={() => setConfirmDeleteId(null)}
        onConfirm={() => {
          if (confirmDeleteId) {
            deleteDropdown.mutate(confirmDeleteId)
            if (confirmDeleteId === selectedId) setSelectedId(null)
          }
          setConfirmDeleteId(null)
        }}
        title="Delete dropdown"
        message={`Delete "${confirmTarget?.name ?? ''}"? Every placement of this dropdown in your notes will be removed.`}
        confirmLabel="Delete"
      />
    </Modal>
  )
}
