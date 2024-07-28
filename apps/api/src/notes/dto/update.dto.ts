import { PickType } from "@nestjs/mapped-types";
import { NoteEntity } from "./note.entity";

export class UpdateDto extends PickType(NoteEntity, ['title', 'content']) {}
