import { Injectable } from "@nestjs/common";
import { AddOnEntity } from "entities/index.entity";
import { Repository, EntityManager } from "typeorm";

@Injectable()
export class AddonsRepository extends Repository<AddOnEntity> {
  constructor(private entityManager: EntityManager) {
    super(AddOnEntity, entityManager);
  }
}
