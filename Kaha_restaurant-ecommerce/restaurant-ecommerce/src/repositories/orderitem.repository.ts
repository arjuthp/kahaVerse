import { Injectable } from "@nestjs/common";
import { Repository, EntityManager } from "typeorm";

import { OrderItemEntity } from "../entities/index.entity";

@Injectable()
export class OrderItemRepository extends Repository<OrderItemEntity> {
  constructor(private entityManager: EntityManager) {
    super(OrderItemEntity, entityManager);
  }
}
