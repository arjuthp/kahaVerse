// ==================== SECTION 1: PURPOSE - Import Service Account Guard Dependencies ====================
// PURPOSE: Import NestJS core, JWT service, and repository for service account validation
// INPUT: Guard dependencies and database access
// ACTIONS: Load required modules
// CHECKS: All imports available
// OUTPUT: Dependencies ready for service account guard
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

// ==================== SECTION 2: PURPOSE - Validate Service-to-Service Authentication ====================
// PURPOSE: Guard that validates service account tokens for service-to-service communication
// INPUT: HTTP request with Bearer token in Authorization header
// ACTIONS:
//   1. Extract JWT token from Authorization header
//   2. Verify JWT signature using JwtService
//   3. Check token type is 'service_account'
//   4. Look up service account in database by token payload
//   5. Verify service account is active
//   6. Verify token has not expired
//   7. Attach service account to request
// CHECKS:
//   - Bearer token present in Authorization header
//   - JWT signature valid
//   - Token type is 'service_account'
//   - Service account exists in database
//   - Service account is active
//   - Token has not expired
// OUTPUT:
//   - true: Service account authenticated, request.serviceAccount populated, request proceeds
//   - false/exception: Service account invalid, request rejected with 401
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
      // ==================== SECTION 3: PURPOSE - Verify JWT Token Signature ====================
      // PURPOSE: Verify JWT token is valid and signed with JWT_SECRET_TOKEN
      // INPUT: JWT token from Authorization header
      // ACTIONS: Use JwtService to verify and decode JWT
      // CHECKS: Token signature valid, token not expired
      // OUTPUT: Decoded JWT payload
      const payload = this.jwtService.verify(token);

      // ==================== SECTION 4: PURPOSE - Validate Token Type ====================
      // PURPOSE: Ensure token is for service account, not regular user
      // INPUT: Decoded JWT payload
      // ACTIONS: Check payload.type === 'service_account'
      // CHECKS: Token type matches expected value
      // OUTPUT: Continue if valid, throw if not
      if (payload.type !== 'service_account') {
        throw new UnauthorizedException('Invalid service account token');
      }

      // ==================== SECTION 5: PURPOSE - Look Up Service Account in Database ====================
      // PURPOSE: Verify service account exists and is authorized in local database
      // INPUT: Service account ID from JWT payload
      // ACTIONS: Query UserRepository for service account by ID and type
      // CHECKS: Service account found, has correct UserType
      // OUTPUT: Service account record from database
      const serviceAccount = await this.userRepository.findOne({
        where: {
          id: payload.sub,
          userType: UserType.SERVICE_ACCOUNT,
        },
      });

      if (!serviceAccount) {
        throw new UnauthorizedException('Service account not found');
      }

      // ==================== SECTION 6: PURPOSE - Verify Service Account Active ====================
      // PURPOSE: Ensure service account is not disabled
      // INPUT: Service account record from database
      // ACTIONS: Check isActive flag
      // CHECKS: Service account is active
      // OUTPUT: Continue if active, throw if inactive
      if (!serviceAccount.isActive) {
        throw new UnauthorizedException('Service account is inactive');
      }

      // ==================== SECTION 7: PURPOSE - Check Token Expiration ====================
      // PURPOSE: Ensure service account token has not expired
      // INPUT: Service account record with tokenExpiresAt field
      // ACTIONS: Compare current time with tokenExpiresAt
      // CHECKS: Current time before token expiration time
      // OUTPUT: Continue if not expired, throw if expired
      if (serviceAccount.tokenExpiresAt && new Date() > serviceAccount.tokenExpiresAt) {
        throw new UnauthorizedException('Service account token expired');
      }

      // ==================== SECTION 8: PURPOSE - Attach Service Account to Request ====================
      // PURPOSE: Make authenticated service account available to controller
      // INPUT: Validated service account record
      // ACTIONS: Set request.serviceAccount = serviceAccount
      // CHECKS: Request object exists
      // OUTPUT: Service account attached to request for use in controller
      request.serviceAccount = serviceAccount;

      this.logger.log(`Service account authenticated: ${serviceAccount.serviceAccountName}`);

      return true;
    } catch (error) {
      this.logger.error(`Service account authentication failed: ${error.message}`);
      throw new UnauthorizedException('Invalid or expired service account token');
    }
  }
}

