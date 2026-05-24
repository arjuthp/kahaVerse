import { Entity, Column, ManyToOne, OneToMany, JoinColumn } from "typeorm";

import {
  BaseEntity,
  MenuEntity,
  OrderItemAddonEntity,
  OrderEntity,
  MenuVariantEntity,
} from "./index.entity";

@Entity()
export class OrderItemEntity extends BaseEntity {
  @Column()
  quantity: number;

  @Column()
  menuNameSnapshot: string;

  @Column({ nullable: true })
  variantNameSnapshot: string;

  @Column("numeric", { precision: 12, scale: 2 })
  unitPriceSnapshot: number;

  @Column("numeric", { precision: 12, scale: 2 })
  addonsTotal: number;

  @Column("numeric", { precision: 12, scale: 2 })
  lineTotal: number;

  @ManyToOne(() => OrderEntity, (order) => order.orderItems)
  @JoinColumn()
  order: OrderEntity;

  @ManyToOne(() => MenuEntity)
  @JoinColumn()
  menu: MenuEntity;

  @ManyToOne(() => MenuVariantEntity, { nullable: true })
  @JoinColumn()
  menuVariant: MenuVariantEntity;

  @OneToMany(() => OrderItemAddonEntity, (addon) => addon.orderItem)
  addons?: OrderItemAddonEntity[];
}
