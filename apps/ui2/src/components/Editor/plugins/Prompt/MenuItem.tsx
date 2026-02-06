import { MenuButton, type MenuButtonProps } from 'mui-tiptap'
import { IconTerminal2 } from '@tabler/icons-react'
import { useRichTextEditorContext } from 'mui-tiptap'

type MenuButtonPromptProps = Partial<MenuButtonProps>

export const PromptMenuItem = (props: MenuButtonPromptProps) => {
  const editor = useRichTextEditorContext()

  return (
    <MenuButton
      IconComponent={IconTerminal2}
      tooltipLabel="Prompt"
      onClick={() => {
        editor?.chain().focus().setPrompt().run()
      }}
      {...props}
    />
  )
}
