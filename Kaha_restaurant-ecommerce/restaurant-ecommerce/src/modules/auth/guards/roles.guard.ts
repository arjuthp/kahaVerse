import {
  Injectable,
  CanActivate,
  ExecutionContext,
  Logger,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { ConfigurationService } from "configuration/configuration.service";

import { ROLES_KEY } from "common/decorator/index";
import { UserRoleEnum } from "common/enums";
import { ServiceCommunicationService } from "src/modules/service-communication/service-communication.service";

@Injectable()
export class RolesGuard implements CanActivate {
  private readonly logger = new Logger(RolesGuard.name);
  private readonly useMockAuth: boolean;

  constructor(
    private reflector: Reflector,
    private readonly serviceCommunicationService: ServiceCommunicationService,
    private readonly configService: ConfigurationService
  ) {
    this.useMockAuth = this.configService.useMockAuth;
    if (this.useMockAuth) {
      this.logger.log('🔓 Mock Auth Mode: Role verification will use JWT payload');
    } else {
      this.logger.log('🔒 Production Mode: Role verification will use external Kaha Main V3 API');
      this.logger.log(`📡 Kaha Main V3 Base URL: ${this.configService.kahaMainV3BaseURL}`);
    }
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredRoles = this.reflector.getAllAndOverride<UserRoleEnum[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()]
    );
    
    this.logger.debug(`Required roles: ${JSON.stringify(requiredRoles)}`);
    
    if (!requiredRoles) {
      return true;
    }

    const req = context.switchToHttp().getRequest();
    const userId = req.user?.id;
    const businessId = req.user?.businessId;
    
    // Extract auth token from request header
    const authHeader = req.headers?.authorization;
    const authToken = authHeader?.replace('Bearer ', '');
    
    this.logger.debug(`User ID: ${userId}, Business ID: ${businessId}`);
    
    // 🔓 MOCK AUTH MODE: Use role from JWT payload instead of external API
    if (this.useMockAuth) {
      const userRole = req.user?.role;
      this.logger.debug(`[Mock Auth] User role from JWT: ${userRole}`);
      
      if (!userRole) {
        this.logger.warn('[Mock Auth] No role found in JWT payload');
        return false;
      }
      
      const hasRole = requiredRoles.some((role) => userRole === role);
      this.logger.debug(`[Mock Auth] Has required role: ${hasRole}`);
      
      return hasRole;
    }
    
    // 🔒 PRODUCTION MODE: Verify role with external API
    if (userId && businessId) {
      const businessUserRole =
        await this.serviceCommunicationService.getBusinessUserRoles(
          businessId,
          userId,
          authToken
        );
      
      this.logger.debug(`Business user role: ${JSON.stringify(businessUserRole)}`);
      
      // Handle single 'role' object (not array) from upstream API
      const userRole = businessUserRole?.role?.name || businessUserRole?.role;
      this.logger.debug(`Comparing: ${userRole} with ${JSON.stringify(requiredRoles)}`);
      
      const hasRole = requiredRoles.some((role) => userRole === role);
      this.logger.debug(`Has required role: ${hasRole}`);
      
      return hasRole;
    }

    const user = await this.serviceCommunicationService.getUserRoles(userId, authToken);
    
    this.logger.debug(`User role: ${JSON.stringify(user)}`);
    
    const hasRole = requiredRoles.some((role) => user.role === role);
    this.logger.debug(`Has required role: ${hasRole}`);
    
    return hasRole;
  }
}
