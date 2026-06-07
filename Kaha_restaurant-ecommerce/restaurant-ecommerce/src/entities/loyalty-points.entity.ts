import { Entity, Column } from 'typeorm';
import { BaseEntity } from './base.entity';

@Entity('loyalty_points')
export class LoyaltyPointsEntity extends BaseEntity {
  @Column({ type: 'varchar' })
  userId: string;

  @Column({ type: 'varchar' })
  businessId: string;

  @Column({ type: 'int', default: 0 })
  totalPoints: number; // current redeemable balance

  @Column({ type: 'int', default: 0 })
  lifetimePointsEarned: number;

  @Column({ type: 'int', default: 0 })
  lifetimePointsRedeemed: number;

  @Column({ type: 'int', default: 0 })
  totalOrders: number;

  @Column({ type: 'numeric', precision: 12, scale: 2, default: 0 })
  totalSpent: number;
}
