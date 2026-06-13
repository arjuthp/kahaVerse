import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, In } from 'typeorm';
import { LoyaltyPointsEntity } from '../../entities/loyalty-points.entity';
import { LoyaltyTransactionEntity, LoyaltyTxType } from '../../entities/loyalty-transaction.entity';
import { VoucherEntity, VoucherStatus } from '../../entities/voucher.entity';
import { LoyaltyConfigEntity, AccrualMode } from '../../entities/loyalty-config.entity';
import { User } from '../../entities/user.entity';
import { calculateDiscount } from './voucher-calculator';
import { CreateVoucherDto } from './dto/create-voucher.dto';

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
  async validateVoucher(code: string, userId: string): Promise<VoucherEntity> {
    const voucher = await this.voucherRepo.findOne({ where: { code } });
    if (!voucher) throw new NotFoundException('Voucher not found');
    if (voucher.userId !== userId) throw new BadRequestException('Voucher does not belong to this customer');
    if (voucher.status !== VoucherStatus.ACTIVE) throw new BadRequestException(`Voucher is ${voucher.status}`);
    if (voucher.expiresAt && new Date() > voucher.expiresAt) {
      voucher.status = VoucherStatus.EXPIRED;
      await this.voucherRepo.save(voucher);
      throw new BadRequestException('Voucher has expired');
    }
    if (!voucher.isActive) throw new BadRequestException('Voucher is inactive');
    if (voucher.maxUses !== null && voucher.maxUses !== undefined && voucher.usageCount >= voucher.maxUses) {
      throw new BadRequestException('Voucher usage limit reached');
    }
    return voucher;
  }

  async validateVoucherForCart(code: string, userId: string, cartTotal: number): Promise<VoucherEntity> {
    const voucher = await this.validateVoucher(code, userId);
    if (voucher.minOrderAmount && cartTotal < Number(voucher.minOrderAmount)) {
      throw new BadRequestException(
        `Minimum order amount of NPR ${voucher.minOrderAmount} required`
      );
    }
    return voucher;
  }

  // ──────────────────────────────────────────────────────────────
  //  APPLY VOUCHER on order completion
  // ──────────────────────────────────────────────────────────────
  async applyVoucher(code: string, orderId: string, cartTotal: number): Promise<number> {
    return await this.dataSource.transaction(async (manager) => {

      const result = await manager
        .createQueryBuilder()
        .update(VoucherEntity)
        .set({
          usageCount: () => '"usageCount" + 1',
          status: VoucherStatus.USED,
          usedOnOrderId: orderId,
        })
        .where('code = :code', { code })
        .andWhere('status = :status', { status: VoucherStatus.ACTIVE })
        .andWhere('"isActive" = true')
        .andWhere('("maxUses" IS NULL OR "usageCount" < "maxUses")')
        .returning('*')
        .execute();

      if (!result.affected || result.affected === 0) {
        const voucher = await manager.findOne(VoucherEntity, { where: { code } });
        if (!voucher) throw new NotFoundException('Voucher not found');
        if (voucher.status !== VoucherStatus.ACTIVE) {
          throw new BadRequestException(`Voucher is ${voucher.status}`);
        }
        if (voucher.maxUses && voucher.usageCount >= voucher.maxUses) {
          throw new BadRequestException('Voucher usage limit reached');
        }
        throw new BadRequestException('Voucher could not be applied');
      }

      const voucher = result.raw[0] as VoucherEntity;

      return calculateDiscount(
        voucher.discountType,
        Number(voucher.discountValue),
        cartTotal,
        voucher.maxDiscountAmount ? Number(voucher.maxDiscountAmount) : undefined,
      );
    });
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
}
