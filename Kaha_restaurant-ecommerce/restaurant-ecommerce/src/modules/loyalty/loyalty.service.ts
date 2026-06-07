import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, In } from 'typeorm';
import { LoyaltyPointsEntity } from '../../entities/loyalty-points.entity';
import { LoyaltyTransactionEntity, LoyaltyTxType } from '../../entities/loyalty-transaction.entity';
import { VoucherEntity, VoucherStatus } from '../../entities/voucher.entity';
import { LoyaltyConfigEntity } from '../../entities/loyalty-config.entity';
import { User } from '../../entities/user.entity';

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
      });
      await this.configRepo.save(config);
    }
    return config;
  }

  async updateConfig(businessId: string, update: Partial<LoyaltyConfigEntity>): Promise<LoyaltyConfigEntity> {
    const config = await this.getOrCreateConfig(businessId);
    if (update.pointsPerNpr !== undefined) config.pointsPerNpr = Number(update.pointsPerNpr);
    if (update.pointsToNprRate !== undefined) config.pointsToNprRate = Number(update.pointsToNprRate);
    if (update.minRedeemPoints !== undefined) config.minRedeemPoints = Number(update.minRedeemPoints);
    if (update.voucherExpiryDays !== undefined) config.voucherExpiryDays = Number(update.voucherExpiryDays);
    return this.configRepo.save(config);
  }

  // ──────────────────────────────────────────────────────────────
  //  EARN POINTS (called when an order is completed/delivered)
  // ──────────────────────────────────────────────────────────────
  async earnPoints(userId: string, businessId: string, orderId: string, orderAmount: number): Promise<LoyaltyPointsEntity> {
    const config = await this.getOrCreateConfig(businessId);
    const pointsEarned = Math.floor(orderAmount * Number(config.pointsPerNpr));
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
        description: `Earned ${pointsEarned} pts from Order #${orderId.slice(-6).toUpperCase()}`,
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
    return voucher;
  }

  // ──────────────────────────────────────────────────────────────
  //  APPLY VOUCHER on order completion
  // ──────────────────────────────────────────────────────────────
  async applyVoucher(code: string, orderId: string): Promise<number> {
    const voucher = await this.voucherRepo.findOne({ where: { code } });
    if (!voucher || voucher.status !== VoucherStatus.ACTIVE) throw new BadRequestException('Invalid voucher');
    voucher.status = VoucherStatus.USED;
    voucher.usedOnOrderId = orderId;
    await this.voucherRepo.save(voucher);
    return Number(voucher.discountAmount);
  }

  // ──────────────────────────────────────────────────────────────
  //  GET CUSTOMER LEDGER
  // ──────────────────────────────────────────────────────────────
  async getLedger(userId: string, businessId: string): Promise<LoyaltyPointsEntity> {
    return this.getOrCreateLedger(userId, businessId);
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
