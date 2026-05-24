import { IsString, IsBoolean, IsNumber, IsOptional, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';
import { AddonSelectionTypeEnum } from 'common/enums';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateAddonGroupDto {
  @ApiProperty({
    description: 'Addon group name',
    example: 'Toppings'
  })
  @IsString()
  name: string;

  @ApiProperty({
    description: 'Business ID',
    example: '550e8400-e29b-41d4-a716-446655440001'
  })
  @IsString()
  businessId: string;

  @ApiPropertyOptional({
    description: 'Is this addon group required?',
    example: false,
    default: false
  })
  @IsBoolean()
  @IsOptional()
  isRequired?: boolean;

  @ApiPropertyOptional({
    description: 'Minimum number of addons to select',
    example: 0,
    default: 0
  })
  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  minSelect?: number;

  @ApiPropertyOptional({
    description: 'Maximum number of addons to select',
    example: 5
  })
  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  maxSelect?: number;

  @ApiPropertyOptional({
    description: 'Selection type (single or multi)',
    example: 'multi',
    enum: AddonSelectionTypeEnum,
    default: 'multi'
  })
  @IsEnum(AddonSelectionTypeEnum)
  @IsOptional()
  selectionType?: AddonSelectionTypeEnum;
}
