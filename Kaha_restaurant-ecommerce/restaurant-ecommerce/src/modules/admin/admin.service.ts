import { Injectable, Logger, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserRepository } from '../../repositories/user.repository';
import { CreateServiceAccountDto } from './dto/create-service-account.dto';
import { User, UserType } from '../../entities/user.entity';

@Injectable()
export class AdminService {
  private readonly logger = new Logger(AdminService.name);

  constructor(
    private readonly userRepository: UserRepository,
    private readonly jwtService: JwtService,
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
}
