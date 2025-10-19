import {MenuButton, type MenuButtonProps } from 'mui-tiptap'
import { IconHelp } from '@tabler/icons-react';
import { useRichTextEditorContext } from 'mui-tiptap';

type MenuButtonQuestionProps = Partial<MenuButtonProps>;

export const QuestionMenuItem = (props: MenuButtonQuestionProps) => {
  const editor = useRichTextEditorContext();

  return <MenuButton
    IconComponent={IconHelp}
    tooltipLabel="Question"
    onClick={() => {
      editor?.chain().focus().setQuestion().run()
    }}
    {...props}
  />
}

