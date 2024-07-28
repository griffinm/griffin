import { PickType } from "@nestjs/mapped-types";
import { NoteEntity } from "./note.entity";

export class CreateDto extends PickType(NoteEntity, ['title', 'content']) {}
