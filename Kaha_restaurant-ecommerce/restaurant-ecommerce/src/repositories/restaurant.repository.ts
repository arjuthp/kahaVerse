import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { Restaurant } from '../entities/restaurant.entity';

@Injectable()
export class RestaurantRepository extends Repository<Restaurant> {
  constructor(private dataSource: DataSource) {
    super(Restaurant, dataSource.createEntityManager());
  }

  async findByCode(restaurantCode: string): Promise<Restaurant | null> {
    return this.findOne({ where: { restaurantCode } });
  }

  async findByExternalId(externalId: string): Promise<Restaurant | null> {
    return this.findOne({ where: { externalId }, relations: ['owner'] });
  }

  async findByOwnerId(ownerId: string): Promise<Restaurant[]> {
    return this.find({ where: { ownerId }, relations: ['owner'] });
  }

  async generateUniqueCode(baseName: string): Promise<string> {
    const baseCode = baseName
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, '-')
      .substring(0, 20);
    
    let code = baseCode;
    let counter = 1;
    
    while (await this.findByCode(code)) {
      code = `${baseCode}-${counter}`;
      counter++;
    }
    
    return code;
  }
}
