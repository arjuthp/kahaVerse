import { Injectable } from "@nestjs/common";
import { Repository, EntityManager } from "typeorm";

import { AddonGroupEntity } from "entities/index.entity";

@Injectable()
export class AddonGroupRepository extends Repository<AddonGroupEntity> {
  constructor(private entityManager: EntityManager) {
    super(AddonGroupEntity, entityManager);
  }
}
