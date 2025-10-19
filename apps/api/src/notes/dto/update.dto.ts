import { PartialType, PickType } from "@nestjs/mapped-types";
import { NoteEntity } from "./note.entity";

export class UpdateDto extends PartialType(
  PickType(NoteEntity, ['title', 'content', 'notebookId'])
) {}
