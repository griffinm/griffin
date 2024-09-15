import { PickType } from "@nestjs/mapped-types";
import { QuestionEntity } from "./question.entity";

export class UpdateQuestionDto extends PickType(QuestionEntity, [
  'question',
  'answer',
  'deletedAt',
] as const) {}
