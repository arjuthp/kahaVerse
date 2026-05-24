import { Injectable } from "@nestjs/common";
import { Repository, EntityManager } from "typeorm";

import { OrderStatusEntity } from "entities/index.entity";

@Injectable()
export class OrderStausRepository extends Repository<OrderStatusEntity> {
  constructor(private entityManager: EntityManager) {
    super(OrderStatusEntity, entityManager);
  }
}
