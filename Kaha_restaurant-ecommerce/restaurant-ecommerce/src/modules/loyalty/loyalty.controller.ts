import { Controller, Get, Post, Body, Param, Query, UseGuards, ParseIntPipe, DefaultValuePipe, UsePipes, ValidationPipe } from '@nestjs/common';
import { JwtAuthGuard } from 'auth/guards';
import { RolesGuard } from 'auth/guards/roles.guard';
import { Roles } from 'common/decorator';
import { UserRoleEnum } from 'common/enums';
import { ApiBearerAuth } from '@nestjs/swagger';
import { LoyaltyService } from './loyalty.service';
import { CreateVoucherDto } from './dto/create-voucher.dto';
import { calculateDiscount } from './voucher-calculator';
import { UpdateLoyaltyConfigDto } from './dto/update-loyalty-config.dto';
import { LoyaltyExpiryService } from './loyalty-expiry.service';

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
  cartTotal?: number;
}

@Controller('loyalty')
export class LoyaltyController {
  constructor(
    private readonly loyaltyService: LoyaltyService,
    private readonly loyaltyExpiryService: LoyaltyExpiryService,
  ) {}

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
  async validateVoucher(@Body() dto: ValidateVoucherDto) {
    let voucher;
    if (dto.cartTotal !== undefined && dto.cartTotal !== null) {
      voucher = await this.loyaltyService.validateVoucherForCart(dto.code, dto.userId, dto.cartTotal);
    } else {
      voucher = await this.loyaltyService.validateVoucher(dto.code, dto.userId);
    }

    const calculatedDiscount = calculateDiscount(
      voucher.discountType,
      voucher.discountValue,
      dto.cartTotal || 0,
      voucher.maxDiscountAmount
    );

    return {
      voucher,
      calculatedDiscount,
    };
  }

  // ── Admin endpoints ─────────────────────────────────────────

  @Post('admin/voucher')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRoleEnum.BUSINESS_SUPER_ADMIN, UserRoleEnum.ADMIN, UserRoleEnum.SUPER_ADMIN)
  createVoucher(@Body() dto: CreateVoucherDto) {
    return this.loyaltyService.createVoucher(dto);
  }

  @Get('admin/vouchers')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRoleEnum.BUSINESS_SUPER_ADMIN, UserRoleEnum.ADMIN, UserRoleEnum.SUPER_ADMIN)
  getAllVouchers(
    @Query('businessId') businessId?: string,
    @Query('status') status?: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page?: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit?: number
  ) {
    return this.loyaltyService.getAllVouchers(businessId, status, page, limit);
  }

  @Get('admin/insights')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRoleEnum.BUSINESS_SUPER_ADMIN, UserRoleEnum.ADMIN, UserRoleEnum.SUPER_ADMIN)
  getCustomerInsights(@Query('businessId') businessId: string) {
    return this.loyaltyService.getCustomerInsights(businessId);
  }

  @Get('admin/summary')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRoleEnum.BUSINESS_SUPER_ADMIN, UserRoleEnum.ADMIN, UserRoleEnum.SUPER_ADMIN)
  getBusinessSummary(@Query('businessId') businessId: string) {
    return this.loyaltyService.getBusinessLoyaltySummary(businessId);
  }

  @Get('admin/config')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRoleEnum.BUSINESS_SUPER_ADMIN, UserRoleEnum.ADMIN, UserRoleEnum.SUPER_ADMIN)
  getConfig(@Query('businessId') businessId: string) {
    return this.loyaltyService.getOrCreateConfig(businessId);
  }

  @Post('admin/config')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRoleEnum.BUSINESS_SUPER_ADMIN, UserRoleEnum.ADMIN, UserRoleEnum.SUPER_ADMIN)
  @UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }))
  updateConfig(
    @Query('businessId') businessId: string,
    @Body() dto: UpdateLoyaltyConfigDto,
  ) {
    return this.loyaltyService.updateConfig(businessId, dto as any);
  }

  // ── Admin: manual expiry trigger (for testing) ──────────────
  @Post('admin/run-expiry')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRoleEnum.ADMIN, UserRoleEnum.SUPER_ADMIN)
  runExpiry() {
    return this.loyaltyExpiryService.runExpiryNow();
  }
}
