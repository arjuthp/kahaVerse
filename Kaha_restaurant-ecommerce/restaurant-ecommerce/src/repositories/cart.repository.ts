import { Injectable } from "@nestjs/common";
import { Repository, EntityManager } from "typeorm";

import { CartEntity } from "entities/index.entity";

@Injectable()
export class CartRepository extends Repository<CartEntity> {
  constructor(private entityManager: EntityManager) {
    super(CartEntity, entityManager);
  }
}
