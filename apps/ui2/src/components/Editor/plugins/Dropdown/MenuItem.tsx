import { useState } from 'react'
import { Menu, Text } from '@mantine/core'
import { MenuButton, useRichTextEditorContext } from 'mui-tiptap'
import { IconChevronDown, IconSettings } from '@tabler/icons-react'
import { useDropdowns, useCreateDropdownInstance } from '@/hooks/useDropdowns'
import { DropdownConfigModal } from '@/components/dropdowns/DropdownConfigModal'
import { defaultColorOf, dotStyle } from '@/components/dropdowns/colors'

/**
 * Toolbar control for dropdowns. Opens a Mantine menu of the user's dropdown
 * definitions; selecting one inserts a placement at the cursor. The final
 * "Configure…" item opens the management modal.
 */
export const DropdownMenuItem = ({ noteId }: { noteId?: string }) => {
  const editor = useRichTextEditorContext()
  const [menuOpened, setMenuOpened] = useState(false)
  const [configOpened, setConfigOpened] = useState(false)
  const { data: dropdowns } = useDropdowns()
  const createInstance = useCreateDropdownInstance()

  // Create the instance up front so the inserted node carries its instanceId
  // immediately (no reliance on an async attribute write after mount).
  const insert = async (dropdownId: string) => {
    setMenuOpened(false)
    if (!editor) return
    let instanceId = ''
    if (noteId) {
      try {
        const instance = await createInstance.mutateAsync({ dropdownId, noteId })
        instanceId = instance.id
      } catch {
        instanceId = ''
      }
    }
    editor
      .chain()
      .focus()
      .insertContent({ type: 'dropdown', attrs: { dropdownId, instanceId } })
      .run()
  }

  return (
    <>
      <Menu
        opened={menuOpened}
        onChange={setMenuOpened}
        position="bottom-start"
        withinPortal
        shadow="md"
      >
        <Menu.Target>
          <div style={{ display: 'inline-flex' }}>
            <MenuButton IconComponent={IconChevronDown} tooltipLabel="Dropdown" />
          </div>
        </Menu.Target>
        <Menu.Dropdown>
          {dropdowns && dropdowns.length > 0 ? (
            dropdowns.map((dropdown) => (
              <Menu.Item
                key={dropdown.id}
                onClick={() => insert(dropdown.id)}
                leftSection={<span style={dotStyle(defaultColorOf(dropdown))} />}
              >
                {dropdown.name}
              </Menu.Item>
            ))
          ) : (
            <Menu.Item disabled>
              <Text size="sm" c="dimmed">
                No dropdowns yet
              </Text>
            </Menu.Item>
          )}
          <Menu.Divider />
          <Menu.Item
            leftSection={<IconSettings size={14} />}
            onClick={() => {
              setConfigOpened(true)
              setMenuOpened(false)
            }}
          >
            Configure…
          </Menu.Item>
        </Menu.Dropdown>
      </Menu>

      <DropdownConfigModal
        opened={configOpened}
        onClose={() => setConfigOpened(false)}
      />
    </>
  )
}
