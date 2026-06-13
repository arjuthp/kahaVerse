import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, LessThan } from 'typeorm';
import { LoyaltyPointsEntity } from '../../entities/loyalty-points.entity';
import { LoyaltyTransactionEntity, LoyaltyTxType } from '../../entities/loyalty-transaction.entity';
import { LoyaltyConfigEntity } from '../../entities/loyalty-config.entity';

@Injectable()
export class LoyaltyExpiryService {
  private readonly logger = new Logger(LoyaltyExpiryService.name);

  constructor(
    @InjectRepository(LoyaltyPointsEntity)
    private readonly loyaltyRepo: Repository<LoyaltyPointsEntity>,
    @InjectRepository(LoyaltyConfigEntity)
    private readonly configRepo: Repository<LoyaltyConfigEntity>,
    private readonly dataSource: DataSource,
  ) {}

  // Runs every day at 02:00 AM server time
  @Cron(CronExpression.EVERY_DAY_AT_2AM)
  async handlePointsExpiry() {
    this.logger.log('Running points expiry job...');

    // Get all configs that have expiry enabled
    const configs = await this.configRepo.find();
    const expiryConfigs = configs.filter(c => c.pointsExpiryDays != null);

    if (expiryConfigs.length === 0) {
      this.logger.log('No businesses have pointsExpiryDays configured. Skipping.');
      return;
    }

    let totalExpired = 0;

    for (const config of expiryConfigs) {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - Number(config.pointsExpiryDays));

      // Find ledgers for this business with points > 0 and no activity since cutoff
      const staleLedgers = await this.loyaltyRepo.find({
        where: {
          businessId: config.businessId,
          updatedAt: LessThan(cutoffDate),
        },
      });

      const toExpire = staleLedgers.filter(l => l.totalPoints > 0);

      for (const ledger of toExpire) {
        await this.dataSource.transaction(async (em) => {
          const pointsExpired = ledger.totalPoints;

          const tx = em.create(LoyaltyTransactionEntity, {
            userId: ledger.userId,
            businessId: ledger.businessId,
            orderId: null,
            type: LoyaltyTxType.EXPIRE,
            points: -pointsExpired,
            balanceAfter: 0,
            description: `${pointsExpired} pts expired after ${config.pointsExpiryDays} days of inactivity`,
          });
          await em.save(LoyaltyTransactionEntity, tx);

          ledger.totalPoints = 0;
          await em.save(LoyaltyPointsEntity, ledger);
        });

        totalExpired++;
        this.logger.log(
          `Expired points for user ${ledger.userId} (business ${config.businessId})`
        );
      }
    }

    this.logger.log(`Points expiry job complete. ${totalExpired} ledger(s) zeroed.`);
  }

  // Manual trigger endpoint support — callable from service tests
  async runExpiryNow(): Promise<{ processed: number }> {
    await this.handlePointsExpiry();
    return { processed: 1 };
  }
}
