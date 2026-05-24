import { Test, TestingModule } from '@nestjs/testing';
import { JwtStrategy } from '../strategy/jwt.strategy';
import { ConfigurationService } from 'configuration/configuration.service';
import { MockDataFactory } from '../../../test-utils';

describe('JwtStrategy', () => {
  let strategy: JwtStrategy;
  let configService: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JwtStrategy,
        {
          provide: ConfigurationService,
          useValue: {
            jwtSecret: 'test-secret-key',
          },
        },
      ],
    }).compile();

    strategy = module.get<JwtStrategy>(JwtStrategy);
    configService = module.get<ConfigurationService>(ConfigurationService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('validate', () => {
    it('should validate and return user payload without role', async () => {
      const payload = MockDataFactory.mockJwtPayload;

      const result = await strategy.validate(payload);

      expect(result).toEqual({
        id: payload.id,
        kahaId: payload.kahaId,
        businessId: payload.businessId,
      });
      // Note: JWT Strategy does NOT return role
      // Role is fetched later by RolesGuard via ServiceCommunicationService
    });

    it('should extract id, kahaId, and businessId from payload', async () => {
      const payload = {
        id: 'admin-mock-001',
        kahaId: 'kaha-admin-001',
        businessId: 'biz-mock-001',
        email: 'admin@test.com',
        role: 'BUSINESS_SUPER_ADMIN', // This is in payload but not returned
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 3600,
      };

      const result = await strategy.validate(payload);

      expect(result.id).toBe('admin-mock-001');
      expect(result.kahaId).toBe('kaha-admin-001');
      expect(result.businessId).toBe('biz-mock-001');
      expect(result).not.toHaveProperty('role'); // Role not returned by strategy
      expect(result).not.toHaveProperty('email'); // Email not returned by strategy
    });

    it('should handle payload with minimal fields', async () => {
      const payload = {
        id: 'user-001',
        kahaId: 'kaha-001',
        businessId: 'biz-001',
      };

      const result = await strategy.validate(payload);

      expect(result).toEqual({
        id: 'user-001',
        kahaId: 'kaha-001',
        businessId: 'biz-001',
      });
    });

    it('should validate admin user payload', async () => {
      const payload = {
        id: 'admin-mock-001',
        kahaId: 'kaha-admin-001',
        businessId: 'biz-mock-001',
        email: 'admin@test.com',
      };

      const result = await strategy.validate(payload);

      expect(result.id).toBe('admin-mock-001');
      expect(result.businessId).toBe('biz-mock-001');
    });

    it('should validate regular user payload', async () => {
      const payload = {
        id: 'user-mock-001',
        kahaId: 'kaha-user-001',
        businessId: 'biz-mock-001',
        email: 'user@test.com',
      };

      const result = await strategy.validate(payload);

      expect(result.id).toBe('user-mock-001');
      expect(result.businessId).toBe('biz-mock-001');
    });
  });
});
