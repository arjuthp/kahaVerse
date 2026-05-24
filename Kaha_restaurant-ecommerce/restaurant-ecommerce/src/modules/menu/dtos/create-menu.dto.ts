import {
  ArrayMinSize,
  IS_STRING,
  IS_URL,
  IsArray,
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  IsUrl,
} from "class-validator";
import { Type } from 'class-transformer';
import { MenuServiceEnum } from "common/enums";
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateMenuDto {
  @ApiProperty({
    description: 'Menu item name',
    example: 'Margherita Pizza'
  })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({
    description: 'Category ID',
    example: '550e8400-e29b-41d4-a716-446655440000'
  })
  @IsNotEmpty()
  @IsString()
  categoryId: string;

  @ApiPropertyOptional({
    description: 'Menu item description',
    example: 'Classic Italian pizza with fresh mozzarella, tomatoes, and basil'
  })
  @IsOptional()
  @IsString()
  description: string;

  @ApiPropertyOptional({
    description: 'Additional details (key-value pairs)',
    example: { calories: '250', spiceLevel: 'mild', prepTime: '15 minutes' }
  })
  @IsOptional()
  @IsObject()
  details: Record<string, string>;

  @ApiPropertyOptional({
    description: 'Available service types',
    example: ['DINE_IN', 'DELIVERY', 'TAKEAWAY'],
    enum: MenuServiceEnum,
    isArray: true
  })
  @IsOptional()
  @IsArray()
  @ArrayMinSize(1)
  @IsEnum(MenuServiceEnum, { each: true })
  services: MenuServiceEnum[];

  @ApiPropertyOptional({
    description: 'Menu item images',
    example: ['https://example.com/pizza1.jpg', 'https://example.com/pizza2.jpg']
  })
  @IsOptional()
  @IsArray()
  images: string[];

  @ApiPropertyOptional({
    description: 'Is this a bar item?',
    example: false,
    default: false
  })
  @IsOptional()
  @IsBoolean()
  isBarItem: boolean;

  @ApiPropertyOptional({
    description: 'Is this a signature dish?',
    example: true,
    default: false
  })
  @IsOptional()
  @IsBoolean()
  isSignature: boolean;

  @ApiPropertyOptional({
    description: 'Is the item available?',
    example: true,
    default: true
  })
  @IsOptional()
  @IsBoolean()
  isAvailable: boolean;

  @ApiPropertyOptional({
    description: 'Allow addons for this item?',
    example: true,
    default: false
  })
  @IsBoolean()
  @IsOptional()
  allowAddOns: boolean;

  @ApiProperty({
    description: 'Base price',
    example: 12.99
  })
  @IsNotEmpty()
  @Type(() => Number)
  @IsNumber()
  price: number;

  @ApiPropertyOptional({
    description: 'Addon IDs to attach',
    example: ['550e8400-e29b-41d4-a716-446655440010']
  })
  @IsOptional()
  @IsArray()
  addOnIds?: string[];

  @ApiPropertyOptional({
    description: 'Discounted price',
    example: 10.99
  })
  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  discountedPrice: number;
}
