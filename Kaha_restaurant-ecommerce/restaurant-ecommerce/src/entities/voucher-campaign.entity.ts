import { Entity, Column } from 'typeorm';
import { BaseEntity } from './base.entity';
import { VoucherDiscountType, VoucherDiscountClass, VoucherCampaignStatus } from './voucher.enums';

@Entity('voucher_campaign')
export class VoucherCampaignEntity extends BaseEntity {
  @Column({ type: 'varchar', nullable: true })
  businessId: string | null;

  @Column({ type: 'varchar' })
  name: string;

  @Column({ type: 'varchar', unique: true, nullable: true })
  code: string | null;

  @Column({ type: 'varchar', nullable: true })
  codePattern: string | null;

  @Column({ type: 'enum', enum: VoucherDiscountType, default: VoucherDiscountType.FIXED })
  discountType: VoucherDiscountType;

  @Column({ type: 'numeric', precision: 10, scale: 2 })
  discountValue: number;

  @Column({ type: 'numeric', precision: 10, scale: 2, nullable: true })
  maxDiscountAmount: number | null;

  @Column({ type: 'numeric', precision: 10, scale: 2, nullable: true })
  minOrderAmount: number | null;

  @Column({ type: 'enum', enum: VoucherDiscountClass, default: VoucherDiscountClass.ORDER_TOTAL })
  discountClass: VoucherDiscountClass;

  @Column({ type: 'varchar', array: true, nullable: true })
  applicableServiceTypes: string[] | null;

  @Column({ type: 'varchar', array: true, nullable: true })
  applicableCategoryIds: string[] | null;

  @Column({ type: 'varchar', array: true, nullable: true })
  applicableMenuItemIds: string[] | null;

  @Column({ type: 'boolean', default: false })
  requiresFirstOrder: boolean;

  @Column({ type: 'integer', array: true, nullable: true })
  applicableOrderSequence: number[] | null;

  @Column({ type: 'integer', array: true, nullable: true })
  validDaysOfWeek: number[] | null;

  @Column({ type: 'time', nullable: true })
  validTimeStart: string | null;

  @Column({ type: 'time', nullable: true })
  validTimeEnd: string | null;

  @Column({ type: 'integer', nullable: true })
  maxRedemptionsTotal: number | null;

  @Column({ type: 'integer', nullable: true })
  maxRedemptionsPerUser: number | null;

  @Column({ type: 'integer', nullable: true })
  maxRedemptionsPerUserPerDay: number | null;

  @Column({ type: 'numeric', precision: 10, scale: 2, nullable: true })
  totalBudgetCap: number | null;

  @Column({ type: 'numeric', precision: 10, scale: 2, default: 0 })
  totalRedeemedAmount: number;

  @Column({ type: 'integer', default: 0 })
  stackPriority: number;

  @Column({ type: 'varchar', array: true, nullable: true })
  combinesWith: string[] | null;

  @Column({ type: 'timestamp', nullable: true })
  startsAt: Date | null;

  @Column({ type: 'timestamp', nullable: true })
  expiresAt: Date | null;

  @Column({ type: 'enum', enum: VoucherCampaignStatus, default: VoucherCampaignStatus.DRAFT })
  status: VoucherCampaignStatus;

  @Column({ type: 'varchar', nullable: true })
  createdBy: string | null;
}
