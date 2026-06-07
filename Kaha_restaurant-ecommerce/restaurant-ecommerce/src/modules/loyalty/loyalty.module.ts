import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LoyaltyPointsEntity } from '../../entities/loyalty-points.entity';
import { LoyaltyTransactionEntity } from '../../entities/loyalty-transaction.entity';
import { VoucherEntity } from '../../entities/voucher.entity';
import { LoyaltyConfigEntity } from '../../entities/loyalty-config.entity';
import { LoyaltyService } from './loyalty.service';
import { LoyaltyController } from './loyalty.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      LoyaltyPointsEntity,
      LoyaltyTransactionEntity,
      VoucherEntity,
      LoyaltyConfigEntity,
    ]),
  ],
  providers: [LoyaltyService],
  controllers: [LoyaltyController],
  exports: [LoyaltyService], // so OrderModule can call earnPoints on delivery
})
export class LoyaltyModule {}
