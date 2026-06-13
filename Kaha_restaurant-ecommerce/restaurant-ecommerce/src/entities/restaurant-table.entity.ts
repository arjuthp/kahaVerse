import { Entity, Column, Index } from "typeorm";
import { BaseEntity } from "./base.entity";

export enum TableStatus {
  AVAILABLE = "available",
  OCCUPIED = "occupied",
  RESERVED = "reserved",
}

export enum TableSection {
  INDOOR = "indoor",
  OUTDOOR = "outdoor",
  ROOFTOP = "rooftop",
  BAR = "bar",
  PRIVATE = "private",
}

@Entity()
export class RestaurantTableEntity extends BaseEntity {
  @Index()
  @Column()
  businessId: string;

  @Column()
  tableNumber: string;

  @Column({ type: "int" })
  capacity: number;

  @Column({
    type: "enum",
    enum: TableSection,
    default: TableSection.INDOOR,
  })
  section: TableSection;

  @Column({
    type: "enum",
    enum: TableStatus,
    default: TableStatus.AVAILABLE,
  })
  status: TableStatus;

  @Column({ default: true })
  isActive: boolean;

  @Column({ nullable: true })
  notes?: string;
}
