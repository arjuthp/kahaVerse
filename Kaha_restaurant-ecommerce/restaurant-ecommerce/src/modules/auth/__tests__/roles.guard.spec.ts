import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RolesGuard } from '../guards/roles.guard';
import { ServiceCommunicationService } from 'serviceCommunication/service-communication.service';
import { UserRoleEnum } from 'common/enums';
import { MockDataFactory } from '../../../test-utils';

describe('RolesGuard', () => {
  let guard: RolesGuard;
  let reflector: Reflector;
  let serviceCommunicationService: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RolesGuard,
        {
          provide: Reflector,
          useValue: {
            getAllAndOverride: jest.fn(),
          },
        },
        {
          provide: ServiceCommunicationService,
          useValue: {
            getBusinessUserRoles: jest.fn(),
            getUserRoles: jest.fn(),
          },
        },
      ],
    }).compile();

    guard = module.get<RolesGuard>(RolesGuard);
    reflector = module.get<Reflector>(Reflector);
    serviceCommunicationService = module.get<ServiceCommunicationService>(
      ServiceCommunicationService
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  const createMockExecutionContext = (user: any): ExecutionContext => {
    return {
      switchToHttp: () => ({
        getRequest: () => ({ 
          user,
          headers: {
            authorization: 'Bearer mock-token-123'
          }
        }),
      }),
      getHandler: jest.fn(),
      getClass: jest.fn(),
    } as any;
  };

  describe('canActivate', () => {
    it('should allow access if no roles are required', async () => {
      const context = createMockExecutionContext(MockDataFactory.mockUser);
      
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(undefined);

      const result = await guard.canActivate(context);

      expect(result).toBe(true);
      expect(serviceCommunicationService.getBusinessUserRoles).not.toHaveBeenCalled();
    });

    it('should allow access if user has required role (with businessId)', async () => {
      const user = {
        id: 'admin-mock-001',
        businessId: 'biz-mock-001',
      };
      const context = createMockExecutionContext(user);
      
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([UserRoleEnum.BUSINESS_SUPER_ADMIN]);
      serviceCommunicationService.getBusinessUserRoles.mockResolvedValue({
        role: {
          name: UserRoleEnum.BUSINESS_SUPER_ADMIN,
        },
      });

      const result = await guard.canActivate(context);

      expect(result).toBe(true);
      expect(serviceCommunicationService.getBusinessUserRoles).toHaveBeenCalledWith(
        'biz-mock-001',
        'admin-mock-001',
        'mock-token-123'
      );
    });

    it('should deny access if user does not have required role', async () => {
      const user = {
        id: 'user-mock-001',
        businessId: 'biz-mock-001',
      };
      const context = createMockExecutionContext(user);
      
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([UserRoleEnum.BUSINESS_SUPER_ADMIN]);
      serviceCommunicationService.getBusinessUserRoles.mockResolvedValue({
        role: {
          name: UserRoleEnum.USER,
        },
      });

      const result = await guard.canActivate(context);

      expect(result).toBe(false);
    });

    it('should allow access if user has one of multiple required roles', async () => {
      const user = {
        id: 'admin-mock-001',
        businessId: 'biz-mock-001',
      };
      const context = createMockExecutionContext(user);
      
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([
        UserRoleEnum.BUSINESS_SUPER_ADMIN,
        UserRoleEnum.ADMIN,
      ]);
      serviceCommunicationService.getBusinessUserRoles.mockResolvedValue({
        role: {
          name: UserRoleEnum.ADMIN,
        },
      });

      const result = await guard.canActivate(context);

      expect(result).toBe(true);
    });

    it('should deny access if user has none of the required roles', async () => {
      const user = {
        id: 'user-mock-001',
        businessId: 'biz-mock-001',
      };
      const context = createMockExecutionContext(user);
      
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([
        UserRoleEnum.BUSINESS_SUPER_ADMIN,
        UserRoleEnum.ADMIN,
      ]);
      serviceCommunicationService.getBusinessUserRoles.mockResolvedValue({
        role: {
          name: UserRoleEnum.USER,
        },
      });

      const result = await guard.canActivate(context);

      expect(result).toBe(false);
    });

    it('should allow BUSINESS_SUPER_ADMIN access to admin-only routes', async () => {
      const user = {
        id: 'admin-mock-001',
        businessId: 'biz-mock-001',
      };
      const context = createMockExecutionContext(user);
      
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([UserRoleEnum.BUSINESS_SUPER_ADMIN]);
      serviceCommunicationService.getBusinessUserRoles.mockResolvedValue({
        role: {
          name: UserRoleEnum.BUSINESS_SUPER_ADMIN,
        },
      });

      const result = await guard.canActivate(context);

      expect(result).toBe(true);
    });

    it('should allow ADMIN access to admin routes', async () => {
      const user = {
        id: 'admin-mock-001',
        businessId: 'biz-mock-001',
      };
      const context = createMockExecutionContext(user);
      
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([UserRoleEnum.ADMIN]);
      serviceCommunicationService.getBusinessUserRoles.mockResolvedValue({
        role: {
          name: UserRoleEnum.ADMIN,
        },
      });

      const result = await guard.canActivate(context);

      expect(result).toBe(true);
    });

    it('should deny USER access to admin routes', async () => {
      const user = {
        id: 'user-mock-001',
        businessId: 'biz-mock-001',
      };
      const context = createMockExecutionContext(user);
      
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([UserRoleEnum.BUSINESS_SUPER_ADMIN]);
      serviceCommunicationService.getBusinessUserRoles.mockResolvedValue({
        role: {
          name: UserRoleEnum.USER,
        },
      });

      const result = await guard.canActivate(context);

      expect(result).toBe(false);
    });

    it('should use getUserRoles when no businessId provided', async () => {
      const user = {
        id: 'user-mock-001',
        // No businessId
      };
      const context = createMockExecutionContext(user);
      
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([UserRoleEnum.USER]);
      serviceCommunicationService.getUserRoles.mockResolvedValue({
        role: UserRoleEnum.USER,
      });

      const result = await guard.canActivate(context);

      expect(result).toBe(true);
      expect(serviceCommunicationService.getUserRoles).toHaveBeenCalledWith('user-mock-001', 'mock-token-123');
      expect(serviceCommunicationService.getBusinessUserRoles).not.toHaveBeenCalled();
    });

    it('should handle missing user gracefully', async () => {
      const context = createMockExecutionContext(null);
      
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([UserRoleEnum.BUSINESS_SUPER_ADMIN]);
      serviceCommunicationService.getUserRoles.mockResolvedValue({
        role: UserRoleEnum.USER,
      });

      const result = await guard.canActivate(context);

      expect(result).toBe(false);
    });

    it('should handle user without role from service', async () => {
      const user = {
        id: 'user-001',
        businessId: 'biz-001',
      };
      const context = createMockExecutionContext(user);
      
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([UserRoleEnum.BUSINESS_SUPER_ADMIN]);
      serviceCommunicationService.getBusinessUserRoles.mockResolvedValue(null);

      const result = await guard.canActivate(context);

      expect(result).toBe(false);
    });
  });

  describe('Role Hierarchy', () => {
    it('should respect role hierarchy - SUPER_ADMIN has highest privilege', async () => {
      const user = {
        id: 'admin-mock-001',
        businessId: 'biz-mock-001',
      };
      const context = createMockExecutionContext(user);
      
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([
        UserRoleEnum.BUSINESS_SUPER_ADMIN,
        UserRoleEnum.ADMIN,
        UserRoleEnum.USER,
      ]);
      serviceCommunicationService.getBusinessUserRoles.mockResolvedValue({
        role: {
          name: UserRoleEnum.BUSINESS_SUPER_ADMIN,
        },
      });

      const result = await guard.canActivate(context);

      expect(result).toBe(true);
    });

    it('should respect role hierarchy - ADMIN has middle privilege', async () => {
      const user = {
        id: 'admin-mock-001',
        businessId: 'biz-mock-001',
      };
      const context = createMockExecutionContext(user);
      
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([
        UserRoleEnum.ADMIN,
        UserRoleEnum.USER,
      ]);
      serviceCommunicationService.getBusinessUserRoles.mockResolvedValue({
        role: {
          name: UserRoleEnum.ADMIN,
        },
      });

      const result = await guard.canActivate(context);

      expect(result).toBe(true);
    });

    it('should respect role hierarchy - USER has lowest privilege', async () => {
      const user = {
        id: 'user-mock-001',
        businessId: 'biz-mock-001',
      };
      const context = createMockExecutionContext(user);
      
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([UserRoleEnum.USER]);
      serviceCommunicationService.getBusinessUserRoles.mockResolvedValue({
        role: {
          name: UserRoleEnum.USER,
        },
      });

      const result = await guard.canActivate(context);

      expect(result).toBe(true);
    });
  });

  describe('Real Authentication Flow', () => {
    it('should simulate complete auth flow: JWT -> Guard -> Service -> Role Check', async () => {
      // Simulate JWT payload after authentication
      const jwtUser = {
        id: 'admin-mock-001',
        kahaId: 'kaha-admin-001',
        businessId: 'biz-mock-001',
        email: 'admin@test.com',
      };
      const context = createMockExecutionContext(jwtUser);
      
      // Controller requires BUSINESS_SUPER_ADMIN role
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([UserRoleEnum.BUSINESS_SUPER_ADMIN]);
      
      // ServiceCommunicationService fetches role from KAHA Main V3
      serviceCommunicationService.getBusinessUserRoles.mockResolvedValue({
        role: {
          name: UserRoleEnum.BUSINESS_SUPER_ADMIN,
        },
        permissions: ['read', 'write', 'delete'],
      });

      const result = await guard.canActivate(context);

      expect(result).toBe(true);
      expect(serviceCommunicationService.getBusinessUserRoles).toHaveBeenCalledWith(
        'biz-mock-001',
        'admin-mock-001',
        'mock-token-123'
      );
    });

    it('should deny access when service returns insufficient role', async () => {
      const jwtUser = {
        id: 'user-mock-001',
        businessId: 'biz-mock-001',
      };
      const context = createMockExecutionContext(jwtUser);
      
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([UserRoleEnum.BUSINESS_SUPER_ADMIN]);
      
      // Service returns USER role, but ADMIN required
      serviceCommunicationService.getBusinessUserRoles.mockResolvedValue({
        role: {
          name: UserRoleEnum.USER,
        },
      });

      const result = await guard.canActivate(context);

      expect(result).toBe(false);
    });

    it('should handle service communication failure gracefully', async () => {
      const jwtUser = {
        id: 'admin-mock-001',
        businessId: 'biz-mock-001',
      };
      const context = createMockExecutionContext(jwtUser);
      
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([UserRoleEnum.BUSINESS_SUPER_ADMIN]);
      
      // Service throws error (e.g., KAHA Main V3 is down)
      serviceCommunicationService.getBusinessUserRoles.mockRejectedValue(
        new Error('Service unavailable')
      );

      await expect(guard.canActivate(context)).rejects.toThrow('Service unavailable');
    });
  });
});
