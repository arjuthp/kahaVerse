import {
  IsEnum,
  IsNumber,
  IsOptional,
  IsInt,
  Min,
  Max,
  IsPositive,
} from 'class-validator';
import { Type } from 'class-transformer';
import { AccrualMode } from '../../../entities/loyalty-config.entity';

export class UpdateLoyaltyConfigDto {
  @IsOptional()
  @IsNumber()
  @Min(0.01)
  @Max(10)
  @Type(() => Number)
  pointsPerNpr?: number;

  @IsOptional()
  @IsNumber()
  @Min(0.01)
  @Max(10)
  @Type(() => Number)
  pointsToNprRate?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(10000)
  @Type(() => Number)
  minRedeemPoints?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(3650)
  @Type(() => Number)
  voucherExpiryDays?: number;

  @IsOptional()
  @IsEnum(AccrualMode)
  accrualMode?: AccrualMode;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(10000)
  @Type(() => Number)
  pointsPerVisit?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1000000)
  @Type(() => Number)
  minSpendForVisit?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(10)
  @Type(() => Number)
  bonusMultiplier?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(3650)
  @Type(() => Number)
  pointsExpiryDays?: number | null;
}
