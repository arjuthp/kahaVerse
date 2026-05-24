import { Entity, Column, Index, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from './base.entity';
import { User } from './user.entity';

export enum RestaurantStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  TRIAL = 'trial',
  SUSPENDED = 'suspended',
}

export enum SubscriptionStatus {
  TRIAL = 'trial',
  ACTIVE = 'active',
  EXPIRED = 'expired',
  CANCELLED = 'cancelled',
}

@Entity('restaurant')
export class Restaurant extends BaseEntity {
  @Index()
  @Column({ type: 'varchar', unique: true })
  restaurantCode: string;

  @Column({ type: 'varchar' })
  name: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'varchar', nullable: true })
  logoUrl?: string;

  @Column({ type: 'varchar', nullable: true })
  bannerUrl?: string;

  // Address
  @Column({ type: 'jsonb', nullable: true })
  address?: {
    country?: string;
    state?: string;
    city?: string;
    streetAddress?: string;
    postalCode?: string;
    landmark?: string;
  };

  // Contact
  @Column({ type: 'jsonb', nullable: true })
  contact?: {
    phones?: string[];
    email?: string;
    website?: string;
  };

  // Location
  @Column({ type: 'jsonb', nullable: true })
  coordinates?: {
    latitude: number;
    longitude: number;
  };

  // Business Hours
  @Column({ type: 'jsonb', nullable: true })
  businessHours?: {
    [day: string]: {
      open: string;
      close: string;
      isOpen: boolean;
    };
  };

  // Rating
  @Column({ type: 'decimal', precision: 2, scale: 1, default: 0 })
  rating: number;

  @Column({ type: 'int', default: 0 })
  totalRatings: number;

  // Status
  @Column({
    type: 'enum',
    enum: RestaurantStatus,
    default: RestaurantStatus.TRIAL,
  })
  status: RestaurantStatus;

  @Column({
    type: 'enum',
    enum: SubscriptionStatus,
    default: SubscriptionStatus.TRIAL,
  })
  subscriptionStatus: SubscriptionStatus;

  @Column({ type: 'timestamp', nullable: true })
  subscriptionExpiresAt?: Date;

  // Kaha Integration Fields
  @Index()
  @Column({ type: 'varchar', nullable: true, unique: true })
  externalId?: string; // Kaha business ID

  @Column({ type: 'varchar', nullable: true })
  source?: string; // 'kaha' | 'local'

  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, any>;

  // Relations
  @ManyToOne(() => User, { nullable: false })
  @JoinColumn({ name: 'owner_id' })
  owner: User;

  @Column({ type: 'uuid' })
  ownerId: string;

  // Note: Menu and Category relations can be added later if needed
  // @OneToMany(() => MenuEntity, (menu) => menu.restaurant)
  // menus: MenuEntity[];
  
  // @OneToMany(() => CategoryEntity, (category) => category.restaurant)
  // categories: CategoryEntity[];
}
