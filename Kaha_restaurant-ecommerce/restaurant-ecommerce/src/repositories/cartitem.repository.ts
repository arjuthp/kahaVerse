import { Injectable } from "@nestjs/common";
import { Repository, EntityManager } from "typeorm";

import { CartItemEntity } from "entities/index.entity";

@Injectable()
export class CartItemRepository extends Repository<CartItemEntity> {
  constructor(private entityManager: EntityManager) {
    super(CartItemEntity, entityManager);
  }
}
