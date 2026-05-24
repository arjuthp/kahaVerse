import { OrderStatusEnum } from "common/enums";
import { Column, Entity, JoinColumn, ManyToOne } from "typeorm";

import { BaseEntity, OrderEntity } from "./index.entity";

@Entity()
export class OrderStatusEntity extends BaseEntity {
  @ManyToOne(() => OrderEntity, (order) => order.orderStatus)
  @JoinColumn()
  order: OrderEntity;

  @Column({
    type: "enum",
    enum: OrderStatusEnum,
    default: OrderStatusEnum.PENDING,
  })
  status: OrderStatusEnum;

  @Column()
  updatedBy: string;

  @Column({ nullable: true })
  remarks?: string;
}
