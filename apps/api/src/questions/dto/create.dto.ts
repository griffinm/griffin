import { PickType } from "@nestjs/mapped-types";
import { QuestionEntity } from "./question.entity";

export class CreateQuestionDto extends PickType(QuestionEntity, [
  'question',
] as const) {}
