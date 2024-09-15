import { NodeViewWrapper } from "@tiptap/react";
import QuestionIcon from '@mui/icons-material/QuestionMark';
import { useEffect, useState, useRef } from "react";
import { Button, TextField } from "@mui/material";
import DeleteIcon from '@mui/icons-material/Delete';
import { createQuestion, updateQuestion } from '../../../../utils/api';
import { useNotes } from "../../../../providers/NoteProvider";
import CheckBoxOutlineBlankIcon from '@mui/icons-material/CheckBoxOutlineBlank';
import CheckBoxIcon from '@mui/icons-material/CheckBox';

export function Component(props: any) {
  const initialEditing = props.node.attrs.questionContent === ''
  const [editing, setEditing] = useState(initialEditing)
  const { currentNote } = useNotes();
  const loadingRef = useRef(false)
  const isAnswered = props.node.attrs.questionAnswer !== ''

  useEffect(() => {
    if (!props.node.attrs.questionId && currentNote && !loadingRef.current) {
      loadingRef.current = true
      createQuestion({
        question: props.node.attrs.questionContent,
        noteId: currentNote.id,
      }).then((resp) => {
        props.updateAttributes({
          questionId: resp.data.id,
        })
      }).finally(() => {
        loadingRef.current = false
      })
    }
  }, [props.node.attrs.questionId])

  const handleSave = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setEditing(false)
    if (currentNote && !loadingRef.current) {
      loadingRef.current = true
      updateQuestion({
        question: props.node.attrs.questionContent,
        noteId: currentNote.id,
        questionId: props.node.attrs.questionId,
        answer: props.node.attrs.questionAnswer,
      }).finally(() => {
        loadingRef.current = false
      })
    }
  }

  const renderShow = () => {
    return (
      <div
        onClick={() => setEditing(true)}
        className="transition-colors hover:bg-dark-1 cursor-pointer grow"
      >
        <p>
          {props.node.attrs.questionContent}
        </p>
        <p className="font-bold">
          {props.node.attrs.questionAnswer}
        </p>
      </div>
    )
  }

  const renderEditing = () => {
    return (
      <form
        onSubmit={handleSave}
        className="flex flex-col grow bg-dark-1 p-2 rounded-md"
      >
        <div className="grow">
          <TextField
            autoComplete="off"
            fullWidth
            autoFocus
            size="small"
            variant="standard"
            value={props.node.attrs.questionContent}
            onChange={(e) => {
              props.updateAttributes({
                questionContent: e.target.value
              })
            }}
          />
        </div>
        <div className="grow flex pt-1">
          <div className="pr-2">
            A:
          </div>
          <div className="grow">
            <TextField
              autoComplete="off"
              fullWidth
              autoFocus
              size="small"
              variant="standard"
              value={props.node.attrs.questionAnswer}
              onChange={(e) => {
                props.updateAttributes({
                  questionAnswer: e.target.value
                })
              }}
            />
          </div>
        </div>
        <div className="flex justify-end">

          <Button
              onClick={() => setEditing(false)}
              color="error"
            >
              <DeleteIcon />
            </Button>
            <Button
              type="submit"
            >
            Save
          </Button>
        </div>
      </form>
    )
  }

  return (
    <NodeViewWrapper className="gc-question">
      <div className="flex py-1">
        <QuestionIcon />
        {isAnswered ? <CheckBoxIcon /> : <CheckBoxOutlineBlankIcon />}
        <div className="grow flex">
          {editing ? renderEditing() : renderShow()}
        </div>
      </div>
    </NodeViewWrapper>
  )
}
