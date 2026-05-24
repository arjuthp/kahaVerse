import * as jwt from 'jsonwebtoken';
import { UserRoleEnum } from '../../src/common/enums';

/**
 * E2E Test Auth Helper
 * Generates valid JWT tokens for E2E testing
 */

export class E2EAuthHelper {
  private static readonly SECRET = process.env.JWT_SECRET_TOKEN || 'test-secret-key-for-e2e-tests';

  /**
   * Generate admin token for E2E tests
   */
  static generateAdminToken(): string {
    return jwt.sign(
      {
        id: 'admin-mock-001',
        kahaId: 'kaha-admin-001',
        businessId: 'biz-mock-001',
        email: 'admin@test.com',
        role: UserRoleEnum.BUSINESS_SUPER_ADMIN,
      },
      this.SECRET,
      { expiresIn: '1h' }
    );
  }

  /**
   * Generate user token for E2E tests
   */
  static generateUserToken(): string {
    return jwt.sign(
      {
        id: 'user-mock-001',
        kahaId: 'kaha-mock-001',
        businessId: 'biz-mock-001',
        email: 'user@test.com',
        role: UserRoleEnum.USER,
      },
      this.SECRET,
      { expiresIn: '1h' }
    );
  }

  /**
   * Generate custom token
   */
  static generateCustomToken(payload: {
    id: string;
    kahaId: string;
    businessId: string;
    email: string;
    role: UserRoleEnum;
  }): string {
    return jwt.sign(payload, this.SECRET, { expiresIn: '1h' });
  }

  /**
   * Get authorization header
   */
  static getAuthHeader(token?: string): { Authorization: string } {
    const authToken = token || this.generateAdminToken();
    return { Authorization: `Bearer ${authToken}` };
  }
}
