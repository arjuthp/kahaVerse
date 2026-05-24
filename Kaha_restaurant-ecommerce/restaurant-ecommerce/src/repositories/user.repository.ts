import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { User } from '../entities/user.entity';

@Injectable()
export class UserRepository extends Repository<User> {
  constructor(private dataSource: DataSource) {
    super(User, dataSource.createEntityManager());
  }

  async findByPhone(phone: string): Promise<User | null> {
    return this.findOne({ where: { phone } });
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.findOne({ where: { email } });
  }

  async findByExternalId(externalId: string): Promise<User | null> {
    return this.findOne({ where: { externalId } });
  }

  async findServiceAccountByName(name: string): Promise<User | null> {
    return this.findOne({
      where: {
        serviceAccountName: name,
        userType: 'service_account' as any,
      },
    });
  }
}
