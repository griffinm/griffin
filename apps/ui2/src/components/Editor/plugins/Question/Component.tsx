import { NodeViewWrapper } from "@tiptap/react";
import { IconHelp, IconSquare, IconSquareCheck } from '@tabler/icons-react';
import { useEffect, useState, useRef } from "react";
import { Button, TextInput } from "@mantine/core";
import { useCreateQuestion, useUpdateQuestion } from '@/hooks/useQuestions';
import { useParams } from 'react-router-dom';
import type { NodeViewProps } from '@tiptap/react';

export function Component(props: NodeViewProps) {
  const { noteId } = useParams<{ noteId: string }>();
  const { node, updateAttributes } = props;
  const initialEditing = node.attrs.questionContent === ''
  const [editing, setEditing] = useState(initialEditing)
  const loadingRef = useRef(false)
  const isAnswered = node.attrs.questionAnswer !== ''
  const createQuestionMutation = useCreateQuestion();
  const updateQuestionMutation = useUpdateQuestion();

  useEffect(() => {
    if (!node.attrs.questionId && noteId && !loadingRef.current) {
      loadingRef.current = true
      createQuestionMutation.mutate(
        {
          noteId,
          data: {
            question: node.attrs.questionContent,
            noteId,
          }
        },
        {
          onSuccess: (question) => {
            updateAttributes({
              questionId: question.id,
            })
          },
          onSettled: () => {
            loadingRef.current = false
          }
        }
      )
    }
  }, [node.attrs.questionId, node.attrs.questionContent, noteId, createQuestionMutation, updateAttributes])

  const handleSave = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setEditing(false)
    if (noteId && !loadingRef.current) {
      loadingRef.current = true
      updateQuestionMutation.mutate(
        {
          noteId,
          questionId: node.attrs.questionId,
          data: {
            question: node.attrs.questionContent,
            answer: node.attrs.questionAnswer,
          }
        },
        {
          onSettled: () => {
            loadingRef.current = false
          }
        }
      )
    }
  }

  const renderShow = () => {
    return (
      <div
        onClick={() => setEditing(true)}
        className="transition-colors hover:bg-[var(--mantine-color-default-hover)] cursor-pointer flex-1 px-2 py-1 rounded"
      >
        <p className="text-sm">
          {node.attrs.questionContent}
        </p>
        {node.attrs.questionAnswer && (
          <p className="text-sm font-semibold mt-1">
            {node.attrs.questionAnswer}
          </p>
        )}
      </div>
    )
  }

  const renderEditing = () => {
    return (
      <form
        onSubmit={handleSave}
        className="flex flex-col flex-1 bg-[var(--mantine-color-default-hover)] p-3 rounded"
      >
        <div className="mb-2">
          <TextInput
            placeholder="Question"
            size="sm"
            autoFocus
            value={node.attrs.questionContent}
            onChange={(e) => {
              updateAttributes({
                questionContent: e.target.value
              })
            }}
          />
        </div>
        <div className="flex gap-2 items-center mb-2">
          <span className="text-sm font-medium">A:</span>
          <TextInput
            placeholder="Answer"
            size="sm"
            className="flex-1"
            value={node.attrs.questionAnswer}
            onChange={(e) => {
              updateAttributes({
                questionAnswer: e.target.value
              })
            }}
          />
        </div>
        <div className="flex justify-end gap-2">
          <Button
            type="button"
            size="xs"
            variant="subtle"
            onClick={() => setEditing(false)}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            size="xs"
          >
            Save
          </Button>
        </div>
      </form>
    )
  }

  return (
    <NodeViewWrapper className="question-component">
      <div className="flex gap-2 py-1 items-start" contentEditable={false} data-drag-handle>
        <IconHelp size={20} className="text-blue-500 flex-shrink-0 mt-1" />
        {isAnswered ? (
          <IconSquareCheck size={20} className="text-green-500 flex-shrink-0 mt-1" />
        ) : (
          <IconSquare size={20} className="text-[var(--mantine-color-dimmed)] flex-shrink-0 mt-1" />
        )}
        <div className="flex flex-1">
          {editing ? renderEditing() : renderShow()}
        </div>
      </div>
    </NodeViewWrapper>
  )
}

