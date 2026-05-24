import {
  IS_URL,
  IS_STRING,
  IsArray,
  IsBoolean,
  IsNumber,
  IsOptional,
  IsString,
  IsUrl,
  IsEnum,
  ArrayMinSize,
  IsNotEmpty,
  IsObject,
} from "class-validator";
import { Type } from 'class-transformer';
import { MenuServiceEnum } from "common/enums";

export class UpdateMenuDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsNotEmpty()
  @IsString()
  categoryId: string;

  @IsOptional()
  @IsString()
  description: string;

  @IsOptional()
  @IsObject()
  details: Record<string, string>;

  @IsOptional()
  @IsArray()
  @ArrayMinSize(1)
  @IsEnum(MenuServiceEnum, { each: true })
  services: MenuServiceEnum[];

  @IsOptional()
  @IsArray()
  images: string[];

  @IsOptional()
  @IsBoolean()
  isBarItem: boolean;

  @IsOptional()
  @IsBoolean()
  isSignature: boolean;

  @IsOptional()
  @IsBoolean()
  isAvailable: boolean;

  @IsBoolean()
  @IsOptional()
  allowAddOns: boolean;

  @IsNotEmpty()
  @Type(() => Number)
  @IsNumber()
  price: number;

  @IsOptional()
  @IsArray()
  addOnIds?: string[];

  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  discountedPrice: number;
}
