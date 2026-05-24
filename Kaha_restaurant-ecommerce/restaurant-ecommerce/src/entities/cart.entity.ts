import { Entity, Column, OneToMany, Index } from "typeorm";

import { BaseEntity, CartItemEntity } from "./index.entity";

@Entity()
export class CartEntity extends BaseEntity {
  @Column()
  public userId: string;

  @Index()
  @Column()
  public businessId: string;

  @OneToMany(() => CartItemEntity, (cartItem) => cartItem.cart)
  public cartItems: CartItemEntity[];
}
