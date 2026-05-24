import { Injectable } from "@nestjs/common";
import { Repository, EntityManager } from "typeorm";

import { OrderEntity } from "../entities/index.entity";

@Injectable()
export class OrderRepository extends Repository<OrderEntity> {
  constructor(private entityManager: EntityManager) {
    super(OrderEntity, entityManager);
  }
}
