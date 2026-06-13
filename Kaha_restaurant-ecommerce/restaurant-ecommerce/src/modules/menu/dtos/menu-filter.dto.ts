import { IsOptional, IsString, IsNumber } from "class-validator";
import { Type } from 'class-transformer';
import { PaginationDto } from "common/dtos";

export class FilterMenuDto extends PaginationDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  categoryId?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  minPrice?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  maxPrice?: number;

  @IsOptional()
  @IsString()
  groupBy?: string;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  includeHidden?: string | boolean;
}
