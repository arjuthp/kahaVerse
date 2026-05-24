import { Injectable } from "@nestjs/common";
import { EntityManager, Repository } from "typeorm";

import { CategoryEntity } from "entities/index.entity";

@Injectable()
export class CategoryRepository extends Repository<CategoryEntity> {
  constructor(private entityManager: EntityManager) {
    super(CategoryEntity, entityManager);
  }
}
