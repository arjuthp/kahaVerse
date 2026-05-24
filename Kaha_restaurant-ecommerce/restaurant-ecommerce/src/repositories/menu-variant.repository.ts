import { Injectable } from "@nestjs/common";
import { Repository, EntityManager } from "typeorm";

import { MenuVariantEntity } from "entities/index.entity";

@Injectable()
export class MenuVariantRepository extends Repository<MenuVariantEntity> {
  constructor(private entityManager: EntityManager) {
    super(MenuVariantEntity, entityManager);
  }
}
