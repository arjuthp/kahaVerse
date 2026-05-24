import { Column, Entity, ManyToOne, JoinColumn, Index } from "typeorm";
import { BaseEntity, MenuEntity } from "./index.entity";

@Entity()
export class MenuVariantEntity extends BaseEntity {
  @Column()
  name: string;

  @Column("numeric", {
    precision: 12,
    scale: 2,
  })
  price: number;

  @Column({ default: true })
  isAvailable: boolean;

  @Column("int", { default: 0 })
  sortOrder: number;

  @ManyToOne(() => MenuEntity, (menu) => menu.variants, {
    onDelete: "CASCADE",
  })
  @JoinColumn()
  menu: MenuEntity;
}
