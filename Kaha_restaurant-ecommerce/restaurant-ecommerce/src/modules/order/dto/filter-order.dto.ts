import { IsOptional, IsString } from "class-validator";

export class FilterOrderDto {
  @IsOptional()
  @IsString()
  startDate?: Date;

  @IsOptional()
  @IsString()
  endDate?: Date;

  @IsOptional()
  @IsString()
  status?: string;
}
