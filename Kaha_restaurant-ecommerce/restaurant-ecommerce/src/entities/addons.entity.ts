import { Column, Entity, ManyToOne, JoinColumn } from "typeorm";

import { BaseEntity, AddonGroupEntity } from "./index.entity";

@Entity()
export class AddOnEntity extends BaseEntity {
  @Column("decimal", { precision: 10, scale: 2 })
  price: number;

  @Column()
  name: string;

  @Column({ nullable: true })
  description: string;

  @Column({ nullable: true })
  coverImg: string;

  @Column("boolean", { default: true })
  isActive: boolean;

  @Column("int", { default: 0 })
  sortOrder: number;

  @ManyToOne(() => AddonGroupEntity, (addonGroup) => addonGroup.addons, {
    onDelete: "CASCADE",
  })
  @JoinColumn()
  addonGroup: AddonGroupEntity;
}
