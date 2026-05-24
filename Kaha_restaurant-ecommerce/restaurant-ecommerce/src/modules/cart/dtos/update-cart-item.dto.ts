import { Type } from "class-transformer";
import {
  IsArray,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from "class-validator";

class IaddonInfo {
  @IsNotEmpty()
  @Type(() => Number)
  @IsNumber()
  quantity?: number;

  @IsOptional()
  @IsString()
  addOnId?: string;
}

export class UpdateCartItemDto {
  @IsNotEmpty()
  @Type(() => Number)
  @IsNumber()
  quantity?: number;

  @IsArray()
  @IsOptional()
  @Type(() => IaddonInfo)
  addonInfo?: IaddonInfo[];
}
