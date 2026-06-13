import { IsString, IsInt, IsOptional, IsEnum, IsNotEmpty, Min, Max } from "class-validator";
import { TableSection } from "../../../entities/restaurant-table.entity";

export class CreateTableDto {
  @IsString()
  @IsNotEmpty()
  tableNumber: string;

  @IsInt()
  @Min(1)
  @Max(20)
  capacity: number;

  @IsEnum(TableSection)
  @IsOptional()
  section?: TableSection;

  @IsString()
  @IsOptional()
  notes?: string;
}
