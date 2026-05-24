import { Module } from "@nestjs/common";
import { AddonsService } from "./addons.service";
import { AddonsController } from "./addons.controller";
import { AddonsRepository } from "src/repositories/addons.repository";
import { MenuRepository } from "src/repositories/menu.repository";

@Module({
  controllers: [AddonsController],
  providers: [AddonsService, AddonsRepository, MenuRepository],
})
export class AddonsModule {}
