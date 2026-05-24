import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserRepository } from '../../../repositories/user.repository';
import { UserType } from '../../../entities/user.entity';

@Injectable()
export class ServiceAccountGuard implements CanActivate {
  private readonly logger = new Logger(ServiceAccountGuard.name);

  constructor(
    private readonly jwtService: JwtService,
    private readonly userRepository: UserRepository,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('Service account token required');
    }

    const token = authHeader.substring(7);

    try {
      // Verify JWT token
      const payload = this.jwtService.verify(token);

      // Check if it's a service account token
      if (payload.type !== 'service_account') {
        throw new UnauthorizedException('Invalid service account token');
      }

      // Find service account user
      const serviceAccount = await this.userRepository.findOne({
        where: {
          id: payload.sub,
          userType: UserType.SERVICE_ACCOUNT,
        },
      });

      if (!serviceAccount) {
        throw new UnauthorizedException('Service account not found');
      }

      if (!serviceAccount.isActive) {
        throw new UnauthorizedException('Service account is inactive');
      }

      // Check token expiration
      if (serviceAccount.tokenExpiresAt && new Date() > serviceAccount.tokenExpiresAt) {
        throw new UnauthorizedException('Service account token expired');
      }

      // Attach service account to request
      request.serviceAccount = serviceAccount;

      this.logger.log(`Service account authenticated: ${serviceAccount.serviceAccountName}`);

      return true;
    } catch (error) {
      this.logger.error(`Service account authentication failed: ${error.message}`);
      throw new UnauthorizedException('Invalid or expired service account token');
    }
  }
}
