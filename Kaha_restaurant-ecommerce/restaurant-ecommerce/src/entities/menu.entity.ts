import {
  Column,
  ManyToOne,
  JoinColumn,
  Entity,
  ManyToMany,
  OneToMany,
  JoinTable,
  Index,
} from "typeorm";
import { BaseEntity } from "./base.entity";
import { MenuServiceEnum } from "common/enums";
import { CategoryEntity } from "./category.entity";
import { MenuVariantEntity } from "./menu-variant.entity";
import { AddonGroupEntity } from "./addon-group.entity";
import { MenuRatingEntity } from "./menu-rating.entity";

@Entity()
export class MenuEntity extends BaseEntity {
  @Column()
  name: string;

  @Column({ nullable: true })
  description: string;

  @Column({
    type: "varchar",
    length: 255,
    array: true,
    nullable: true,
  })
  images: string[];

  @Column("jsonb", { nullable: true })
  details: Record<string, string>;

  @Column("boolean", { default: false })
  isBarItem: boolean;

  @Column({ default: true })
  isAvailable: boolean;

  @Column("enum", {
    enum: MenuServiceEnum,
    default: [MenuServiceEnum.DINE_IN],
    array: true,
  })
  services: MenuServiceEnum[];

  @Column("numeric", {
    precision: 12,
    scale: 2,
  })
  price: number;

  @Column("numeric", {
    precision: 12,
    scale: 2,
    nullable: true,
  })
  discountedPrice: number;

  @Index()
  @Column()
  businessId: string;

  @Column("boolean", { default: false })
  isSignature: boolean;

  @Column("boolean", { default: false, nullable: true })
  allowAddOns: boolean;

  @OneToMany(() => MenuVariantEntity, (variant) => variant.menu)
  variants: MenuVariantEntity[];

  @JoinTable()
  @ManyToMany(() => AddonGroupEntity, (addonGroup) => addonGroup.menus)
  addonGroups: AddonGroupEntity[];

  @ManyToOne(() => CategoryEntity, (category) => category.menu, {
    eager: true,
  })
  @JoinColumn()
  category: CategoryEntity;

  @OneToMany(() => MenuRatingEntity, (menuRating) => menuRating.menu)
  menuRating: MenuRatingEntity;
}
