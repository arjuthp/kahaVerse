import { IsOptional, IsString } from "class-validator";

export class FilterCartDto {
  @IsOptional()
  @IsString()
  groupBy?: string;
}
