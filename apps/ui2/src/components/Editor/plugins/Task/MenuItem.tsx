import {MenuButton, type MenuButtonProps } from 'mui-tiptap'
import { IconCheckbox } from '@tabler/icons-react';
import { useRichTextEditorContext } from 'mui-tiptap';

type MenuButtonTaskProps = Partial<MenuButtonProps>;

export const TaskMenuItem = (props: MenuButtonTaskProps) => {
  const editor = useRichTextEditorContext();

  return <MenuButton
    IconComponent={IconCheckbox}
    tooltipLabel="Task"
    onClick={() => {
      editor?.chain().focus().setTask().run()
    }}
    {...props}
  />
}

