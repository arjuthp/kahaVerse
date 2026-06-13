import { Entity, Column } from 'typeorm';
import { BaseEntity } from './base.entity';

export enum VoucherStatus {
  ACTIVE = 'active',
  USED = 'used',
  EXPIRED = 'expired',
}

export enum VoucherDiscountType {
  FIXED = 'FIXED',
  PERCENTAGE = 'PERCENTAGE',
}

@Entity('vouchers')
export class VoucherEntity extends BaseEntity {
  @Column({ type: 'varchar' })
  userId: string;

  @Column({ type: 'varchar' })
  businessId: string;

  @Column({ type: 'varchar', unique: true })
  code: string; // e.g. "KAHA-2A3F9"

  @Column({ type: 'numeric', precision: 10, scale: 2 })
  discountAmount: number; // NPR value for legacy support

  @Column({ type: 'enum', enum: VoucherDiscountType, default: VoucherDiscountType.FIXED })
  discountType: VoucherDiscountType;

  @Column({ type: 'numeric', precision: 10, scale: 2, default: 0 })
  discountValue: number;

  @Column({ type: 'numeric', precision: 10, scale: 2, nullable: true })
  maxDiscountAmount?: number;

  @Column({ type: 'numeric', precision: 10, scale: 2, nullable: true })
  minOrderAmount?: number;

  @Column({ type: 'int', nullable: true })
  maxUses?: number;

  @Column({ type: 'int', default: 0 })
  usageCount: number;

  @Column({ type: 'int', default: 1 })
  maxUsesPerUser: number;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @Column({ type: 'int' })
  pointsUsed: number; // how many points were spent to get this

  @Column({ type: 'enum', enum: VoucherStatus, default: VoucherStatus.ACTIVE })
  status: VoucherStatus;

  @Column({ type: 'varchar', nullable: true })
  usedOnOrderId?: string;

  @Column({ type: 'timestamp', nullable: true })
  expiresAt?: Date;
}

