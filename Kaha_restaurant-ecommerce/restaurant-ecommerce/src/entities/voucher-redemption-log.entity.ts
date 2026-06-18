import { Entity, Column } from 'typeorm';
import { BaseEntity } from './base.entity';

export enum VoucherRedemptionResult {
  SUCCESS = 'success',
  REJECTED = 'rejected',
  RELEASED = 'released',
}

@Entity('voucher_redemption_log')
export class VoucherRedemptionLogEntity extends BaseEntity {
  @Column({ type: 'varchar', nullable: true })
  voucherId: string | null;

  @Column({ type: 'varchar', nullable: true })
  campaignId: string | null;

  @Column({ type: 'varchar' })
  userId: string;

  @Column({ type: 'varchar' })
  businessId: string;

  @Column({ type: 'varchar', nullable: true })
  orderId: string | null;

  @Column({ type: 'varchar' })
  attemptedCode: string;

  @Column({ type: 'enum', enum: VoucherRedemptionResult })
  result: VoucherRedemptionResult;

  @Column({ type: 'varchar', nullable: true })
  rejectionReason: string | null;

  @Column({ type: 'numeric', precision: 10, scale: 2, nullable: true })
  discountAmountApplied: number | null;
}
