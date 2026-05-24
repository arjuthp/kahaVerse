import {
  IsNotEmpty,
  IsString,
  MaxLength,
  IsBoolean,
  IsOptional,
  IsNumber,
} from "class-validator";
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateCategoryDto {
  @ApiProperty({
    description: 'Category name',
    example: 'Appetizers'
  })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiPropertyOptional({
    description: 'Category description',
    example: 'Start your meal with our delicious appetizers'
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  description?: string;

  @ApiPropertyOptional({
    description: 'Category icon (emoji or URL)',
    example: '🍴'
  })
  @IsOptional()
  @IsString()
  icon: string;

  @ApiPropertyOptional({
    description: 'Parent category ID for hierarchical structure',
    example: '550e8400-e29b-41d4-a716-446655440000'
  })
  @IsOptional()
  @IsString()
  parentId?: string;

  @ApiPropertyOptional({
    description: 'Business ID',
    example: '550e8400-e29b-41d4-a716-446655440001'
  })
  @IsOptional()
  @IsString()
  businessId?: string;

  @ApiPropertyOptional({
    description: 'Category availability status',
    example: true,
    default: true
  })
  @IsOptional()
  @IsBoolean()
  isAvailable?: boolean;

  @ApiPropertyOptional({
    description: 'User ID who created the category',
    example: '550e8400-e29b-41d4-a716-446655440002'
  })
  @IsOptional()
  @IsString()
  createdBy?: string;

  @ApiPropertyOptional({
    description: 'Display position/order',
    example: 1
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  position?: number;
}
