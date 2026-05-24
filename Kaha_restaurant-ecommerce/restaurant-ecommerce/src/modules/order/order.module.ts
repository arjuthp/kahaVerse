import { Module } from "@nestjs/common";

import {
  AddonsRepository,
  MenuRepository,
  OrderItemAddonRepository,
  OrderItemRepository,
  OrderRepository,
  OrderStausRepository,
} from "src/repositories/index";

import { OrderController } from "order/order.controller";
import { OrderService } from "order/order.service";

@Module({
  controllers: [OrderController],
  providers: [
    OrderService,
    MenuRepository,
    AddonsRepository,
    OrderRepository,
    OrderItemRepository,
    OrderItemAddonRepository,
    OrderStausRepository,
  ],
})
export class OrderModule {}
