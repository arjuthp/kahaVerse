import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ServiceCommunicationService } from '../service-communication/service-communication.service';

export interface AdminLoginResponse {
  access_token: string;
  refreshToken: string;
  user: {
    id: string;
    email: string;
    fullName: string;
    role: string;
    businessId: string;
  };
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly serviceCommunicationService: ServiceCommunicationService,
    private readonly jwtService: JwtService,
  ) {}

  /**
   * Admin Login - Validates credentials against Kaha Main V3
   */
  async adminLogin(contactNumber: string, password: string): Promise<AdminLoginResponse> {
    try {
      this.logger.log(`Attempting admin login for contact: ${contactNumber}`);
      
      // Step 1: Login to Kaha Main V3 to verify credentials
      const loginRes = await this.serviceCommunicationService.login(contactNumber, password);
      const kahaToken = loginRes.accessToken;
      
      // Step 2: Decode the Kaha token to get userId
      const payloadSegment = kahaToken.split('.')[1];
      if (!payloadSegment) {
        throw new UnauthorizedException('Invalid token received from Kaha Main V3');
      }
      const decodedPayload = JSON.parse(Buffer.from(payloadSegment, 'base64').toString('utf8'));
      const userId = decodedPayload.id;
      const kahaId = decodedPayload.kahaId;

      if (!userId) {
        throw new UnauthorizedException('User ID not found in token payload');
      }

      // Step 3: Fetch full user profile details from Kaha Main V3
      const userProfile = await this.serviceCommunicationService.getUser(userId, kahaToken);
      
      // Step 4: Retrieve business memberships for this user
      const memberships = await this.serviceCommunicationService.getBusinessUsers(kahaToken);
      
      // Find a valid business ID or default to a test one
      let businessId = '7476ee15-1407-41fa-9a49-89e0caaf945d'; // Default test business ID
      
      if (memberships && Array.isArray(memberships) && memberships.length > 0) {
        const match = memberships.find(m => m.business?.id);
        if (match) {
          businessId = match.business.id;
        }
      }

      const role = userProfile.role || loginRes.role || 'user';

      // Step 5: Sign our own JWT token containing the required payload structure
      const localPayload = {
        id: userId,
        kahaId: kahaId,
        businessId: businessId,
        role: role,
      };

      const localToken = this.jwtService.sign(localPayload);

      return {
        access_token: localToken,
        refreshToken: 'test-refresh-token',
        user: {
          id: userId,
          email: userProfile.email || '',
          fullName: userProfile.fullName || '',
          role: role,
          businessId: businessId,
        },
      };
    } catch (error) {
      this.logger.error(`Login failed: ${error.message}`);
      throw new UnauthorizedException('Invalid contact number or password');
    }
  }
}
