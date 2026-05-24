import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { KahaSyncController } from './kaha-sync.controller';
import { KahaSyncService } from './kaha-sync.service';
import { User } from '../../entities/user.entity';
import { Restaurant } from '../../entities/restaurant.entity';
import { UserRepository } from '../../repositories/user.repository';
import { RestaurantRepository } from '../../repositories/restaurant.repository';
import { ServiceAccountGuard } from './guards/service-account.guard';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Restaurant]),
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'your-secret-key',
      signOptions: { expiresIn: '365d' }, // Service account tokens are long-lived
    }),
  ],
  controllers: [KahaSyncController],
  providers: [
    KahaSyncService,
    UserRepository,
    RestaurantRepository,
    ServiceAccountGuard,
  ],
  exports: [KahaSyncService],
})
export class KahaSyncModule {}
