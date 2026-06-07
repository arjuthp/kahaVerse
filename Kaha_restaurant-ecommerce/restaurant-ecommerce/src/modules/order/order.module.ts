import { Module } from "@nestjs/common";

import {
  AddonsRepository,
  MenuRepository,
  OrderItemAddonRepository,
  OrderItemRepository,
  OrderRepository,
  OrderStausRepository,
  MenuVariantRepository,
  CartRepository,
  CartItemRepository,
  UserRepository,
} from "src/repositories/index";

import { OrderController } from "order/order.controller";
import { OrderService } from "order/order.service";
import { LoyaltyModule } from '../loyalty/loyalty.module';

@Module({
  imports: [LoyaltyModule],
  controllers: [OrderController],
  providers: [
    OrderService,
    MenuRepository,
    AddonsRepository,
    OrderRepository,
    OrderItemRepository,
    OrderItemAddonRepository,
    OrderStausRepository,
    MenuVariantRepository,
    CartRepository,
    CartItemRepository,
    UserRepository,
  ],
})
export class OrderModule {}
