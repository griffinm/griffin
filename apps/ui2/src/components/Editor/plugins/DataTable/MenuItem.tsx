import { MenuButton, useRichTextEditorContext } from 'mui-tiptap'
import type { MenuButtonProps } from 'mui-tiptap'
import { IconDatabase } from '@tabler/icons-react'

export const DataTableMenuItem = (props: Partial<MenuButtonProps>) => {
  const editor = useRichTextEditorContext()
  return (
    <MenuButton
      IconComponent={IconDatabase}
      tooltipLabel="Data table"
      onClick={() => editor?.chain().focus().setDataTable().run()}
      {...props}
    />
  )
}
