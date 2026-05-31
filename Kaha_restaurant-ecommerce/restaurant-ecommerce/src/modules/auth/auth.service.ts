import { Injectable, UnauthorizedException, ConflictException, BadRequestException, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { ServiceCommunicationService } from '../service-communication/service-communication.service';
import { UserRepository } from 'src/repositories';
import { UserType, AuthProvider } from '../../entities/user.entity';

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

export interface CustomerRegisterDto {
  fullName: string;
  contactNumber: string;
  email?: string;
  password: string;
}

export interface CustomerLoginDto {
  contactNumber: string;
  password: string;
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly serviceCommunicationService: ServiceCommunicationService,
    private readonly jwtService: JwtService,
    private readonly userRepository: UserRepository,
  ) {}

  /**
   * Customer Register — stores user in local kaha_restaurant_db, no OTP needed
   */
  async customerRegister(dto: CustomerRegisterDto): Promise<any> {
    const { fullName, contactNumber, email, password } = dto;

    // Check if phone already exists
    const existing = await this.userRepository.findByPhone(contactNumber);
    if (existing) {
      throw new ConflictException('Contact number already registered');
    }

    // Check email if provided
    if (email) {
      const existingEmail = await this.userRepository.findByEmail(email);
      if (existingEmail) {
        throw new ConflictException('Email address already registered');
      }
    }

    if (!password || password.length < 6) {
      throw new BadRequestException('Password must be at least 6 characters');
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const nameParts = fullName?.trim().split(' ') || [];
    const firstName = nameParts[0] || fullName;
    const lastName = nameParts.slice(1).join(' ') || undefined;

    const user = await this.userRepository.save({
      phone: contactNumber,
      email: email || undefined,
      firstName,
      lastName,
      password: hashedPassword,
      userType: UserType.CUSTOMER,
      authProvider: AuthProvider.LOCAL,
      isActive: true,
    });

    const token = this.jwtService.sign({
      id: user.id,
      phone: user.phone,
      role: 'user',
    });

    return {
      access_token: token,
      user: {
        id: user.id,
        email: user.email || '',
        fullName: `${user.firstName || ''} ${user.lastName || ''}`.trim(),
        role: 'user',
        contactNumber: user.phone,
      },
    };
  }

  /**
   * Customer Login — validates against local kaha_restaurant_db, no OTP needed
   */
  async customerLogin(dto: CustomerLoginDto): Promise<any> {
    const { contactNumber, password } = dto;

    // Support login by email too
    let user = await this.userRepository.findByPhone(contactNumber);
    if (!user && contactNumber.includes('@')) {
      user = await this.userRepository.findByEmail(contactNumber);
    }

    if (!user || !user.password) {
      throw new UnauthorizedException('Invalid contact number or password');
    }

    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      throw new UnauthorizedException('Invalid contact number or password');
    }

    const token = this.jwtService.sign({
      id: user.id,
      phone: user.phone,
      role: 'user',
    });

    return {
      accessToken: token,
      role: 'user',
      user: {
        id: user.id,
        email: user.email || '',
        fullName: `${user.firstName || ''} ${user.lastName || ''}`.trim(),
        role: 'user',
        contactNumber: user.phone,
      },
    };
  }



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

      // Step 3: Fetch full user profile details from Kaha Main V3 (with fallback)
      let userProfile: any = {};
      try {
        userProfile = await this.serviceCommunicationService.getUser(userId, kahaToken);
      } catch (err) {
        this.logger.warn(`Failed to fetch user profile details from Kaha Main V3: ${err.message}`);
      }
      
      // Step 4: Retrieve business memberships for this user (with fallback)
      let memberships = [];
      try {
        memberships = await this.serviceCommunicationService.getBusinessUsers(kahaToken);
      } catch (err) {
        this.logger.warn(`Failed to fetch business memberships from Kaha Main V3: ${err.message}`);
      }
      
      // Find a valid business ID or default to a test one
      let businessId = '7476ee15-1407-41fa-9a49-89e0caaf945d'; // Default test business ID
      
      if (memberships && Array.isArray(memberships) && memberships.length > 0) {
        const match = memberships.find(m => m.business?.id);
        if (match) {
          businessId = match.business.id;
        }
      }

      const role = userProfile?.role || loginRes.role || 'user';

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
