import { Injectable } from "@nestjs/common";
import { Repository, EntityManager } from "typeorm";

import { MenuEntity } from "entities/menu.entity";

@Injectable()
export class MenuRepository extends Repository<MenuEntity> {
  constructor(private entityManager: EntityManager) {
    super(MenuEntity, entityManager);
  }
}
