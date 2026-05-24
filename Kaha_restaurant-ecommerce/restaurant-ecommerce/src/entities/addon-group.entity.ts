import { Column, Entity, OneToMany, ManyToMany, Index } from "typeorm";
import { BaseEntity, AddOnEntity, MenuEntity } from "./index.entity";
import { AddonSelectionTypeEnum } from "../common/enums/addon-selection-type.enum";

@Entity()
export class AddonGroupEntity extends BaseEntity {
  @Column()
  name: string;

  @Index()
  @Column()
  businessId: string;

  @Column("boolean", { default: false })
  isRequired: boolean;

  @Column("int", { default: 0 })
  minSelect: number;

  @Column("int", { nullable: true })
  maxSelect: number;

  @Column("enum", {
    enum: AddonSelectionTypeEnum,
    default: AddonSelectionTypeEnum.MULTI,
  })
  selectionType: AddonSelectionTypeEnum;

  @Column("boolean", { default: true })
  isActive: boolean;

  @OneToMany(() => AddOnEntity, (addon) => addon.addonGroup)
  addons: AddOnEntity[];

  @ManyToMany(() => MenuEntity, (menu) => menu.addonGroups)
  menus: MenuEntity[];
}
