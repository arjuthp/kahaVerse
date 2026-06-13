import { IsString, IsInt, IsOptional, IsEnum, IsBoolean, Min, Max } from "class-validator";
import { TableSection, TableStatus } from "../../../entities/restaurant-table.entity";

export class UpdateTableDto {
  @IsString()
  @IsOptional()
  tableNumber?: string;

  @IsInt()
  @Min(1)
  @Max(20)
  @IsOptional()
  capacity?: number;

  @IsEnum(TableSection)
  @IsOptional()
  section?: TableSection;

  @IsEnum(TableStatus)
  @IsOptional()
  status?: TableStatus;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @IsString()
  @IsOptional()
  notes?: string;
}
