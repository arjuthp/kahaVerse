import { Module } from '@nestjs/common';
import { AddonGroupsController } from './addon-groups.controller';
import { AddonGroupsService } from './addon-groups.service';

@Module({
  controllers: [AddonGroupsController],
  providers: [AddonGroupsService],
})
export class AddonGroupsModule {}
