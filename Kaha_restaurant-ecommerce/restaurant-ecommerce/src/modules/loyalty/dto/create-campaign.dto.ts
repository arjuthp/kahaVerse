import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsNumber,
  IsNotEmpty,
  IsEnum,
  IsBoolean,
  IsArray,
  IsInt,
  IsDateString,
  Min,
} from 'class-validator';
import { VoucherDiscountType, VoucherDiscountClass } from '../../../entities/voucher.enums';

export class CreateCampaignDto {
  @ApiPropertyOptional({ description: 'Business ID (null = platform-wide campaign)' })
  @IsOptional()
  @IsString()
  businessId?: string;

  @ApiProperty({ description: 'Campaign name', example: 'Summer 10% Off' })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiPropertyOptional({ description: 'Unique campaign code / code pattern', example: 'SUMMER10' })
  @IsOptional()
  @IsString()
  code?: string;

  @ApiPropertyOptional({ description: 'Code pattern for bulk generation', example: 'SUMMER10-*' })
  @IsOptional()
  @IsString()
  codePattern?: string;

  @ApiProperty({ enum: VoucherDiscountType, example: VoucherDiscountType.PERCENTAGE })
  @IsEnum(VoucherDiscountType)
  discountType: VoucherDiscountType;

  @ApiProperty({ description: 'Discount value (amount or percent)', example: 10 })
  @IsNumber()
  @Min(0)
  discountValue: number;

  @ApiPropertyOptional({ description: 'Maximum discount cap (for PERCENTAGE type)', example: 200 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  maxDiscountAmount?: number;

  @ApiPropertyOptional({ description: 'Minimum order amount to qualify', example: 500 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  minOrderAmount?: number;

  @ApiProperty({ enum: VoucherDiscountClass, example: VoucherDiscountClass.ORDER_TOTAL })
  @IsEnum(VoucherDiscountClass)
  discountClass: VoucherDiscountClass;

  @ApiPropertyOptional({ type: [String], description: 'Applicable service types (DELIVERY, DINE_IN, TAKEAWAY)' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  applicableServiceTypes?: string[];

  @ApiPropertyOptional({ type: [String], description: 'Restrict to specific category IDs' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  applicableCategoryIds?: string[];

  @ApiPropertyOptional({ type: [String], description: 'Restrict to specific menu item IDs' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  applicableMenuItemIds?: string[];

  @ApiPropertyOptional({ description: 'Only valid for first-time orders' })
  @IsOptional()
  @IsBoolean()
  requiresFirstOrder?: boolean;

  @ApiPropertyOptional({ type: [Number], description: 'Days of week (0=Sun … 6=Sat)' })
  @IsOptional()
  @IsArray()
  @IsInt({ each: true })
  validDaysOfWeek?: number[];

  @ApiPropertyOptional({ description: 'Earliest valid time HH:MM:SS', example: '09:00:00' })
  @IsOptional()
  @IsString()
  validTimeStart?: string;

  @ApiPropertyOptional({ description: 'Latest valid time HH:MM:SS', example: '22:00:00' })
  @IsOptional()
  @IsString()
  validTimeEnd?: string;

  @ApiPropertyOptional({ description: 'Total redemption cap across all users', example: 500 })
  @IsOptional()
  @IsInt()
  @Min(1)
  maxRedemptionsTotal?: number;

  @ApiPropertyOptional({ description: 'Per-user redemption cap', example: 3 })
  @IsOptional()
  @IsInt()
  @Min(1)
  maxRedemptionsPerUser?: number;

  @ApiPropertyOptional({ description: 'Per-user per-day redemption cap', example: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  maxRedemptionsPerUserPerDay?: number;

  @ApiPropertyOptional({ description: 'Total budget cap in NPR', example: 10000 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  totalBudgetCap?: number;

  @ApiPropertyOptional({ description: 'Stack priority (higher = applied first)', example: 0 })
  @IsOptional()
  @IsInt()
  stackPriority?: number;

  @ApiPropertyOptional({ type: [String], description: 'Campaign IDs this can combine with' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  combinesWith?: string[];

  @ApiPropertyOptional({ description: 'Campaign activation start timestamp', example: '2026-07-01T00:00:00.000Z' })
  @IsOptional()
  @IsDateString()
  startsAt?: string;

  @ApiPropertyOptional({ description: 'Campaign expiry timestamp', example: '2026-12-31T23:59:59.000Z' })
  @IsOptional()
  @IsDateString()
  expiresAt?: string;

  @ApiPropertyOptional({ description: 'Admin user ID who created this campaign' })
  @IsOptional()
  @IsString()
  createdBy?: string;
}
