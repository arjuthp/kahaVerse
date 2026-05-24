import { Module } from '@nestjs/common';
import { MenuRatingService } from './menu-rating.service';
import { MenuRatingController } from './menu-rating.controller';

@Module({
  controllers: [MenuRatingController],
  providers: [MenuRatingService],
})
export class MenuRatingModule {}
