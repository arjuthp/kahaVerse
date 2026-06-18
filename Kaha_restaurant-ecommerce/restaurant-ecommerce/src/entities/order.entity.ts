import { Entity, Column, OneToMany } from "typeorm";
import { ServiceTypeEnum, PaymentStatusEnum, PaymentMethodEnum } from "common/enums";

import { OrderItemEntity, BaseEntity, OrderStatusEntity } from "./index.entity";

@Entity()
export class OrderEntity extends BaseEntity {
  @Column()
  userId: string;

  @Column()
  businessId: string;

  @Column({ type: "varchar", unique: true })
  orderNumber: string;

  @Column("enum", { enum: ServiceTypeEnum, default: ServiceTypeEnum.DINE_IN })
  serviceType: ServiceTypeEnum;

  @Column({ nullable: true })
  tableNumber: string;

  @Column("numeric", { precision: 12, scale: 2, default: 0 })
  subtotal: number;

  @Column("numeric", { precision: 12, scale: 2, default: 0 })
  taxAmount: number;

  @Column("numeric", { precision: 12, scale: 2, default: 0 })
  deliveryFee: number;

  @Column("numeric", { precision: 12, scale: 2, default: 0 })
  serviceCharge: number;

  @Column("numeric", { precision: 12, scale: 2, default: 0 })
  discountAmount: number;

  @Column("numeric", { precision: 12, scale: 2, default: 0 })
  orderDiscountAmount: number;

  @Column("numeric", { precision: 12, scale: 2, default: 0 })
  deliveryDiscountAmount: number;

  @Column("numeric", { precision: 12, scale: 2, default: 0 })
  serviceChargeDiscountAmount: number;

  @Column("numeric", { precision: 12, scale: 2, default: 0 })
  itemDiscountAmount: number;

  @Column({ type: "varchar", array: true, default: "{}" })
  appliedVoucherIds: string[];

  @Column("numeric", { precision: 12, scale: 2, default: 0 })
  tipAmount: number;

  @Column("enum", { enum: PaymentStatusEnum, default: PaymentStatusEnum.UNPAID })
  paymentStatus: PaymentStatusEnum;

  @Column("enum", { enum: PaymentMethodEnum, nullable: true })
  paymentMethod: PaymentMethodEnum;

  @Column({ type: "float", default: 0 })
  totalAmount?: number;

  @Column({ nullable: true })
  remarks?: string;

  @OneToMany(() => OrderItemEntity, (orderItem) => orderItem.order)
  orderItems: OrderItemEntity[];

  @OneToMany(() => OrderStatusEntity, (status) => status.order)
  orderStatus: OrderStatusEntity[];
}
