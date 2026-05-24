import { Injectable } from "@nestjs/common";
import { CartItemAddOnsEntity } from "entities/cart-item-addons.entity";
import { Repository, EntityManager } from "typeorm";

@Injectable()
export class CartItemAddOnsRepository extends Repository<CartItemAddOnsEntity> {
  constructor(private entityManager: EntityManager) {
    super(CartItemAddOnsEntity, entityManager);
  }
}
