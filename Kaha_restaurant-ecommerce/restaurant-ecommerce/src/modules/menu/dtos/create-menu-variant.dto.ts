import { IsString, IsNumber, IsBoolean, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateMenuVariantDto {
  @ApiProperty({
    description: 'Variant name (e.g., Small, Medium, Large)',
    example: 'Large'
  })
  @IsString()
  name: string;

  @ApiProperty({
    description: 'Variant price',
    example: 15.99
  })
  @Type(() => Number)
  @IsNumber()
  price: number;

  @ApiPropertyOptional({
    description: 'Is variant available?',
    example: true,
    default: true
  })
  @IsBoolean()
  @IsOptional()
  isAvailable?: boolean;

  @ApiPropertyOptional({
    description: 'Display order',
    example: 3,
    default: 0
  })
  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  sortOrder?: number;
}
