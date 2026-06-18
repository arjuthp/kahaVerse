import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, In, EntityManager, MoreThanOrEqual, Not } from 'typeorm';
import { LoyaltyPointsEntity } from '../../entities/loyalty-points.entity';
import { LoyaltyTransactionEntity, LoyaltyTxType } from '../../entities/loyalty-transaction.entity';
import { VoucherEntity, VoucherStatus } from '../../entities/voucher.entity';
import { LoyaltyConfigEntity, AccrualMode } from '../../entities/loyalty-config.entity';
import { User } from '../../entities/user.entity';
import { calculateDiscount } from './voucher-calculator';
import { CreateVoucherDto } from './dto/create-voucher.dto';
import { VoucherCampaignStatus, VoucherDiscountClass } from '../../entities/voucher.enums';
import { VoucherCampaignEntity } from '../../entities/voucher-campaign.entity';
import { VoucherRedemptionLogEntity, VoucherRedemptionResult } from '../../entities/voucher-redemption-log.entity';
import { OrderRepository } from 'src/repositories';
import { OrderStatusEnum } from 'src/common/enums';
import { CreateCampaignDto } from './dto/create-campaign.dto';
import { UpdateCampaignDto } from './dto/update-campaign.dto';
import { AdminAwardVoucherDto } from './dto/admin-award-voucher.dto';

@Injectable()
export class LoyaltyService {
  constructor(
    @InjectRepository(LoyaltyPointsEntity)
    private readonly loyaltyRepo: Repository<LoyaltyPointsEntity>,
    @InjectRepository(LoyaltyTransactionEntity)
    private readonly txRepo: Repository<LoyaltyTransactionEntity>,
    @InjectRepository(VoucherEntity)
    private readonly voucherRepo: Repository<VoucherEntity>,
    @InjectRepository(LoyaltyConfigEntity)
    private readonly configRepo: Repository<LoyaltyConfigEntity>,
    @InjectRepository(VoucherRedemptionLogEntity)
    private readonly redemptionLogRepo: Repository<VoucherRedemptionLogEntity>,
    @InjectRepository(VoucherCampaignEntity)
    private readonly campaignRepo: Repository<VoucherCampaignEntity>,
    private readonly orderRepository: OrderRepository,
    private readonly dataSource: DataSource,
  ) {}

  // ──────────────────────────────────────────────────────────────
  //  CONFIG MANAGEMENT
  // ──────────────────────────────────────────────────────────────
  async getOrCreateConfig(businessId: string): Promise<LoyaltyConfigEntity> {
    let config = await this.configRepo.findOne({ where: { businessId } });
    if (!config) {
      config = this.configRepo.create({
        businessId,
        pointsPerNpr: 0.1,
        pointsToNprRate: 0.5,
        minRedeemPoints: 100,
        voucherExpiryDays: 30,
        accrualMode: AccrualMode.SPEND,
        pointsPerVisit: 5,
        minSpendForVisit: 0,
        bonusMultiplier: 1.0,
        pointsExpiryDays: null,
      });
      await this.configRepo.save(config);
    }
    return config;
  }

  async updateConfig(businessId: string, update: Partial<LoyaltyConfigEntity>): Promise<LoyaltyConfigEntity> {
    const config = await this.getOrCreateConfig(businessId);
    if (update.pointsPerNpr !== undefined)      config.pointsPerNpr      = Number(update.pointsPerNpr);
    if (update.pointsToNprRate !== undefined)   config.pointsToNprRate   = Number(update.pointsToNprRate);
    if (update.minRedeemPoints !== undefined)   config.minRedeemPoints   = Number(update.minRedeemPoints);
    if (update.voucherExpiryDays !== undefined) config.voucherExpiryDays = Number(update.voucherExpiryDays);
    if (update.accrualMode !== undefined)       config.accrualMode       = update.accrualMode;
    if (update.pointsPerVisit !== undefined)    config.pointsPerVisit    = Number(update.pointsPerVisit);
    if (update.minSpendForVisit !== undefined)  config.minSpendForVisit  = Number(update.minSpendForVisit);
    if (update.bonusMultiplier !== undefined)   config.bonusMultiplier   = Number(update.bonusMultiplier);
    if (update.pointsExpiryDays !== undefined)  config.pointsExpiryDays  =
      update.pointsExpiryDays === null ? null : Number(update.pointsExpiryDays);
    return this.configRepo.save(config);
  }

  // ──────────────────────────────────────────────────────────────
  //  EARN POINTS (called when an order is completed/delivered)
  // ──────────────────────────────────────────────────────────────
  async earnPoints(
    userId: string,
    businessId: string,
    orderId: string,
    orderAmount: number,
    subtotal?: number,
  ): Promise<LoyaltyPointsEntity> {
    const config = await this.getOrCreateConfig(businessId);
    const baseAmount = subtotal ?? orderAmount;
    const multiplier = Number(config.bonusMultiplier) || 1;

    // Duplicate order guard — reject if this orderId already has an EARN transaction
    const existing = await this.txRepo.findOne({
      where: { orderId, type: LoyaltyTxType.EARN },
    });
    if (existing) {
      throw new ConflictException(`Points already earned for order ${orderId}`);
    }

    let spendPoints = 0;
    let visitPoints = 0;

    if (config.accrualMode === AccrualMode.SPEND || config.accrualMode === AccrualMode.BOTH) {
      spendPoints = Math.floor(Number(orderAmount) * Number(config.pointsPerNpr));
    }

    if (config.accrualMode === AccrualMode.VISIT || config.accrualMode === AccrualMode.BOTH) {
      const qualifies = Number(baseAmount) >= Number(config.minSpendForVisit);
      if (qualifies) {
        // Once per day per customer rule for visit-based points
        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);

        const hasEarnedToday = await this.txRepo
          .createQueryBuilder("tx")
          .where("tx.userId = :userId", { userId })
          .andWhere("tx.businessId = :businessId", { businessId })
          .andWhere("tx.type = :type", { type: LoyaltyTxType.EARN })
          .andWhere("tx.createdAt >= :startOfDay", { startOfDay })
          .getOne();

        if (!hasEarnedToday) {
          visitPoints = Number(config.pointsPerVisit);
        }
      }
    }

    const basePoints = spendPoints + visitPoints;
    const pointsEarned = Math.floor(basePoints * multiplier);

    if (pointsEarned <= 0) return this.getOrCreateLedger(userId, businessId);

    return this.dataSource.transaction(async (em) => {
      let ledger = await em.findOne(LoyaltyPointsEntity, { where: { userId, businessId } });
      if (!ledger) {
        ledger = em.create(LoyaltyPointsEntity, { userId, businessId, totalPoints: 0, lifetimePointsEarned: 0, lifetimePointsRedeemed: 0, totalOrders: 0, totalSpent: 0 });
      }

      ledger.totalPoints += pointsEarned;
      ledger.lifetimePointsEarned += pointsEarned;
      ledger.totalOrders += 1;
      ledger.totalSpent = Number(ledger.totalSpent) + orderAmount;

      await em.save(LoyaltyPointsEntity, ledger);

      const tx = em.create(LoyaltyTransactionEntity, {
        userId,
        businessId,
        orderId,
        type: LoyaltyTxType.EARN,
        points: pointsEarned,
        balanceAfter: ledger.totalPoints,
        description: `Earned ${pointsEarned} pts (${config.accrualMode}) from Order #${orderId.slice(-6).toUpperCase()}`,
      });
      await em.save(LoyaltyTransactionEntity, tx);

      return ledger;
    });
  }

  // ──────────────────────────────────────────────────────────────
  //  REDEEM POINTS → GENERATE VOUCHER
  // ──────────────────────────────────────────────────────────────
  async redeemPoints(userId: string, businessId: string, pointsToRedeem: number): Promise<VoucherEntity> {
    const config = await this.getOrCreateConfig(businessId);
    const minRedeem = Number(config.minRedeemPoints);
    
    if (pointsToRedeem < minRedeem) {
      throw new BadRequestException(`Minimum redemption is ${minRedeem} points`);
    }
    if (pointsToRedeem % minRedeem !== 0) {
      throw new BadRequestException(`Redeem in multiples of ${minRedeem} points`);
    }

    const ledger = await this.loyaltyRepo.findOne({ where: { userId, businessId } });
    if (!ledger || ledger.totalPoints < pointsToRedeem) {
      throw new BadRequestException('Insufficient loyalty points');
    }

    return this.dataSource.transaction(async (em) => {
      const discountAmount = pointsToRedeem * Number(config.pointsToNprRate);
      const code = `KAHA-${Math.random().toString(36).toUpperCase().slice(2, 7)}`;

      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + Number(config.voucherExpiryDays));

      const voucher = em.create(VoucherEntity, {
        userId,
        businessId,
        code,
        discountAmount,
        pointsUsed: pointsToRedeem,
        status: VoucherStatus.ACTIVE,
        expiresAt,
      });
      await em.save(VoucherEntity, voucher);

      ledger.totalPoints -= pointsToRedeem;
      ledger.lifetimePointsRedeemed += pointsToRedeem;
      await em.save(LoyaltyPointsEntity, ledger);

      const tx = em.create(LoyaltyTransactionEntity, {
        userId,
        businessId,
        type: LoyaltyTxType.REDEEM,
        points: -pointsToRedeem,
        balanceAfter: ledger.totalPoints,
        description: `Redeemed ${pointsToRedeem} pts → Voucher ${code} (NPR ${discountAmount})`,
      });
      await em.save(LoyaltyTransactionEntity, tx);

      return voucher;
    });
  }

  // ──────────────────────────────────────────────────────────────
  //  VALIDATE VOUCHER (at checkout)
  // ──────────────────────────────────────────────────────────────
  async validateVoucher(code: string, userId: string, businessId?: string): Promise<VoucherEntity> {
    const voucher = await this.voucherRepo.findOne({
      where: { code },
      relations: ['campaign'],
    });
    if (!voucher) throw new NotFoundException('Voucher not found');
    if (voucher.userId !== userId) throw new BadRequestException('Voucher does not belong to this customer');
    if (voucher.status !== VoucherStatus.ACTIVE) throw new BadRequestException(`Voucher is ${voucher.status}`);
    
    // Precedence rule for expiration: voucher.expiresAt (if set) wins; campaign.expiresAt is fallback
    if (voucher.expiresAt) {
      if (new Date() > voucher.expiresAt) {
        throw new BadRequestException('Voucher has expired');
      }
    } else if (voucher.campaignId && voucher.campaign?.expiresAt) {
      if (new Date() > voucher.campaign.expiresAt) {
        throw new BadRequestException('CAMPAIGN_EXPIRED');
      }
    }

    // Campaign-specific active and start time checks
    if (voucher.campaignId && voucher.campaign) {
      if (voucher.campaign.status !== VoucherCampaignStatus.ACTIVE) {
        throw new BadRequestException('CAMPAIGN_NOT_ACTIVE');
      }
      if (voucher.campaign.startsAt && new Date() < voucher.campaign.startsAt) {
        throw new BadRequestException('CAMPAIGN_NOT_ACTIVE');
      }
    }

    if (!voucher.isActive) throw new BadRequestException('Voucher is inactive');
    if (businessId && voucher.businessId !== businessId) {
      throw new BadRequestException('Voucher is not valid for this restaurant');
    }
    if (voucher.maxUses !== null && voucher.maxUses !== undefined && voucher.usageCount >= voucher.maxUses) {
      throw new BadRequestException('Voucher usage limit reached');
    }
    return voucher;
  }

  async validateVoucherForCart(code: string, userId: string, cartTotal: number, businessId?: string): Promise<VoucherEntity> {
    const voucher = await this.validateVoucher(code, userId, businessId);
    
    // Precedence rule: voucher.minOrderAmount (if set) wins; campaign.minOrderAmount is fallback
    const minOrder = voucher.minOrderAmount !== null && voucher.minOrderAmount !== undefined
      ? Number(voucher.minOrderAmount)
      : (voucher.campaignId && voucher.campaign?.minOrderAmount !== null && voucher.campaign?.minOrderAmount !== undefined
        ? Number(voucher.campaign.minOrderAmount)
        : null);

    if (minOrder !== null && cartTotal < minOrder) {
      throw new BadRequestException(
        `Minimum order amount of NPR ${minOrder} required`
      );
    }
    return voucher;
  }

  async validateVoucherForCheckout(
    code: string,
    userId: string,
    businessId: string,
    subtotal: number,
    serviceType: string,
    cartItems: Array<{ menuItemId: string; categoryId: string }> = [],
  ): Promise<{ voucher: VoucherEntity; discountAmount: number }> {
    try {
      const voucher = await this.validateVoucherForCart(code, userId, subtotal, businessId);

      const discountAmount = calculateDiscount(
        voucher.discountType,
        Number(voucher.discountValue),
        subtotal,
        voucher.maxDiscountAmount ? Number(voucher.maxDiscountAmount) : undefined,
      );

      // step 4: applicableServiceTypes check (spec §4 step 4)
      const applicableServices = voucher.applicableServiceTypes && voucher.applicableServiceTypes.length > 0
        ? voucher.applicableServiceTypes
        : (voucher.campaignId && voucher.campaign?.applicableServiceTypes && voucher.campaign.applicableServiceTypes.length > 0
          ? voucher.campaign.applicableServiceTypes
          : null);

      if (applicableServices && (!serviceType || !applicableServices.includes(serviceType))) {
        throw new BadRequestException('SERVICE_TYPE_NOT_ELIGIBLE');
      }

      // Step 6: Extend step 12 (redemption limits) for campaigns
      if (voucher.campaignId && voucher.campaign) {
        const campaign = voucher.campaign;

        // step 5: First-order check (spec §4 step 5)
        if (campaign.requiresFirstOrder === true) {
          const priorOrders = await this.orderRepository.find({
            where: { userId, businessId },
            relations: { orderStatus: true },
          });
          const priorOrderCount = priorOrders.filter(order => {
            const sortedStatus = order.orderStatus?.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
            const latestStatus = sortedStatus?.[0]?.status;
            return latestStatus !== OrderStatusEnum.CANCELLED;
          }).length;

          if (priorOrderCount > 0) {
            throw new BadRequestException('FIRST_ORDER_ONLY');
          }
        }

        // step 6: Day-of-week / time-of-day restrictions (spec §4 step 6)
        if (campaign.validDaysOfWeek && campaign.validDaysOfWeek.length > 0) {
          const todayDow = new Date().getDay(); // 0=Sun, 1=Mon ... 6=Sat
          if (!campaign.validDaysOfWeek.includes(todayDow)) {
            throw new BadRequestException('NOT_VALID_TODAY');
          }
        }

        if (campaign.validTimeStart && campaign.validTimeEnd) {
          const now = new Date();
          const currentMinutes = now.getHours() * 60 + now.getMinutes();
          const [startH, startM] = campaign.validTimeStart.split(':').map(Number);
          const [endH, endM] = campaign.validTimeEnd.split(':').map(Number);
          const startMinutes = startH * 60 + startM;
          const endMinutes = endH * 60 + endM;
          if (currentMinutes < startMinutes || currentMinutes > endMinutes) {
            throw new BadRequestException('NOT_VALID_AT_THIS_TIME');
          }
        }

        // step 7: Category/item scope (spec §4 step 7)
        if (campaign.applicableCategoryIds && campaign.applicableCategoryIds.length > 0) {
          const hasEligibleCategory = cartItems.some(item =>
            campaign.applicableCategoryIds.includes(item.categoryId)
          );
          if (!hasEligibleCategory) {
            throw new BadRequestException('CATEGORY_NOT_ELIGIBLE');
          }
        }

        if (campaign.applicableMenuItemIds && campaign.applicableMenuItemIds.length > 0) {
          const hasEligibleItem = cartItems.some(item =>
            campaign.applicableMenuItemIds.includes(item.menuItemId)
          );
          if (!hasEligibleItem) {
            throw new BadRequestException('ITEM_NOT_ELIGIBLE');
          }
        }

        // a) maxRedemptionsTotal
        if (campaign.maxRedemptionsTotal !== null && campaign.maxRedemptionsTotal !== undefined) {
          const totalRedemptions = await this.redemptionLogRepo.count({
            where: {
              campaignId: campaign.id,
              result: VoucherRedemptionResult.SUCCESS,
            },
          });
          if (totalRedemptions >= campaign.maxRedemptionsTotal) {
            throw new BadRequestException('CAMPAIGN_REDEMPTION_LIMIT_REACHED');
          }
        }

        // b) maxRedemptionsPerUser
        if (campaign.maxRedemptionsPerUser !== null && campaign.maxRedemptionsPerUser !== undefined) {
          const userRedemptions = await this.redemptionLogRepo.count({
            where: {
              campaignId: campaign.id,
              userId,
              result: VoucherRedemptionResult.SUCCESS,
            },
          });
          if (userRedemptions >= campaign.maxRedemptionsPerUser) {
            throw new BadRequestException('USER_REDEMPTION_LIMIT_REACHED');
          }
        }

        // c) maxRedemptionsPerUserPerDay
        if (campaign.maxRedemptionsPerUserPerDay !== null && campaign.maxRedemptionsPerUserPerDay !== undefined) {
          const startOfToday = new Date();
          startOfToday.setHours(0, 0, 0, 0);

          const userDailyRedemptions = await this.redemptionLogRepo.count({
            where: {
              campaignId: campaign.id,
              userId,
              result: VoucherRedemptionResult.SUCCESS,
              createdAt: MoreThanOrEqual(startOfToday),
            },
          });
          if (userDailyRedemptions >= campaign.maxRedemptionsPerUserPerDay) {
            throw new BadRequestException('DAILY_REDEMPTION_LIMIT_REACHED');
          }
        }

        // Step 7: totalBudgetCap check (campaign level)
        if (campaign.totalBudgetCap !== null && campaign.totalBudgetCap !== undefined) {
          if (Number(campaign.totalRedeemedAmount) + discountAmount > Number(campaign.totalBudgetCap)) {
            throw new BadRequestException('CAMPAIGN_BUDGET_EXCEEDED');
          }
        }
      }

      return { voucher, discountAmount };
    } catch (err) {
      try {
        const voucher = await this.voucherRepo.findOne({
          where: { code },
          relations: ['campaign'],
        }).catch(() => null);

        await this.redemptionLogRepo.save({
          voucherId: voucher?.id ?? null,
          campaignId: voucher?.campaignId ?? null,
          userId,
          businessId,
          orderId: null,
          attemptedCode: code,
          result: VoucherRedemptionResult.REJECTED,
          discountAmountApplied: 0,
          rejectionReason: err?.message ?? 'UNKNOWN',
        });
      } catch (_logErr) {
        // swallow — logging must not mask the real error
      }
      throw err;
    }
  }

  async redeemVoucher(
    voucherId: string,
    orderId: string,
    voucher: VoucherEntity,
    discountAmount: number,
    manager?: EntityManager,
  ): Promise<void> {
    const repo = manager ? manager.getRepository(VoucherEntity) : this.voucherRepo;
    const logRepo = manager ? manager.getRepository(VoucherRedemptionLogEntity) : this.redemptionLogRepo;
    const campaignRepo = manager ? manager.getRepository(VoucherCampaignEntity) : this.dataSource.getRepository(VoucherCampaignEntity);

    const qb = repo.createQueryBuilder('voucher')
      .update(VoucherEntity)
      .set({
        status: () => `CASE WHEN "maxUses" IS NOT NULL AND "usageCount" + 1 >= "maxUses" THEN '${VoucherStatus.USED}'::vouchers_status_enum ELSE '${VoucherStatus.ACTIVE}'::vouchers_status_enum END`,
        usedOnOrderId: orderId,
        usageCount: () => '"usageCount" + 1',
      })
      .where('id = :voucherId', { voucherId })
      .andWhere('status = :status', { status: VoucherStatus.ACTIVE })
      .andWhere('("maxUses" IS NULL OR "usageCount" < "maxUses")');

    const result = await qb.execute();
    if (result.affected === 0) {
      throw new BadRequestException('Voucher could not be redeemed or is already used');
    }

    // Write SUCCESS log row
    await logRepo.save({
      voucherId,
      campaignId: voucher.campaignId ?? null,
      userId: voucher.userId,
      businessId: voucher.businessId,
      orderId,
      attemptedCode: voucher.code,
      result: VoucherRedemptionResult.SUCCESS,
      discountAmountApplied: discountAmount,
      rejectionReason: null,
    });

    // Update campaign budget if applicable
    if (voucher.campaignId) {
      await campaignRepo.increment(
        { id: voucher.campaignId },
        'totalRedeemedAmount',
        discountAmount,
      );
    }
  }

  // ──────────────────────────────────────────────────────────────
  //  GET CUSTOMER LEDGER
  // ──────────────────────────────────────────────────────────────
  async getLedger(userId: string, businessId: string): Promise<LoyaltyPointsEntity & {
    pointsExpireAt: string | null;
    accrualMode: string;
    pointsPerNpr: number;
    pointsPerVisit: number;
    minSpendForVisit: number;
    bonusMultiplier: number;
    minRedeemPoints: number;
    pointsToNprRate: number;
  }> {
    const [ledger, config] = await Promise.all([
      this.getOrCreateLedger(userId, businessId),
      this.getOrCreateConfig(businessId),
    ]);

    let pointsExpireAt: string | null = null;

    if (config.pointsExpiryDays != null && ledger.totalPoints > 0) {
      const expireAt = new Date(ledger.updatedAt);
      expireAt.setDate(expireAt.getDate() + Number(config.pointsExpiryDays));
      pointsExpireAt = expireAt.toISOString();
    }

    return {
      ...ledger,
      pointsExpireAt,
      accrualMode: config.accrualMode,
      pointsPerNpr: Number(config.pointsPerNpr),
      pointsPerVisit: Number(config.pointsPerVisit),
      minSpendForVisit: Number(config.minSpendForVisit),
      bonusMultiplier: Number(config.bonusMultiplier),
      minRedeemPoints: Number(config.minRedeemPoints),
      pointsToNprRate: Number(config.pointsToNprRate),
    };
  }

  async getTransactions(userId: string, businessId: string): Promise<LoyaltyTransactionEntity[]> {
    return this.txRepo.find({ where: { userId, businessId }, order: { createdAt: 'DESC' }, take: 50 });
  }

  async getVouchers(userId: string, businessId: string): Promise<VoucherEntity[]> {
    return this.voucherRepo.find({ where: { userId, businessId }, order: { createdAt: 'DESC' } });
  }

  // ──────────────────────────────────────────────────────────────
  //  ADMIN: CUSTOMER ANALYTICS
  // ──────────────────────────────────────────────────────────────
  async getCustomerInsights(businessId: string): Promise<any[]> {
    const ledgers = await this.loyaltyRepo.find({ where: { businessId }, order: { totalOrders: 'DESC' } });
    
    const userIds = ledgers.map(l => l.userId).filter(Boolean);
    const usersMap = new Map<string, { fullName: string; email: string; phone: string }>();

    if (userIds.length > 0) {
      try {
        const userRepo = this.dataSource.getRepository(User);
        const users = await userRepo.find({
          where: { id: In(userIds) }
        });
        for (const u of users) {
          const fullName = `${u.firstName || ''} ${u.lastName || ''}`.trim() || 'Kaha Customer';
          usersMap.set(u.id, {
            fullName,
            email: u.email || '',
            phone: u.phone || '',
          });
        }
      } catch (err) {
        console.error('[LoyaltyService] failed to fetch local users info:', err);
      }
    }

    return ledgers.map((l) => {
      const u = usersMap.get(l.userId);
      return {
        userId: l.userId,
        customerName: u ? u.fullName : 'Kaha Customer',
        customerEmail: u ? u.email : '',
        customerPhone: u ? u.phone : '',
        totalPoints: l.totalPoints,
        lifetimePointsEarned: l.lifetimePointsEarned,
        lifetimePointsRedeemed: l.lifetimePointsRedeemed,
        totalOrders: l.totalOrders,
        totalSpent: l.totalSpent,
        tier: this.getTier(l.totalOrders, Number(l.totalSpent)),
        isReturning: l.totalOrders > 1,
        lastActivity: l.updatedAt,
      };
    });
  }

  async getBusinessLoyaltySummary(businessId: string) {
    const all = await this.loyaltyRepo.find({ where: { businessId } });
    const totalCustomers = all.length;
    const returningCustomers = all.filter(l => l.totalOrders > 1).length;
    const totalPointsIssued = all.reduce((s, l) => s + l.lifetimePointsEarned, 0);
    const totalVouchersIssued = await this.voucherRepo.count({ where: { businessId } });
    const totalRevenue = all.reduce((s, l) => s + Number(l.totalSpent), 0);

    return {
      totalCustomers,
      returningCustomers,
      newCustomers: totalCustomers - returningCustomers,
      totalPointsIssued,
      totalVouchersIssued,
      totalRevenue,
      retentionRate: totalCustomers > 0 ? ((returningCustomers / totalCustomers) * 100).toFixed(1) : '0',
    };
  }

  async createVoucher(dto: CreateVoucherDto): Promise<VoucherEntity> {
    let code = dto.code;
    if (!code) {
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
      let randomPart = '';
      for (let i = 0; i < 6; i++) {
        randomPart += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      code = `KAHA-${randomPart}`;
    } else {
      code = code.trim().toUpperCase();
    }

    const existing = await this.voucherRepo.findOne({ where: { code } });
    if (existing) {
      throw new ConflictException(`Voucher with code ${code} already exists`);
    }

    const expiresAt = dto.expiresAt ? new Date(dto.expiresAt) : null;

    const voucher = this.voucherRepo.create({
      userId: dto.userId,
      businessId: dto.businessId,
      code,
      discountAmount: dto.discountType === 'FIXED' ? dto.discountValue : 0,
      discountType: dto.discountType as any,
      discountValue: dto.discountValue,
      maxDiscountAmount: dto.maxDiscountAmount ?? null,
      minOrderAmount: dto.minOrderAmount ?? null,
      maxUses: dto.maxUses ?? null,
      maxUsesPerUser: dto.maxUsesPerUser ?? 1,
      pointsUsed: 0,
      status: VoucherStatus.ACTIVE,
      isActive: true,
      expiresAt,
    });

    return this.voucherRepo.save(voucher);
  }

  async getAllVouchers(
    businessId?: string,
    status?: string,
    page: number = 1,
    limit: number = 20
  ): Promise<{ data: VoucherEntity[]; total: number; page: number; limit: number }> {
    const where: any = {};
    if (businessId) {
      where.businessId = businessId;
    }
    if (status) {
      where.status = status;
    }

    const skip = (page - 1) * limit;

    const [data, total] = await this.voucherRepo.findAndCount({
      where,
      order: { createdAt: 'DESC' },
      skip,
      take: limit,
    });

    return {
      data,
      total,
      page,
      limit,
    };
  }

  // ──────────────────────────────────────────────────────────────
  //  HELPERS
  // ──────────────────────────────────────────────────────────────
  private async getOrCreateLedger(userId: string, businessId: string): Promise<LoyaltyPointsEntity> {
    let ledger = await this.loyaltyRepo.findOne({ where: { userId, businessId } });
    if (!ledger) {
      ledger = this.loyaltyRepo.create({ userId, businessId, totalPoints: 0, lifetimePointsEarned: 0, lifetimePointsRedeemed: 0, totalOrders: 0, totalSpent: 0 });
      await this.loyaltyRepo.save(ledger);
    }
    return ledger;
  }

  private getTier(orders: number, spent: number): string {
    if (orders >= 20 || spent >= 10000) return 'VIP 👑';
    if (orders >= 10 || spent >= 5000) return 'Gold ⭐';
    if (orders >= 5 || spent >= 2000) return 'Silver 🥈';
    if (orders >= 2) return 'Bronze 🥉';
    return 'New 🌱';
  }

  // ──────────────────────────────────────────────────────────────
  //  CAMPAIGN CRUD
  // ──────────────────────────────────────────────────────────────

  async createCampaign(dto: CreateCampaignDto): Promise<VoucherCampaignEntity> {
    const campaign = this.campaignRepo.create({
      ...dto,
      status: VoucherCampaignStatus.DRAFT,
      totalRedeemedAmount: 0,
      startsAt: dto.startsAt ? new Date(dto.startsAt) : null,
      expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : null,
    });
    return this.campaignRepo.save(campaign);
  }

  async getCampaigns(businessId?: string): Promise<VoucherCampaignEntity[]> {
    // Return platform-wide campaigns (businessId IS NULL) always;
    // also return business-specific campaigns if businessId provided.
    const qb = this.campaignRepo.createQueryBuilder('c');
    if (businessId) {
      qb.where('c.businessId = :businessId OR c.businessId IS NULL', { businessId });
    } else {
      qb.where('c.businessId IS NULL');
    }
    return qb.orderBy('c.createdAt', 'DESC').getMany();
  }

  async getCampaignById(id: string): Promise<VoucherCampaignEntity> {
    const campaign = await this.campaignRepo.findOne({ where: { id } });
    if (!campaign) throw new NotFoundException(`Campaign ${id} not found`);
    return campaign;
  }

  async updateCampaign(id: string, dto: UpdateCampaignDto): Promise<VoucherCampaignEntity> {
    const campaign = await this.getCampaignById(id);
    Object.assign(campaign, {
      ...dto,
      startsAt: dto.startsAt !== undefined ? new Date(dto.startsAt) : campaign.startsAt,
      expiresAt: dto.expiresAt !== undefined ? new Date(dto.expiresAt) : campaign.expiresAt,
    });
    return this.campaignRepo.save(campaign);
  }

  async activateCampaign(id: string): Promise<VoucherCampaignEntity> {
    const campaign = await this.getCampaignById(id);
    if (campaign.status !== VoucherCampaignStatus.DRAFT) {
      throw new BadRequestException(`Campaign must be DRAFT to activate (current: ${campaign.status})`);
    }
    campaign.status = VoucherCampaignStatus.ACTIVE;
    return this.campaignRepo.save(campaign);
  }

  async pauseCampaign(id: string): Promise<VoucherCampaignEntity> {
    const campaign = await this.getCampaignById(id);
    if (campaign.status !== VoucherCampaignStatus.ACTIVE) {
      throw new BadRequestException(`Campaign must be ACTIVE to pause (current: ${campaign.status})`);
    }
    campaign.status = VoucherCampaignStatus.PAUSED;
    return this.campaignRepo.save(campaign);
  }

  async resumeCampaign(id: string): Promise<VoucherCampaignEntity> {
    const campaign = await this.getCampaignById(id);
    if (campaign.status !== VoucherCampaignStatus.PAUSED) {
      throw new BadRequestException(`Campaign must be PAUSED to resume (current: ${campaign.status})`);
    }
    campaign.status = VoucherCampaignStatus.ACTIVE;
    return this.campaignRepo.save(campaign);
  }

  async archiveCampaign(id: string): Promise<VoucherCampaignEntity> {
    const campaign = await this.getCampaignById(id);
    if ((campaign.status as string) === 'archived') {
      throw new BadRequestException('Campaign is already archived');
    }
    (campaign as any).status = 'archived';
    return this.campaignRepo.save(campaign);
  }

  // ──────────────────────────────────────────────────────────────
  //  ADMIN AWARD VOUCHER
  // ──────────────────────────────────────────────────────────────

  async awardVoucherToCustomer(dto: AdminAwardVoucherDto): Promise<VoucherEntity> {
    const campaign = await this.getCampaignById(dto.campaignId);
    if (
      campaign.status !== VoucherCampaignStatus.ACTIVE &&
      (campaign.status as string) !== 'archived'
    ) {
      throw new BadRequestException(
        `Campaign must be ACTIVE to award vouchers (current: ${campaign.status})`,
      );
    }

    // Build a slug from campaign name: take first word, uppercase, strip non-alphanumeric
    const slug = campaign.name
      .split(/\s+/)[0]
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, '')
      .slice(0, 8);

    // Generate unique code with collision retry
    let code: string;
    let attempts = 0;
    do {
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
      let randomPart = '';
      for (let i = 0; i < 6; i++) {
        randomPart += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      code = `${slug}-${randomPart}`;
      const existing = await this.voucherRepo.findOne({ where: { code } });
      if (!existing) break;
      attempts++;
    } while (attempts < 10);

    const voucher = this.voucherRepo.create({
      campaignId: campaign.id,
      userId: dto.userId,
      businessId: dto.businessId,
      code,
      discountType: campaign.discountType,
      discountValue: campaign.discountValue,
      discountAmount: campaign.discountType === 'FIXED' ? Number(campaign.discountValue) : 0,
      discountClass: campaign.discountClass ?? VoucherDiscountClass.ORDER_TOTAL,
      maxDiscountAmount: campaign.maxDiscountAmount ?? null,
      minOrderAmount: campaign.minOrderAmount ?? null,
      applicableServiceTypes: campaign.applicableServiceTypes ?? null,
      expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : campaign.expiresAt ?? null,
      status: VoucherStatus.ACTIVE,
      isActive: true,
      pointsUsed: 0,
      maxUses: 1,
      usageCount: 0,
      maxUsesPerUser: 1,
    });

    return this.voucherRepo.save(voucher);
  }

  async getCampaignRedemptions(
    campaignId: string,
    page: number = 1,
    limit: number = 20,
  ): Promise<{ data: VoucherRedemptionLogEntity[]; total: number; page: number; limit: number }> {
    const [data, total] = await this.redemptionLogRepo.findAndCount({
      where: { campaignId },
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return { data, total, page, limit };
  }

  async awardVoucherToMassUsers(dto: {
    campaignId: string;
    businessId: string;
    criteria: 'all' | 'min_orders' | 'min_spent';
    minOrders?: number;
    minSpent?: number;
    expiresAt?: string;
  }): Promise<{ awardedCount: number }> {
    const campaign = await this.getCampaignById(dto.campaignId);
    if (
      campaign.status !== VoucherCampaignStatus.ACTIVE &&
      (campaign.status as string) !== 'archived'
    ) {
      throw new BadRequestException(
        `Campaign must be ACTIVE to award vouchers (current: ${campaign.status})`,
      );
    }

    // Build the query to find eligible user ids
    const queryBuilder = this.loyaltyRepo.createQueryBuilder('lp')
      .select('lp.userId', 'userId')
      .where('lp.businessId = :businessId', { businessId: dto.businessId });

    if (dto.criteria === 'min_orders' && dto.minOrders !== undefined) {
      queryBuilder.andWhere('lp.totalOrders >= :minOrders', { minOrders: dto.minOrders });
    } else if (dto.criteria === 'min_spent' && dto.minSpent !== undefined) {
      queryBuilder.andWhere('lp.totalSpent >= :minSpent', { minSpent: dto.minSpent });
    }

    const records = await queryBuilder.getRawMany();
    const userIds = records.map(r => r.userId);

    if (userIds.length === 0) {
      return { awardedCount: 0 };
    }

    let awardedCount = 0;
    for (const userId of userIds) {
      try {
        await this.awardVoucherToCustomer({
          campaignId: dto.campaignId,
          userId,
          businessId: dto.businessId,
          expiresAt: dto.expiresAt,
        });
        awardedCount++;
      } catch (err) {
        console.error(`Failed to award voucher to user ${userId} in mass award:`, err);
      }
    }

    return { awardedCount };
  }
}

