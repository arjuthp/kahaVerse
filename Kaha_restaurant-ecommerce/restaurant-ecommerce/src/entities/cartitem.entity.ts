import { Entity, Column, ManyToOne, OneToMany, JoinColumn } from "typeorm";

import { CartItemAddOnsEntity } from "./cart-item-addons.entity";
import { BaseEntity, CartEntity, MenuEntity, MenuVariantEntity } from "./index.entity";

@Entity()
export class CartItemEntity extends BaseEntity {
  @Column({ nullable: false })
  public quantity: number;

  @Column("numeric", { precision: 12, scale: 2, nullable: true })
  public unitPriceSnapshot: number;

  @Column({ nullable: true })
  public specialInstructions: string;

  @ManyToOne(() => CartEntity, (cart) => cart.cartItems, {
    onDelete: "CASCADE",
  })
  @JoinColumn()
  public cart: CartEntity;

  @ManyToOne(() => MenuEntity)
  @JoinColumn()
  public menu: MenuEntity;

  @ManyToOne(() => MenuVariantEntity, { nullable: true })
  @JoinColumn()
  public menuVariant: MenuVariantEntity;

  @OneToMany(
    () => CartItemAddOnsEntity,
    (cartItemAddOn) => cartItemAddOn.cartItem
  )
  addOns: CartItemAddOnsEntity[];
}
//when user click on order
