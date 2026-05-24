import { HttpModule } from "@nestjs/axios";
import { Module } from "@nestjs/common";

import { MenuController } from "./menu.controller";
import { MenuService } from "./menu.service";

@Module({
  imports: [HttpModule],
  providers: [MenuService],
  controllers: [MenuController],
})
export class MenuModule {}
