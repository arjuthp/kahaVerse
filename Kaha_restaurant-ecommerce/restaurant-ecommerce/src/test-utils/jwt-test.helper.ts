import * as jwt from 'jsonwebtoken';
import { UserRoleEnum } from 'common/enums';

/**
 * JWT Test Helper
 * Generates valid JWT tokens for testing
 */

export class JwtTestHelper {
  private static readonly SECRET = process.env.JWT_SECRET || 'test-secret-key';
  private static readonly EXPIRES_IN = '1h';

  /**
   * Generate a valid JWT token for testing
   */
  static generateToken(payload: {
    id: string;
    kahaId: string;
    businessId: string;
    email: string;
    role: UserRoleEnum;
  }): string {
    return jwt.sign(payload, this.SECRET, { expiresIn: this.EXPIRES_IN });
  }

  /**
   * Generate admin token
   */
  static generateAdminToken(): string {
    return this.generateToken({
      id: 'admin-mock-001',
      kahaId: 'kaha-admin-001',
      businessId: 'biz-mock-001',
      email: 'admin@test.com',
      role: UserRoleEnum.BUSINESS_SUPER_ADMIN,
    });
  }

  /**
   * Generate owner token
   */
  static generateOwnerToken(): string {
    return this.generateToken({
      id: 'owner-mock-001',
      kahaId: 'kaha-owner-001',
      businessId: 'biz-mock-001',
      email: 'owner@test.com',
      role: UserRoleEnum.ADMIN,
    });
  }

  /**
   * Generate regular user token
   */
  static generateUserToken(): string {
    return this.generateToken({
      id: 'user-mock-001',
      kahaId: 'kaha-user-001',
      businessId: 'biz-mock-001',
      email: 'user@test.com',
      role: UserRoleEnum.USER,
    });
  }

  /**
   * Decode token without verification (for testing)
   */
  static decodeToken(token: string): any {
    return jwt.decode(token);
  }

  /**
   * Verify token
   */
  static verifyToken(token: string): any {
    return jwt.verify(token, this.SECRET);
  }

  /**
   * Generate expired token for testing
   */
  static generateExpiredToken(): string {
    return jwt.sign(
      {
        id: 'admin-mock-001',
        kahaId: 'kaha-admin-001',
        businessId: 'biz-mock-001',
        email: 'admin@test.com',
        role: UserRoleEnum.BUSINESS_SUPER_ADMIN,
      },
      this.SECRET,
      { expiresIn: '-1h' } // Already expired
    );
  }

  /**
   * Generate token with custom expiry
   */
  static generateTokenWithExpiry(expiresIn: string): string {
    return jwt.sign(
      {
        id: 'admin-mock-001',
        kahaId: 'kaha-admin-001',
        businessId: 'biz-mock-001',
        email: 'admin@test.com',
        role: UserRoleEnum.BUSINESS_SUPER_ADMIN,
      },
      this.SECRET,
      { expiresIn }
    );
  }
}
