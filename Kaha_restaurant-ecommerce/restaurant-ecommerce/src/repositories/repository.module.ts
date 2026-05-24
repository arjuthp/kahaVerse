import { Global, Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

import {
  AddOnEntity,
  CartEntity,
  CartItemAddOnsEntity,
  CartItemEntity,
  CategoryEntity,
  MenuEntity,
  OrderItemAddonEntity,
  OrderItemEntity,
  OrderStatusEntity,
  MenuVariantEntity,
  AddonGroupEntity,
} from "entities/index.entity";
import {
  AddonsRepository,
  CartItemAddOnsRepository,
  CartItemRepository,
  CartRepository,
  CategoryRepository,
  MenuRatingRepository,
  MenuRepository,
  OrderItemRepository,
  OrderItemAddonRepository,
  OrderRepository,
  OrderStausRepository,
  MenuVariantRepository,
  AddonGroupRepository,
} from "./index";
import { MenuRatingEntity } from "entities/menu-rating.entity";
import { User } from "../entities/user.entity";
import { Restaurant } from "../entities/restaurant.entity";
import { UserRepository } from "./user.repository";
import { RestaurantRepository } from "./restaurant.repository";

@Global()
@Module({
  imports: [
    TypeOrmModule.forFeature([
      CategoryEntity,
      MenuEntity,
      AddOnEntity,
      CartEntity,
      CartItemEntity,
      CartItemAddOnsEntity,
      OrderRepository,
      OrderItemEntity,
      OrderItemAddonEntity,
      OrderStatusEntity,
      MenuRatingEntity,
      MenuVariantEntity,
      AddonGroupEntity,
      User,
      Restaurant,
    ]),
  ],
  providers: [
    CategoryRepository,
    MenuRepository,
    AddonsRepository,
    CartRepository,
    CartItemRepository,
    CartItemAddOnsRepository,
    OrderRepository,
    OrderItemRepository,
    OrderItemAddonRepository,
    OrderStausRepository,
    MenuRatingRepository,
    MenuVariantRepository,
    AddonGroupRepository,
    UserRepository,
    RestaurantRepository,
  ],
  exports: [
    CategoryRepository,
    MenuRepository,
    AddonsRepository,
    CartRepository,
    CartItemRepository,
    CartItemAddOnsRepository,
    OrderRepository,
    OrderItemRepository,
    OrderItemAddonRepository,
    OrderStausRepository,
    MenuRatingRepository,
    MenuVariantRepository,
    AddonGroupRepository,
    UserRepository,
    RestaurantRepository,
  ],
})
export class RepositoryModule {}
