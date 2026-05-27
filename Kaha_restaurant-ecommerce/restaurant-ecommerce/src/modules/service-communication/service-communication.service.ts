import { HttpService } from "@nestjs/axios";
import { Injectable, InternalServerErrorException, Logger } from "@nestjs/common";
import { ConfigurationService } from "configuration/configuration.service";
import { lastValueFrom } from "rxjs";

/**
 * Service for communicating with Kaha Main V3 API
 * Handles user, business, and role verification
 * 
 * Base URL: https://api.kaha.com.np/main/api/v3
 * Documentation: https://api.kaha.com.np/main/api/v3/docs
 */
@Injectable()
export class ServiceCommunicationService {
  private readonly logger = new Logger(ServiceCommunicationService.name);

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigurationService,
  ) {}

  /**
   * Creates HTTP headers with optional Authorization token
   * @param authToken Optional JWT token to include in Authorization header
   * @returns Headers object for HTTP requests
   */
  private createHeaders(authToken?: string): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (authToken) {
      headers['Authorization'] = `Bearer ${authToken}`;
    }

    return headers;
  }

  /**
   * Login against Kaha Main V3 API
   * 
   * API: POST /auth/login
   * @param contactNumber User contact number
   * @param password User password
   * @returns Login response containing accessToken and role
   */
  async login(contactNumber: string, password: string): Promise<any> {
    const baseUrl = this.configService.kahaMainV3BaseURL;
    const url = `${baseUrl}/auth/login`;

    try {
      const response = await lastValueFrom(
        this.httpService.post(url, {
          contactNumber,
          password,
        })
      );
      return response.data;
    } catch (error) {
      this.logger.error(
        `Failed to login to Kaha Main V3: ${error.message}`,
        error.stack
      );
      throw new InternalServerErrorException(
        "Invalid credentials or Kaha Main V3 service unavailable"
      );
    }
  }

  /**
   * Get business user role information
   * 
   * ⚠️ IMPORTANT: Upstream returns a SINGLE 'role' object, NOT an array
   * ⚠️ SECURITY: Strips 'user.password' field from response
   * 
   * @param businessId Business UUID
   * @param userId User UUID
   * @param authToken Optional JWT token for authorization
   * @returns Business user role data with password field removed
   * 
   * API: GET /business-users/{businessId}/{userId}
   * Response structure:
   * {
   *   id: string,
   *   role: { id, name, label, description },  // ← SINGLE object
   *   user: { id, fullName, kahaId, ... },
   *   createdAt, updatedAt, availability
   * }
   */
  async getBusinessUserRoles(
    businessId: string, 
    userId: string,
    authToken?: string
  ) {
    const baseUrl = this.configService.kahaMainV3BaseURL;
    const url = `${baseUrl}/business-users/${businessId}/${userId}`;

    try {
      const response = await lastValueFrom(
        this.httpService.get(url, {
          headers: this.createHeaders(authToken),
        })
      );

      // Strip password field for security (Issue #4)
      if (response.data?.user?.password) {
        delete response.data.user.password;
        this.logger.warn('Stripped password hash from business-user response');
      }

      return response.data;
    } catch (error) {
      this.logger.error(
        `Failed to fetch business user role: ${error.message}`,
        error.stack
      );
      throw new InternalServerErrorException(
        "Failed to fetch business user role"
      );
    }
  }

  /**
   * Get user information
   * 
   * ⚠️ NOTE: This endpoint returns NO role/business membership info
   * Only returns basic user data and top-level 'role' field (admin/user)
   * For actual business roles, use getBusinessUserRoles() instead
   * 
   * @param userId User UUID
   * @param authToken Optional JWT token for authorization
   * @returns User data (no business role information)
   * 
   * API: GET /users/{id}
   * Response structure:
   * {
   *   id, fullName, email, contactNumber, status, avatar,
   *   kahaId, role, firstName, lastName, dateOfBirth, gender,
   *   createdAt, hasPassword
   * }
   */
  async getUserRoles(userId: string, authToken?: string) {
    const baseUrl = this.configService.kahaMainV3BaseURL;
    const url = `${baseUrl}/users/${userId}`;

    try {
      const response = await lastValueFrom(
        this.httpService.get(url, {
          headers: this.createHeaders(authToken),
        })
      );
      return response.data;
    } catch (error) {
      this.logger.error(
        `Failed to fetch user: ${error.message}`,
        error.stack
      );
      throw new InternalServerErrorException(
        "Failed to fetch user information"
      );
    }
  }

  /**
   * Get user information (alias for getUserRoles)
   * 
   * @param userId User UUID
   * @param authToken Optional JWT token for authorization
   * @returns User data
   * 
   * API: GET /users/{id}
   */
  async getUser(userId: string, authToken?: string) {
    const baseUrl = this.configService.kahaMainV3BaseURL;
    const url = `${baseUrl}/users/${userId}`;
    
    try {
      const response = await lastValueFrom(
        this.httpService.get(url, {
          headers: this.createHeaders(authToken),
        })
      );
      return response.data;
    } catch (error) {
      this.logger.error(
        `Failed to fetch user: ${error.message}`,
        error.stack
      );
      throw new InternalServerErrorException(
        'Failed to fetch user information'
      );
    }
  }

  /**
   * Get business information
   * 
   * @param businessId Business UUID
   * @param authToken Optional JWT token for authorization
   * @returns Business data
   * 
   * API: GET /businesses/{id}
   * Optional query params: latitude, longitude, userId (not used)
   * 
   * Response structure:
   * {
   *   id, name, kahaId, tag, entity, contact, category,
   *   avatar, coverImageUrl, available, delivery, pickup,
   *   isVisible, isOfficial, hasOwnershipClaim,
   *   workingDaysAndHours, location, mapAddress, status,
   *   owner, address, geohash, businessTypes, additionalInfo,
   *   createdAt
   * }
   */
  async getBusiness(businessId: string, authToken?: string) {
    const baseUrl = this.configService.kahaMainV3BaseURL;
    const url = `${baseUrl}/businesses/${businessId}`;
    
    try {
      const response = await lastValueFrom(
        this.httpService.get(url, {
          headers: this.createHeaders(authToken),
        })
      );
      return response.data;
    } catch (error) {
      this.logger.error(
        `Failed to fetch business: ${error.message}`,
        error.stack
      );
      throw new InternalServerErrorException(
        'Failed to fetch business information'
      );
    }
  }

  /**
   * Get business user memberships for the logged-in user
   * 
   * API: GET /business-users
   * @param authToken JWT token
   * @returns Array of business user memberships
   */
  async getBusinessUsers(authToken: string): Promise<any> {
    const baseUrl = this.configService.kahaMainV3BaseURL;
    const url = `${baseUrl}/business-users`;

    try {
      const response = await lastValueFrom(
        this.httpService.get(url, {
          headers: this.createHeaders(authToken),
        })
      );
      return response.data;
    } catch (error) {
      this.logger.error(
        `Failed to fetch business users: ${error.message}`,
        error.stack
      );
      throw new InternalServerErrorException(
        "Failed to fetch business memberships"
      );
    }
  }
}
