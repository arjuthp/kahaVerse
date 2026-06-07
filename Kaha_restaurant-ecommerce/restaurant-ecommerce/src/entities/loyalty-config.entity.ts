import { Entity, Column, Index } from 'typeorm';
import { BaseEntity } from './base.entity';

@Entity('loyalty_config')
export class LoyaltyConfigEntity extends BaseEntity {
  @Index()
  @Column({ type: 'varchar', unique: true })
  businessId: string;

  @Column({ type: 'numeric', precision: 10, scale: 4, default: 0.1 })
  pointsPerNpr: number;

  @Column({ type: 'numeric', precision: 10, scale: 4, default: 0.5 })
  pointsToNprRate: number;

  @Column({ type: 'int', default: 100 })
  minRedeemPoints: number;

  @Column({ type: 'int', default: 30 })
  voucherExpiryDays: number;
}
