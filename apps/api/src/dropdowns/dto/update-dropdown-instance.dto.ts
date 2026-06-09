import { IsOptional, IsString, ValidateIf } from 'class-validator';

export class UpdateDropdownInstanceDto {
  // Nullable: null means "clear the selection and fall back to the default".
  @ValidateIf((o) => o.selectedOptionId !== null)
  @IsString()
  @IsOptional()
  selectedOptionId?: string | null;
}
