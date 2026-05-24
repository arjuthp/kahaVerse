import {
  IsNotEmpty,
  IsString,
  IsNumber,
  IsOptional,
  IsArray,
  ValidateNested,
} from "class-validator";
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

class CartItemAddonDto {
  @ApiProperty({
    description: 'Addon ID',
    example: '550e8400-e29b-41d4-a716-446655440010'
  })
  @IsOptional()
  @IsString()
  addonsId?: string;

  @ApiProperty({
    description: 'Addon quantity',
    example: 1
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  quantity?: number;
}

export class CreateCartItemDto {
  @ApiProperty({
    description: 'User ID',
    example: '550e8400-e29b-41d4-a716-446655440002'
  })
  @IsNotEmpty()
  @IsString()
  userId: string;

  @ApiProperty({
    description: 'Menu item ID',
    example: '550e8400-e29b-41d4-a716-446655440003'
  })
  @IsNotEmpty()
  @IsString()
  menuId: string;

  @ApiProperty({
    description: 'Menu variant ID (use menuId if no variant)',
    example: '550e8400-e29b-41d4-a716-446655440004'
  })
  @IsNotEmpty()
  @IsString()
  menuVariantId: string;

  @ApiPropertyOptional({
    description: 'Selected addons with quantities',
    type: [CartItemAddonDto],
    example: [
      { addonsId: '550e8400-e29b-41d4-a716-446655440010', quantity: 1 },
      { addonsId: '550e8400-e29b-41d4-a716-446655440011', quantity: 2 }
    ]
  })
  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => CartItemAddonDto)
  addonInfo?: CartItemAddonDto[];

  @ApiProperty({
    description: 'Item quantity',
    example: 2
  })
  @IsNotEmpty()
  @Type(() => Number)
  @IsNumber()
  quantity: number;
}
