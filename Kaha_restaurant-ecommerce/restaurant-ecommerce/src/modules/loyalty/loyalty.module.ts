import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LoyaltyPointsEntity } from '../../entities/loyalty-points.entity';
import { LoyaltyTransactionEntity } from '../../entities/loyalty-transaction.entity';
import { VoucherEntity } from '../../entities/voucher.entity';
import { LoyaltyConfigEntity } from '../../entities/loyalty-config.entity';
import { LoyaltyService } from './loyalty.service';
import { LoyaltyExpiryService } from './loyalty-expiry.service';
import { LoyaltyController } from './loyalty.controller';

import { VoucherCampaignEntity } from '../../entities/voucher-campaign.entity';
import { VoucherRedemptionLogEntity } from '../../entities/voucher-redemption-log.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      LoyaltyPointsEntity,
      LoyaltyTransactionEntity,
      VoucherEntity,
      LoyaltyConfigEntity,
      VoucherCampaignEntity,
      VoucherRedemptionLogEntity,
    ]),
  ],
  providers: [LoyaltyService, LoyaltyExpiryService],
  controllers: [LoyaltyController],
  exports: [LoyaltyService], // so OrderModule can call earnPoints on delivery
})
export class LoyaltyModule {}
