import { Injectable, Logger, ConflictException, BadRequestException, NotFoundException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { UserRepository } from '../../repositories/user.repository';
import { CreateServiceAccountDto } from './dto/create-service-account.dto';
import { User, UserType } from '../../entities/user.entity';
import { RestaurantTableEntity } from '../../entities/restaurant-table.entity';
import { CreateTableDto } from './dto/create-table.dto';
import { UpdateTableDto } from './dto/update-table.dto';

@Injectable()
export class AdminService {
  private readonly logger = new Logger(AdminService.name);

  constructor(
    private readonly userRepository: UserRepository,
    private readonly jwtService: JwtService,
    @InjectRepository(RestaurantTableEntity)
    private readonly tableRepository: Repository<RestaurantTableEntity>,
  ) {}

  async createServiceAccount(dto: CreateServiceAccountDto) {
    this.logger.log(`Creating service account: ${dto.name}`);

    // Check if service account with same name exists
    const existing = await this.userRepository.findServiceAccountByName(dto.name);
    if (existing) {
      throw new ConflictException(`Service account with name "${dto.name}" already exists`);
    }

    // Calculate expiration date
    const validityDays = dto.validityDays || 365;
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + validityDays);

    // Create service account user
    const serviceAccount = this.userRepository.create({
      phone: `service-${Date.now()}`, // Unique placeholder phone
      serviceAccountName: dto.name,
      userType: UserType.SERVICE_ACCOUNT,
      isActive: true,
      tokenExpiresAt: expiresAt,
      metadata: {
        description: dto.description,
        createdAt: new Date().toISOString(),
      },
    });

    const savedAccount = await this.userRepository.save(serviceAccount);

    // Generate JWT token
    const token = this.jwtService.sign(
      {
        sub: savedAccount.id,
        type: 'service_account',
        name: dto.name,
      },
      {
        expiresIn: `${validityDays}d`,
      },
    );

    this.logger.log(`Service account created: ${savedAccount.id}`);

    return {
      id: savedAccount.id,
      name: dto.name,
      description: dto.description,
      token,
      expiresAt: expiresAt.toISOString(),
      message: 'Service account created successfully. Store this token securely - it will not be shown again.',
    };
  }

  async listServiceAccounts() {
    const accounts = await this.userRepository.find({
      where: { userType: UserType.SERVICE_ACCOUNT },
      select: ['id', 'serviceAccountName', 'isActive', 'tokenExpiresAt', 'createdAt', 'metadata'],
    });

    return accounts.map((account) => ({
      id: account.id,
      name: account.serviceAccountName,
      description: account.metadata?.description,
      isActive: account.isActive,
      expiresAt: account.tokenExpiresAt,
      createdAt: account.createdAt,
    }));
  }

  async deactivateServiceAccount(id: string) {
    const account = await this.userRepository.findOne({
      where: { id, userType: UserType.SERVICE_ACCOUNT },
    });

    if (!account) {
      throw new ConflictException('Service account not found');
    }

    account.isActive = false;
    await this.userRepository.save(account);

    this.logger.log(`Service account deactivated: ${id}`);

    return {
      id: account.id,
      name: account.serviceAccountName,
      isActive: false,
      message: 'Service account deactivated successfully',
    };
  }

  async listCustomers(page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;

    const [users, totalCount] = await this.userRepository.findAndCount({
      where: { userType: UserType.CUSTOMER },
      order: { createdAt: 'DESC' },
      skip,
      take: limit,
    });

    const data = users.map((u) => ({
      id: u.id,
      name: `${u.firstName || ''} ${u.lastName || ''}`.trim() || 'Kaha Customer',
      email: u.email || '',
      phone: u.phone || '—',
      role: u.userType,
      isActive: u.isActive,
      createdAt: u.createdAt,
    }));

    return {
      data,
      metaData: {
        currentPage: page,
        totalPages: Math.ceil(totalCount / limit),
        totalCount,
        perPage: limit,
      },
    };
  }

  async createTable(businessId: string, dto: CreateTableDto) {
    const existing = await this.tableRepository.findOne({
      where: { businessId, tableNumber: dto.tableNumber },
    });
    if (existing) {
      throw new BadRequestException(
        `Table "${dto.tableNumber}" already exists for this business.`
      );
    }
    const table = this.tableRepository.create({ ...dto, businessId });
    return this.tableRepository.save(table);
  }

  async getTables(businessId: string) {
    return this.tableRepository.find({
      where: { businessId },
      order: { tableNumber: "ASC" },
    });
  }

  async getActiveTables(businessId: string) {
    return this.tableRepository.find({
      where: { businessId, isActive: true },
      order: { tableNumber: "ASC" },
    });
  }

  async updateTable(businessId: string, tableId: string, dto: UpdateTableDto) {
    const table = await this.tableRepository.findOne({
      where: { id: tableId, businessId },
    });
    if (!table) {
      throw new NotFoundException("Table not found.");
    }
    Object.assign(table, dto);
    return this.tableRepository.save(table);
  }

  async deleteTable(businessId: string, tableId: string) {
    const table = await this.tableRepository.findOne({
      where: { id: tableId, businessId },
    });
    if (!table) {
      throw new NotFoundException("Table not found.");
    }
    await this.tableRepository.remove(table);
    return { message: "Table deleted successfully." };
  }
}
