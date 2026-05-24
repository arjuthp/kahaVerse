import { Column, Entity, JoinColumn, ManyToOne } from "typeorm";
import { BaseEntity } from "./base.entity";
import { MenuEntity } from "./menu.entity";
import { OrderItemEntity } from "./orderitem.entity";

@Entity()
export class MenuRatingEntity extends BaseEntity {
  @Column({ type: "float" })
  rating: number;

  @Column()
  comments: string;

  @Column()
  ratedBy: string;

  @Column()
  businessId: string;

  @ManyToOne(() => MenuEntity, (menu) => menu.menuRating)
  @JoinColumn()
  menu: MenuEntity;

  @Column({ default: true })
  isVisible: boolean;

  @ManyToOne(() => OrderItemEntity, { nullable: true })
  @JoinColumn()
  orderItem: OrderItemEntity;
}
