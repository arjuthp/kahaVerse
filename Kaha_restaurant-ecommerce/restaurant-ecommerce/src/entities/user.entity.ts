import { Entity, Column, Index, OneToMany } from 'typeorm';
import { BaseEntity } from './base.entity';
import { Exclude } from 'class-transformer';

export enum UserType {
  CUSTOMER = 'customer',
  RESTAURANT_OWNER = 'restaurant_owner',
  ADMIN = 'admin',
  SERVICE_ACCOUNT = 'service_account',
}

export enum AuthProvider {
  LOCAL = 'local',
  GOOGLE = 'google',
  FACEBOOK = 'facebook',
  KAHA = 'kaha',
}

@Entity('user')
export class User extends BaseEntity {
  @Index()
  @Column({ type: 'varchar', unique: true })
  phone: string;

  @Column({ type: 'varchar', nullable: true })
  firstName?: string;

  @Column({ type: 'varchar', nullable: true })
  lastName?: string;

  @Column({ type: 'varchar', unique: true, nullable: true })
  email?: string;

  @Exclude()
  @Column({ type: 'varchar', nullable: true })
  password?: string;

  @Column({
    type: 'enum',
    enum: UserType,
    default: UserType.CUSTOMER,
  })
  userType: UserType;

  @Column({
    type: 'enum',
    enum: AuthProvider,
    default: AuthProvider.LOCAL,
  })
  authProvider: AuthProvider;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @Column({ type: 'boolean', default: false })
  isEmailVerified: boolean;

  @Column({ type: 'boolean', default: false })
  isPhoneVerified: boolean;

  // Kaha Integration Fields
  @Index()
  @Column({ type: 'varchar', nullable: true, unique: true })
  externalId?: string; // Kaha user ID

  @Column({ type: 'varchar', nullable: true })
  source?: string; // 'kaha' | 'local'

  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, any>;

  // Service Account Fields (for Kaha authentication)
  @Column({ type: 'varchar', nullable: true })
  serviceAccountName?: string;

  @Column({ type: 'timestamp', nullable: true })
  tokenExpiresAt?: Date;
}
