import { Controller, Get, Post, Body, Param, Query, UseGuards } from '@nestjs/common';
import { LoyaltyService } from './loyalty.service';

// Simple DTOs inline (no separate files needed)
class RedeemPointsDto {
  userId: string;
  businessId: string;
  points: number;
}

class EarnPointsDto {
  userId: string;
  businessId: string;
  orderId: string;
  orderAmount: number;
}

class ValidateVoucherDto {
  code: string;
  userId: string;
}

@Controller('loyalty')
export class LoyaltyController {
  constructor(private readonly loyaltyService: LoyaltyService) {}

  // ── Customer endpoints ──────────────────────────────────────

  @Get('ledger/:userId')
  getLedger(@Param('userId') userId: string, @Query('businessId') businessId: string) {
    return this.loyaltyService.getLedger(userId, businessId);
  }

  @Get('transactions/:userId')
  getTransactions(@Param('userId') userId: string, @Query('businessId') businessId: string) {
    return this.loyaltyService.getTransactions(userId, businessId);
  }

  @Get('vouchers/:userId')
  getVouchers(@Param('userId') userId: string, @Query('businessId') businessId: string) {
    return this.loyaltyService.getVouchers(userId, businessId);
  }

  @Post('earn')
  earnPoints(@Body() dto: EarnPointsDto) {
    return this.loyaltyService.earnPoints(dto.userId, dto.businessId, dto.orderId, dto.orderAmount);
  }

  @Post('redeem')
  redeemPoints(@Body() dto: RedeemPointsDto) {
    return this.loyaltyService.redeemPoints(dto.userId, dto.businessId, dto.points);
  }

  @Post('voucher/validate')
  validateVoucher(@Body() dto: ValidateVoucherDto) {
    return this.loyaltyService.validateVoucher(dto.code, dto.userId);
  }

  // ── Admin endpoints ─────────────────────────────────────────

  @Get('admin/insights')
  getCustomerInsights(@Query('businessId') businessId: string) {
    return this.loyaltyService.getCustomerInsights(businessId);
  }

  @Get('admin/summary')
  getBusinessSummary(@Query('businessId') businessId: string) {
    return this.loyaltyService.getBusinessLoyaltySummary(businessId);
  }

  @Get('admin/config')
  getConfig(@Query('businessId') businessId: string) {
    return this.loyaltyService.getOrCreateConfig(businessId);
  }

  @Post('admin/config')
  updateConfig(
    @Query('businessId') businessId: string,
    @Body() dto: { pointsPerNpr?: number; pointsToNprRate?: number; minRedeemPoints?: number; voucherExpiryDays?: number }
  ) {
    return this.loyaltyService.updateConfig(businessId, dto);
  }
}
