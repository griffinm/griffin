import { PickType } from "@nestjs/mapped-types";
import { UserEntity } from "./user.entity";
import { IsString, IsNotEmpty, IsOptional } from "class-validator";

export class UpdateDto extends PickType(
  UserEntity, 
  [
    'email',
    'firstName',
  ]
) {
  @IsString()
  @IsOptional()
  @IsNotEmpty()
  password: string;
}
