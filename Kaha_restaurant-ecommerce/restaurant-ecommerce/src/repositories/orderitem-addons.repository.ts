import { Injectable } from "@nestjs/common";
import { Repository, EntityManager } from "typeorm";

import { OrderItemAddonEntity } from "entities/index.entity";

@Injectable()
export class OrderItemAddonRepository extends Repository<OrderItemAddonEntity> {
  constructor(private entityManager: EntityManager) {
    super(OrderItemAddonEntity, entityManager);
  }
}
