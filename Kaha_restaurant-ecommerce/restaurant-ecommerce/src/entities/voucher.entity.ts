import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from './base.entity';
import { VoucherCampaignEntity } from './voucher-campaign.entity';
import { VoucherStatus, VoucherDiscountType, VoucherDiscountClass } from './voucher.enums';
export { VoucherStatus, VoucherDiscountType };

@Entity('vouchers')
export class VoucherEntity extends BaseEntity {
  @Column({ type: 'varchar', nullable: true })
  campaignId: string | null;

  @ManyToOne(() => VoucherCampaignEntity, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'campaignId' })
  campaign: VoucherCampaignEntity | null;

  @Column({ type: 'enum', enum: VoucherDiscountClass, default: VoucherDiscountClass.ORDER_TOTAL })
  discountClass: VoucherDiscountClass;

  @Column({ type: 'varchar', array: true, nullable: true })
  applicableServiceTypes: string[] | null;

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

