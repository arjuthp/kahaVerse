import { Entity, Column, Index } from 'typeorm';
import { BaseEntity } from './base.entity';

export enum LoyaltyTxType {
  EARN = 'earn',
  REDEEM = 'redeem',
  EXPIRE = 'expire',
  MANUAL_ADJUST = 'manual_adjust',
}

@Index('UQ_loyalty_tx_order_earn', ['orderId', 'type'], {
  unique: true,
  where: `"orderId" IS NOT NULL AND type = 'earn'`,
})
@Entity('loyalty_transactions')
export class LoyaltyTransactionEntity extends BaseEntity {
  @Column({ type: 'varchar' })
  userId: string;

  @Column({ type: 'varchar' })
  businessId: string;

  @Column({ type: 'varchar', nullable: true })
  orderId?: string;

  @Column({ type: 'enum', enum: LoyaltyTxType, default: LoyaltyTxType.EARN })
  type: LoyaltyTxType;

  @Column({ type: 'int' })
  points: number; // positive = earned, negative = redeemed/expired

  @Column({ type: 'varchar', nullable: true })
  description?: string; // e.g. "Earned from Order #1234"

  @Column({ type: 'int' })
  balanceAfter: number; // snapshot of balance after this tx
}
