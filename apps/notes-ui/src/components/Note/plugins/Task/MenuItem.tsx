import {MenuButton, type MenuButtonProps } from 'mui-tiptap'
import AddTaskIcon from '@mui/icons-material/AddTask';
import { useRichTextEditorContext } from 'mui-tiptap';

type MenuButtonCodeProps = Partial<MenuButtonProps>;

export const TaskMenuItem = (props: MenuButtonCodeProps) => {
  const editor = useRichTextEditorContext();

  return <MenuButton
    IconComponent={AddTaskIcon}
    tooltipLabel="Task"
    onClick={() => {
      editor?.chain().focus().setTask().run()
    }}
  />
}