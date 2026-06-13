import { Entity, Column, Index } from 'typeorm';
import { BaseEntity } from './base.entity';

export enum AccrualMode {
  SPEND = 'SPEND',
  VISIT = 'VISIT',
  BOTH  = 'BOTH',
}

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

  @Column({ type: 'enum', enum: AccrualMode, default: AccrualMode.SPEND })
  accrualMode: AccrualMode;

  @Column({ type: 'int', default: 5 })
  pointsPerVisit: number;
  // Points awarded per qualifying visit (used in VISIT and BOTH modes)

  @Column({ type: 'numeric', precision: 10, scale: 2, default: 0 })
  minSpendForVisit: number;
  // Minimum cart subtotal required to count as a qualifying visit
  // 0 means every order qualifies

  @Column({ type: 'numeric', precision: 4, scale: 2, default: 1.0 })
  bonusMultiplier: number;
  // Campaign multiplier — set to 2.0 for double points events
  // Applied to ALL accrual modes after base points are calculated

  @Column({ type: 'int', nullable: true, default: null })
  pointsExpiryDays: number | null;
  // How many days earned points remain valid before expiry
  // null = points never expire
}
