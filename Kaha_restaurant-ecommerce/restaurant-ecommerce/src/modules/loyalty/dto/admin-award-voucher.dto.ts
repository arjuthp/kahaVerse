import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsDateString } from 'class-validator';

export class AdminAwardVoucherDto {
  @ApiProperty({ description: 'Target customer user ID', example: 'user-uuid-here' })
  @IsNotEmpty()
  @IsString()
  userId: string;

  @ApiProperty({ description: 'Restaurant/business context ID', example: 'biz-uuid-here' })
  @IsNotEmpty()
  @IsString()
  businessId: string;

  @ApiProperty({ description: 'Campaign to issue the voucher from', example: 'campaign-uuid-here' })
  @IsNotEmpty()
  @IsString()
  campaignId: string;

  @ApiPropertyOptional({
    description: 'Optional per-instance expiry override (ISO date string)',
    example: '2026-12-31T23:59:59.000Z',
  })
  @IsOptional()
  @IsDateString()
  expiresAt?: string;
}
