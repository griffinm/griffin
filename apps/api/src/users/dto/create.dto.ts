import { PickType } from "@nestjs/mapped-types";
import { UserEntity } from "./user.entity";
import { IsString, IsNotEmpty } from "class-validator";

export class CreateDto extends PickType(
  UserEntity, 
  [
    'email',
  ]
) {
  @IsString()
  @IsNotEmpty()
  password: string;
}
