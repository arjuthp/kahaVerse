import { Module } from "@nestjs/common";

import { CartService } from "./cart.service";
import { CartController } from "./cart.controller";

import {
  CartItemAddOnsRepository,
  CartItemRepository,
  CartRepository,
} from "src/repositories/index";

@Module({
  controllers: [CartController],
  providers: [
    CartService,
    CartRepository,
    CartItemRepository,
    CartItemAddOnsRepository,
  ],
})
export class CartModule {}
