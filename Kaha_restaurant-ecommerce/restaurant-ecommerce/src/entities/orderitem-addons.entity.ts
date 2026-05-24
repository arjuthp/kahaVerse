import { Entity, Column, ManyToOne, JoinColumn } from "typeorm";

import { AddOnEntity, BaseEntity, OrderItemEntity } from "./index.entity";

@Entity()
export class OrderItemAddonEntity extends BaseEntity {
  @Column()
  quantity: number;

  @Column()
  addonNameSnapshot: string;

  @Column({ nullable: true })
  addonGroupNameSnapshot: string;

  @Column("numeric", { precision: 12, scale: 2 })
  unitPriceSnapshot: number;

  @Column("numeric", { precision: 12, scale: 2 })
  lineTotal: number;

  @ManyToOne(() => OrderItemEntity, (orderItem) => orderItem.addons)
  @JoinColumn()
  orderItem: OrderItemEntity;

  @ManyToOne(() => AddOnEntity)
  @JoinColumn()
  addon: AddOnEntity;
}
