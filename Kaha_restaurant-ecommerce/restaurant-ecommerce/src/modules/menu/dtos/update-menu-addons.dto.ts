import { IS_STRING, IsArray, IsOptional } from "class-validator";

export class UpdateMenuAddonsDto {
  @IsArray()
  @IsOptional()
  addOnsIds?: string[];
}
