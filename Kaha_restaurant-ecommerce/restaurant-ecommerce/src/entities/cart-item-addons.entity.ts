import { Column, Entity, JoinColumn, ManyToOne } from "typeorm";

import { AddOnEntity, CartItemEntity, BaseEntity } from "./index.entity";

@Entity()
export class CartItemAddOnsEntity extends BaseEntity {
  @Column({ nullable: true })
  quantity: number;

  @Column("numeric", { precision: 12, scale: 2, nullable: true })
  unitPriceSnapshot: number;

  @ManyToOne(() => CartItemEntity, (cartItem) => cartItem.addOns)
  cartItem: CartItemEntity;

  @ManyToOne(() => AddOnEntity)
  @JoinColumn()
  menuAddOn: AddOnEntity;
}
