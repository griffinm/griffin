import { 
  IsString,
  IsNotEmpty,
  IsDate,
  IsOptional,
} from "class-validator";
import { Exclude, Expose } from "class-transformer";

@Exclude()
export class UserEntity {
  @IsString()
  @IsNotEmpty()
  @Expose()
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
  @Expose()
  firstName: string;

  constructor(partial: Partial<UserEntity>) {
    Object.assign(this, partial);
  }
}
