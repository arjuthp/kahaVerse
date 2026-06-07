import { Entity, Column } from 'typeorm';
import { BaseEntity } from './base.entity';

export enum VoucherStatus {
  ACTIVE = 'active',
  USED = 'used',
  EXPIRED = 'expired',
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
  discountAmount: number; // NPR value

  @Column({ type: 'int' })
  pointsUsed: number; // how many points were spent to get this

  @Column({ type: 'enum', enum: VoucherStatus, default: VoucherStatus.ACTIVE })
  status: VoucherStatus;

  @Column({ type: 'varchar', nullable: true })
  usedOnOrderId?: string;

  @Column({ type: 'timestamp', nullable: true })
  expiresAt?: Date;
}
