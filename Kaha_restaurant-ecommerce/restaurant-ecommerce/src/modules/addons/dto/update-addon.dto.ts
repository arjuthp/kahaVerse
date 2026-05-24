import { IsOptional, IsNumber, IsString, IsBoolean, IsArray, Min } from "class-validator";

export class UpdateAddOnsDto {
  @IsNumber()
  @Min(0, { message: 'price must be a positive number' })
  @IsOptional()
  price?: number;

  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  coverImg?: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @IsNumber()
  @IsOptional()
  sortOrder?: number;
}

export class addOnIdsDto {
  @IsArray()
  @IsOptional()
  addOnsIds?: string[];
}
