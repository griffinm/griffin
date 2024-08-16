import { 
  IsString,
  IsNotEmpty,
  IsDate,
  IsOptional,
} from "class-validator";
import { Exclude } from "class-transformer";

export class UserEntity {
  @IsString()
  @IsNotEmpty()
  id: string;

  @IsString()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  createdAt: Date;

  @IsDate()
  @IsNotEmpty()
  updatedAt: Date;

  @IsString()
  @IsNotEmpty()
  @Exclude()
  password: string;

  @IsString()
  @IsOptional()
  firstName: string;

  constructor(partial: Partial<UserEntity>) {
    Object.assign(this, partial);
  }
}
