import { Controller, Get, Post, Patch, Body, Param, Query, UseGuards, ParseIntPipe, DefaultValuePipe, UsePipes, ValidationPipe, Req } from '@nestjs/common';
import { JwtAuthGuard } from 'auth/guards';
import { RolesGuard } from 'auth/guards/roles.guard';
import { Roles } from 'common/decorator';
import { UserRoleEnum } from 'common/enums';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { LoyaltyService } from './loyalty.service';
import { CreateVoucherDto } from './dto/create-voucher.dto';
import { calculateDiscount } from './voucher-calculator';
import { UpdateLoyaltyConfigDto } from './dto/update-loyalty-config.dto';
import { LoyaltyExpiryService } from './loyalty-expiry.service';
import { CreateCampaignDto } from './dto/create-campaign.dto';
import { UpdateCampaignDto } from './dto/update-campaign.dto';
import { AdminAwardVoucherDto } from './dto/admin-award-voucher.dto';
import { VoucherEntity } from '../../entities/voucher.entity';

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
  businessId?: string;
  serviceType?: string;
}

@ApiTags('Loyalty')
@Controller('loyalty')
export class LoyaltyController {
  constructor(
    private readonly loyaltyService: LoyaltyService,
    private readonly loyaltyExpiryService: LoyaltyExpiryService,
  ) {}

  // ── Customer endpoints ──────────────────────────────────────

  @Get('points')
  @UseGuards(JwtAuthGuard)
  getMyPoints(@Req() req: any, @Query('businessId') businessId: string) {
    const userId = req.user.id;
    const resolvedBusinessId = businessId || '7476ee15-1407-41fa-9a49-89e0caaf945d';
    return this.loyaltyService.getLedger(userId, resolvedBusinessId);
  }

  @Get('my-vouchers')
  @UseGuards(JwtAuthGuard)
  getMyVouchers(@Req() req: any, @Query('businessId') businessId: string) {
    const userId = req.user.id;
    const resolvedBusinessId = businessId || '7476ee15-1407-41fa-9a49-89e0caaf945d';
    return this.loyaltyService.getVouchers(userId, resolvedBusinessId);
  }

  @Get('my-transactions')
  @UseGuards(JwtAuthGuard)
  getMyTransactions(@Req() req: any, @Query('businessId') businessId: string) {
    const userId = req.user.id;
    const resolvedBusinessId = businessId || '7476ee15-1407-41fa-9a49-89e0caaf945d';
    return this.loyaltyService.getTransactions(userId, resolvedBusinessId);
  }

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
    let voucher: VoucherEntity;
    let discountAmount: number;

    if (dto.businessId && dto.serviceType !== undefined) {
      // Full eligibility check — same path as actual checkout
      const result = await this.loyaltyService
        .validateVoucherForCheckout(
          dto.code,
          dto.userId,
          dto.businessId,
          dto.cartTotal ?? 0,
          dto.serviceType,
          [], // cartItems empty for preview — category/item
              // scope check skipped, acceptable for preview
        );
      voucher = result.voucher;
      discountAmount = result.discountAmount;
    } else {
      // Legacy path — basic checks only
      voucher = await this.loyaltyService.validateVoucherForCart(
        dto.code,
        dto.userId,
        dto.cartTotal ?? 0,
      );
      discountAmount = calculateDiscount(
        voucher.discountType,
        Number(voucher.discountValue),
        dto.cartTotal ?? 0,
        voucher.maxDiscountAmount
          ? Number(voucher.maxDiscountAmount)
          : undefined,
      );
    }

    return { voucher, calculatedDiscount: discountAmount };
  }

  // ── Admin: legacy voucher endpoints ─────────────────────────

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

  // ── Admin: Campaign CRUD ─────────────────────────────────────

  @Post('admin/campaigns')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRoleEnum.BUSINESS_SUPER_ADMIN, UserRoleEnum.ADMIN, UserRoleEnum.SUPER_ADMIN)
  @UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
  @ApiOperation({ summary: 'Create a new campaign (starts as DRAFT)' })
  createCampaign(@Body() dto: CreateCampaignDto) {
    return this.loyaltyService.createCampaign(dto);
  }

  @Get('admin/campaigns')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRoleEnum.BUSINESS_SUPER_ADMIN, UserRoleEnum.ADMIN, UserRoleEnum.SUPER_ADMIN)
  @ApiOperation({ summary: 'List campaigns (optionally filtered by businessId)' })
  getCampaigns(@Query('businessId') businessId?: string) {
    return this.loyaltyService.getCampaigns(businessId);
  }

  @Get('admin/campaigns/:id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRoleEnum.BUSINESS_SUPER_ADMIN, UserRoleEnum.ADMIN, UserRoleEnum.SUPER_ADMIN)
  @ApiOperation({ summary: 'Get a single campaign by ID' })
  getCampaignById(@Param('id') id: string) {
    return this.loyaltyService.getCampaignById(id);
  }

  @Patch('admin/campaigns/:id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRoleEnum.BUSINESS_SUPER_ADMIN, UserRoleEnum.ADMIN, UserRoleEnum.SUPER_ADMIN)
  @UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
  @ApiOperation({ summary: 'Update campaign fields' })
  updateCampaign(@Param('id') id: string, @Body() dto: UpdateCampaignDto) {
    return this.loyaltyService.updateCampaign(id, dto);
  }

  @Post('admin/campaigns/:id/activate')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRoleEnum.BUSINESS_SUPER_ADMIN, UserRoleEnum.ADMIN, UserRoleEnum.SUPER_ADMIN)
  @ApiOperation({ summary: 'Activate a DRAFT campaign' })
  activateCampaign(@Param('id') id: string) {
    return this.loyaltyService.activateCampaign(id);
  }

  @Post('admin/campaigns/:id/pause')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRoleEnum.BUSINESS_SUPER_ADMIN, UserRoleEnum.ADMIN, UserRoleEnum.SUPER_ADMIN)
  @ApiOperation({ summary: 'Pause an ACTIVE campaign' })
  pauseCampaign(@Param('id') id: string) {
    return this.loyaltyService.pauseCampaign(id);
  }

  @Post('admin/campaigns/:id/resume')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRoleEnum.BUSINESS_SUPER_ADMIN, UserRoleEnum.ADMIN, UserRoleEnum.SUPER_ADMIN)
  @ApiOperation({ summary: 'Resume a PAUSED campaign' })
  resumeCampaign(@Param('id') id: string) {
    return this.loyaltyService.resumeCampaign(id);
  }

  @Post('admin/campaigns/:id/archive')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRoleEnum.BUSINESS_SUPER_ADMIN, UserRoleEnum.ADMIN, UserRoleEnum.SUPER_ADMIN)
  @ApiOperation({ summary: 'Archive a campaign (irreversible)' })
  archiveCampaign(@Param('id') id: string) {
    return this.loyaltyService.archiveCampaign(id);
  }

  // ── Admin: Award voucher to customer ──────────────────────────

class AdminAwardMassVoucherDto {
  campaignId: string;
  businessId: string;
  criteria: 'all' | 'min_orders' | 'min_spent';
  minOrders?: number;
  minSpent?: number;
  expiresAt?: string;
}

  @Post('admin/vouchers/award-mass')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRoleEnum.BUSINESS_SUPER_ADMIN, UserRoleEnum.ADMIN, UserRoleEnum.SUPER_ADMIN)
  @ApiOperation({ summary: 'Award campaign vouchers to users in mass based on criteria' })
  awardVoucherToMassUsers(@Body() dto: AdminAwardMassVoucherDto) {
    return this.loyaltyService.awardVoucherToMassUsers(dto);
  }

  @Post('admin/vouchers/award')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRoleEnum.BUSINESS_SUPER_ADMIN, UserRoleEnum.ADMIN, UserRoleEnum.SUPER_ADMIN)
  @UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
  @ApiOperation({ summary: 'Award a campaign voucher to a specific customer' })
  awardVoucherToCustomer(@Body() dto: AdminAwardVoucherDto) {
    return this.loyaltyService.awardVoucherToCustomer(dto);
  }

  @Get('admin/campaigns/:id/redemptions')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRoleEnum.BUSINESS_SUPER_ADMIN, UserRoleEnum.ADMIN, UserRoleEnum.SUPER_ADMIN)
  @ApiOperation({ summary: 'Get campaign redemption logs' })
  async getCampaignRedemptions(
    @Param('id') id: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.loyaltyService.getCampaignRedemptions(
      id,
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 20,
    );
  }
}
