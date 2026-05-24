import { Column, Entity, Index, ManyToOne, OneToMany } from "typeorm";
import { BaseEntity } from "./base.entity";
import { MenuEntity } from "./menu.entity";

@Entity({ name: "category" })
export class CategoryEntity extends BaseEntity {
  @Index()
  @Column({ unique: true })
  name: string;

  @Column({ length: 1024, nullable: true })
  description?: string;

  @Column({ nullable: true })
  icon: string;

  @Column({ default: true, type: "boolean" })
  isActive: boolean;

  @Column({ nullable: true })
  position: number;

  @Index()
  @Column()
  businessId: string;

  @OneToMany(() => CategoryEntity, (category) => category.parent, {
    nullable: true,
  })
  public childrens?: CategoryEntity[];

  @ManyToOne(() => CategoryEntity, (category) => category.childrens, {
    nullable: true,
  })
  public parent: CategoryEntity;

  @OneToMany(() => MenuEntity, (menu) => menu.category)
  public menu: MenuEntity;
}
