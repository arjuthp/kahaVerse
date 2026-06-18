// ==================== OPTION B: SERVICE VALIDATES WITH KAHA MAIN V3 ====================
// This guard implements OPTION B from the architecture:
// 1. Extract JWT from request (done by JwtAuthGuard)
// 2. Call ServiceCommunicationService to validate with Kaha Main V3 (done here) ✅
// 3. Get user/business/role data from Kaha Main V3 (done here) ✅
// 4. Attach validated data to request (done here) ✅
// 5. Allow/deny based on required roles (done here) ✅
// ─────────────────────────────────────────────────────────────────────────────────

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

// ==================== SECTION 1: PURPOSE - Define Roles Guard ====================
// PURPOSE: Implement role-based access control (RBAC) by validating user roles with Kaha Main V3
// INPUT:
//   - Extracted JWT payload in request.user (from JwtAuthGuard)
//   - Required roles from @Roles() decorator on controller method
//   - Authorization header with Bearer token
// ACTIONS (Two modes):
//   A. MOCK AUTH MODE (development):
//      - Extract role from JWT payload directly
//      - Compare with required roles
//   B. PRODUCTION MODE (Option B - Kaha Main V3 validation):
//      - Call ServiceCommunicationService.getBusinessUserRoles() with JWT token
//      - Kaha Main V3 validates JWT and returns user's actual role
//      - Compare user's role from Kaha Main V3 with required roles
// CHECKS:
//   - JWT token valid (passed from JwtAuthGuard)
//   - User exists in Kaha Main V3
//   - User has required role in Kaha Main V3
//   - Configuration mode (mock vs production)
// OUTPUT:
//   - true: User authorized, request proceeds to controller
//   - false: User unauthorized, request rejected with 403
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
    // ==================== SECTION 2: PURPOSE - Extract Required Roles ====================
    // PURPOSE: Get required roles for this controller method from @Roles() decorator
    // INPUT: Controller method and class with @Roles() decorator metadata
    // ACTIONS: Use Reflector to retrieve ROLES_KEY metadata from handler and class
    // CHECKS: Metadata exists
    // OUTPUT: Array of required roles or undefined
    const requiredRoles = this.reflector.getAllAndOverride<UserRoleEnum[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()]
    );
    
    this.logger.debug(`Required roles: ${JSON.stringify(requiredRoles)}`);
    
    // If no roles required, allow all authenticated users
    if (!requiredRoles) {
      return true;
    }

    const req = context.switchToHttp().getRequest();
    const userId = req.user?.id;
    const businessId = req.user?.businessId;
    
    // ==================== SECTION 3: PURPOSE - Extract JWT Token ====================
    // PURPOSE: Extract JWT token from Authorization header for Kaha Main V3 validation
    // INPUT: HTTP Authorization header with format "Bearer <JWT>"
    // ACTIONS: Parse header, remove "Bearer " prefix
    // CHECKS: Header exists and formatted correctly
    // OUTPUT: JWT token string or undefined
    const authHeader = req.headers?.authorization;
    const authToken = authHeader?.replace('Bearer ', '');
    
    this.logger.debug(`User ID: ${userId}, Business ID: ${businessId}`);
    
    // ==================== SECTION 4: PURPOSE - MOCK AUTH MODE (Development) ====================
    // PURPOSE: Validate roles using JWT payload (faster, no external calls)
    // INPUT: User role from decoded JWT in request.user
    // ACTIONS:
    //   1. Extract role from JWT payload
    //   2. Compare with required roles
    //   3. Return result
    // CHECKS: Role exists in JWT
    // OUTPUT: true if user has required role, false otherwise
    // NOTE: Only use in development! Not production-safe (JWT could be tampered with)
    if (this.useMockAuth) {
      const userRole = req.user?.role;
      this.logger.debug(`[Mock Auth] User role from JWT: ${userRole}`);
      
      if (!userRole) {
        this.logger.warn('[Mock Auth] No role found in JWT payload');
        return false;
      }
      
      let hasRole = requiredRoles.some((role) => userRole?.toLowerCase() === role?.toLowerCase());
      
      // Global admin override
      if (!hasRole && (userRole?.toLowerCase() === 'admin' || userRole?.toLowerCase() === 'super_admin')) {
        this.logger.debug(`[Mock Auth] Granting access via global admin override`);
        hasRole = true;
      }
      
      this.logger.debug(`[Mock Auth] Has required role: ${hasRole}`);
      
      return hasRole;
    }
    
    // ==================== SECTION 5: PURPOSE - PRODUCTION MODE (Option B - Kaha Main V3 Validation) ====================
    // PURPOSE: Validate user role by calling Kaha Main V3 API with JWT token
    // INPUT:
    //   - businessId and userId from JWT payload
    //   - JWT token from Authorization header
    // ACTIONS:
    //   1. Call ServiceCommunicationService.getBusinessUserRoles(businessId, userId, JWT)
    //   2. Kaha Main V3 validates JWT and returns user's role
    //   3. Extract role name from response
    //   4. Compare with required roles
    //   5. Return result
    // CHECKS:
    //   - Kaha Main V3 accepts JWT (user exists and authorized)
    //   - Role information returned from Kaha Main V3
    // OUTPUT: true if user has required role, false otherwise or error
    // NOTE: This is Option B - validates against source of truth (Kaha Main V3)
    if (userId && businessId) {
      const businessUserRole =
        await this.serviceCommunicationService.getBusinessUserRoles(
          businessId,
          userId,
          authToken
        );
      
      this.logger.debug(`Business user role: ${JSON.stringify(businessUserRole)}`);
      
      // Handle single 'role' object (not array) from upstream API, fallback to JWT role
      const userRole = businessUserRole?.role?.name || businessUserRole?.role || req.user?.role;
      this.logger.debug(`Comparing: ${userRole} with ${JSON.stringify(requiredRoles)}`);
      
      let hasRole = requiredRoles.some((role) => userRole?.toLowerCase() === role?.toLowerCase());
      
      // Global admin override
      if (!hasRole && (req.user?.role?.toLowerCase() === 'admin' || req.user?.role?.toLowerCase() === 'super_admin' || userRole?.toLowerCase() === 'admin' || userRole?.toLowerCase() === 'super_admin')) {
        this.logger.debug(`Granting access via global admin override`);
        hasRole = true;
      }
      
      this.logger.debug(`Has required role: ${hasRole}`);
      
      return hasRole;
    }

    // ==================== SECTION 6: PURPOSE - Fallback: Get User Role Only ====================
    // PURPOSE: If businessId not available, validate user role without business context
    // INPUT: userId and JWT token
    // ACTIONS: Call getUser() to get basic user role from Kaha Main V3
    // CHECKS: User exists in Kaha Main V3
    // OUTPUT: User data with role
    const user = await this.serviceCommunicationService.getUserRoles(userId, authToken);
    
    this.logger.debug(`User role: ${JSON.stringify(user)}`);
    
    let hasRole = requiredRoles.some((role) => user?.role?.toLowerCase() === role?.toLowerCase());
    
    // Global admin override
    if (!hasRole && (user?.role?.toLowerCase() === 'admin' || user?.role?.toLowerCase() === 'super_admin' || req.user?.role?.toLowerCase() === 'admin' || req.user?.role?.toLowerCase() === 'super_admin')) {
      this.logger.debug(`Granting access via global admin override`);
      hasRole = true;
    }
    
    this.logger.debug(`Has required role: ${hasRole}`);
    
    return hasRole;
  }
}
