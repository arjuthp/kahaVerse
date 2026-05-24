import { Injectable } from '@nestjs/common';
import { EntityManager, Repository } from 'typeorm';
import { MenuRatingEntity } from '../entities/menu-rating.entity';

@Injectable()
export class MenuRatingRepository extends Repository<MenuRatingEntity> {
  constructor(private entityManager: EntityManager) {
    super(MenuRatingEntity, entityManager);
  }
}