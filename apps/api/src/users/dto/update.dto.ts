import { PickType } from "@nestjs/mapped-types";
import { UserEntity } from "./user.entity";
import { IsString, IsNotEmpty } from "class-validator";

export class UpdateDto extends PickType(
  UserEntity, 
  [
    'email',
  ]
) {
  @IsString()
  @IsNotEmpty()
  password: string;
}
