import { ApiProperty } from "@nestjs/swagger";
import {
  IsString,
  IsOptional,
  IsNumber,
  IsNotEmpty,
  IsEnum,
  IsInt,
  Min,
} from "class-validator";

export class CreateVoucherDto {
  @ApiProperty({
    example: '550e8400-e29b-41d4-a716-446655440000',
    description: 'UUID of the customer receiving this voucher'
  })
  @IsNotEmpty()
  @IsString()
  userId: string;

  @ApiProperty({
    example: '550e8400-e29b-41d4-a716-446655440001',
    description: 'UUID of the business this voucher belongs to'
  })
  @IsNotEmpty()
  @IsString()
  businessId: string;

  @ApiProperty({
    example: 'KAHA-WELCOME',
    description: 'Voucher code. If not provided, it will be auto-generated.',
    required: false
  })
  @IsOptional()
  @IsString()
  code?: string;

  @ApiProperty({
    example: 'PERCENTAGE',
    enum: ['FIXED', 'PERCENTAGE'],
    description: 'Type of discount (FIXED amount or PERCENTAGE of total)'
  })
  @IsNotEmpty()
  @IsEnum(['FIXED', 'PERCENTAGE'])
  discountType: 'FIXED' | 'PERCENTAGE';

  @ApiProperty({
    example: 20,
    description: 'Value of the discount. E.g., 20 means NPR 20 (for FIXED) or 20% (for PERCENTAGE).'
  })
  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  discountValue: number;

  @ApiProperty({
    example: 500,
    description: 'Maximum discount amount in NPR allowed for a PERCENTAGE voucher.',
    required: false
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  maxDiscountAmount?: number;

  @ApiProperty({
    example: 1000,
    description: 'Minimum cart total required to apply this voucher.',
    required: false
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  minOrderAmount?: number;

  @ApiProperty({
    example: 100,
    description: 'Global usage limit for this voucher across all users.',
    required: false
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  maxUses?: number;

  @ApiProperty({
    example: 1,
    description: 'How many times a single user can redeem this voucher. Defaults to 1.',
    required: false,
    default: 1
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  maxUsesPerUser?: number;

  @ApiProperty({
    example: '2026-12-31T23:59:59.000Z',
    description: 'Optional expiry date for the voucher as an ISO date string.',
    required: false
  })
  @IsOptional()
  @IsString()
  expiresAt?: string;
}
