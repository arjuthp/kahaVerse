import { Test, TestingModule } from '@nestjs/testing';
import { HttpService } from '@nestjs/axios';
import { InternalServerErrorException } from '@nestjs/common';
import { ConfigurationService } from 'configuration/configuration.service';
import { ServiceCommunicationService } from '../service-communication.service';
import { of, throwError } from 'rxjs';
import { AxiosResponse } from 'axios';

describe('ServiceCommunicationService', () => {
  let service: ServiceCommunicationService;
  let httpService: HttpService;
  let configService: ConfigurationService;

  const mockBaseUrl = 'https://api.kaha.com.np/main/api/v3';
  const mockAuthToken = 'mock-jwt-token-123';

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ServiceCommunicationService,
        {
          provide: HttpService,
          useValue: {
            get: jest.fn(),
          },
        },
        {
          provide: ConfigurationService,
          useValue: {
            kahaMainV3BaseURL: mockBaseUrl,
          },
        },
      ],
    }).compile();

    service = module.get<ServiceCommunicationService>(ServiceCommunicationService);
    httpService = module.get<HttpService>(HttpService);
    configService = module.get<ConfigurationService>(ConfigurationService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getBusinessUserRoles', () => {
    const businessId = '7476ee15-1407-41fa-9a49-89e0caaf945d';
    const userId = 'afc70db3-6f43-4882-92fd-4715f25ffc95';

    it('should fetch business user roles successfully', async () => {
      const mockResponse: AxiosResponse = {
        data: {
          id: '7bb484c3-uuid',
          createdAt: '2025-11-18T07:49:04.239Z',
          updatedAt: '2025-11-26T05:03:24.486Z',
          availability: null,
          role: {
            id: 'c954dc77-uuid',
            name: 'Student',
            label: null,
            description: 'Student',
          },
          user: {
            id: userId,
            fullName: 'ishwor gautam',
            kahaId: 'U-8C695E',
            contactNumber: '9813870231',
            email: 'replyishwor@gmail.comz',
            avatar: 'https://example.com/avatar.jpg',
            role: 'admin',
            status: 'verified',
          },
        },
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any,
      };

      jest.spyOn(httpService, 'get').mockReturnValue(of(mockResponse));

      const result = await service.getBusinessUserRoles(businessId, userId, mockAuthToken);

      expect(httpService.get).toHaveBeenCalledWith(
        `${mockBaseUrl}/business-users/${businessId}/${userId}`,
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${mockAuthToken}`,
          },
        }
      );
      expect(result).toEqual(mockResponse.data);
      expect(result.role).toBeDefined();
      expect(result.role.name).toBe('Student');
    });

    it('should strip password field from response (Issue #4)', async () => {
      const mockResponse: AxiosResponse = {
        data: {
          id: '7bb484c3-uuid',
          role: {
            id: 'c954dc77-uuid',
            name: 'Student',
          },
          user: {
            id: userId,
            fullName: 'ishwor gautam',
            password: '$2b$10$A7bHm6DO...', // ⚠️ bcrypt hash exposed by upstream
          },
        },
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any,
      };

      jest.spyOn(httpService, 'get').mockReturnValue(of(mockResponse));

      const result = await service.getBusinessUserRoles(businessId, userId, mockAuthToken);

      expect(result.user.password).toBeUndefined();
    });

    it('should work without auth token (optional parameter)', async () => {
      const mockResponse: AxiosResponse = {
        data: {
          id: '7bb484c3-uuid',
          role: { name: 'Student' },
          user: { id: userId },
        },
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any,
      };

      jest.spyOn(httpService, 'get').mockReturnValue(of(mockResponse));

      await service.getBusinessUserRoles(businessId, userId);

      expect(httpService.get).toHaveBeenCalledWith(
        `${mockBaseUrl}/business-users/${businessId}/${userId}`,
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
    });

    it('should throw InternalServerErrorException on API failure', async () => {
      jest.spyOn(httpService, 'get').mockReturnValue(
        throwError(() => new Error('Network error'))
      );

      await expect(
        service.getBusinessUserRoles(businessId, userId, mockAuthToken)
      ).rejects.toThrow(InternalServerErrorException);
    });

    it('should use ConfigurationService for base URL (Issue #5)', async () => {
      const mockResponse: AxiosResponse = {
        data: { role: { name: 'Student' } },
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any,
      };

      jest.spyOn(httpService, 'get').mockReturnValue(of(mockResponse));

      await service.getBusinessUserRoles(businessId, userId);

      const callUrl = (httpService.get as jest.Mock).mock.calls[0][0];
      expect(callUrl).toContain(mockBaseUrl);
    });
  });

  describe('getUserRoles', () => {
    const userId = 'afc70db3-6f43-4882-92fd-4715f25ffc95';

    it('should fetch user information successfully', async () => {
      const mockResponse: AxiosResponse = {
        data: {
          id: userId,
          fullName: 'ishwor gautam',
          email: 'replyishwor@gmail.comz',
          contactNumber: '9813870231',
          status: 'verified',
          avatar: 'https://example.com/avatar.jpg',
          kahaId: 'U-8C695E',
          role: 'admin',
          firstName: null,
          lastName: null,
          dateOfBirth: null,
          gender: null,
          createdAt: '2023-06-18T07:58:24.413Z',
          hasPassword: true,
        },
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any,
      };

      jest.spyOn(httpService, 'get').mockReturnValue(of(mockResponse));

      const result = await service.getUserRoles(userId, mockAuthToken);

      expect(httpService.get).toHaveBeenCalledWith(
        `${mockBaseUrl}/users/${userId}`,
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${mockAuthToken}`,
          },
        }
      );
      expect(result).toEqual(mockResponse.data);
      expect(result.role).toBe('admin');
    });

    it('should return NO business role info (Issue #2 - documented behavior)', async () => {
      const mockResponse: AxiosResponse = {
        data: {
          id: userId,
          fullName: 'ishwor gautam',
          role: 'admin', // Only top-level role, no business membership
        },
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any,
      };

      jest.spyOn(httpService, 'get').mockReturnValue(of(mockResponse));

      const result = await service.getUserRoles(userId);

      expect(result.role).toBe('admin');
      expect(result).not.toHaveProperty('businessId');
      expect(result).not.toHaveProperty('businessRole');
    });

    it('should work without auth token', async () => {
      const mockResponse: AxiosResponse = {
        data: { id: userId, role: 'admin' },
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any,
      };

      jest.spyOn(httpService, 'get').mockReturnValue(of(mockResponse));

      await service.getUserRoles(userId);

      expect(httpService.get).toHaveBeenCalledWith(
        `${mockBaseUrl}/users/${userId}`,
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
    });

    it('should throw InternalServerErrorException on API failure', async () => {
      jest.spyOn(httpService, 'get').mockReturnValue(
        throwError(() => new Error('User not found'))
      );

      await expect(
        service.getUserRoles(userId, mockAuthToken)
      ).rejects.toThrow(InternalServerErrorException);
    });
  });

  describe('getUser', () => {
    const userId = 'afc70db3-6f43-4882-92fd-4715f25ffc95';

    it('should fetch user information successfully', async () => {
      const mockResponse: AxiosResponse = {
        data: {
          id: userId,
          fullName: 'ishwor gautam',
          email: 'replyishwor@gmail.comz',
          kahaId: 'U-8C695E',
          role: 'admin',
        },
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any,
      };

      jest.spyOn(httpService, 'get').mockReturnValue(of(mockResponse));

      const result = await service.getUser(userId, mockAuthToken);

      expect(httpService.get).toHaveBeenCalledWith(
        `${mockBaseUrl}/users/${userId}`,
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${mockAuthToken}`,
          },
        }
      );
      expect(result).toEqual(mockResponse.data);
    });

    it('should throw InternalServerErrorException on API failure', async () => {
      jest.spyOn(httpService, 'get').mockReturnValue(
        throwError(() => new Error('Network error'))
      );

      await expect(
        service.getUser(userId, mockAuthToken)
      ).rejects.toThrow(InternalServerErrorException);
    });
  });

  describe('getBusiness', () => {
    const businessId = '7476ee15-1407-41fa-9a49-89e0caaf945d';

    it('should fetch business information successfully', async () => {
      const mockResponse: AxiosResponse = {
        data: {
          id: businessId,
          name: 'IshworHostel',
          kahaId: 'B-06CF03',
          tag: 'ISHWORHOSTEL',
          entity: 'Business',
          contact: '9868348282',
          category: {
            id: 'cat-uuid',
            name: 'Boys Hostel',
            parentCategoryName: 'Business',
          },
          avatar: 'https://example.com/avatar.jpg',
          coverImageUrl: 'https://example.com/cover.jpg',
          available: false,
          delivery: false,
          pickup: false,
          isVisible: true,
          isOfficial: false,
          hasOwnershipClaim: false,
          workingDaysAndHours: { monday: '9:0-17:0' },
          location: { type: 'Point', coordinates: [27.699, 85.328] },
          mapAddress: {
            street: 'Test Street',
            province: '3',
            district: '28',
            municipality: '54',
            wardNo: '1',
            country: 'Nepal',
          },
          status: { value: 'verified' },
          owner: { id: '740716db-uuid', fullName: 'Sabin Ghimire' },
          address: 'Test Address',
          geohash: 'tuuttdw1y2cj',
          businessTypes: [],
          additionalInfo: [],
          createdAt: '2025-10-10T07:23:35.017Z',
        },
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any,
      };

      jest.spyOn(httpService, 'get').mockReturnValue(of(mockResponse));

      const result = await service.getBusiness(businessId, mockAuthToken);

      expect(httpService.get).toHaveBeenCalledWith(
        `${mockBaseUrl}/businesses/${businessId}`,
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${mockAuthToken}`,
          },
        }
      );
      expect(result).toEqual(mockResponse.data);
      expect(result.name).toBe('IshworHostel');
      expect(result.kahaId).toBe('B-06CF03');
    });

    it('should work without auth token', async () => {
      const mockResponse: AxiosResponse = {
        data: { id: businessId, name: 'Test Business' },
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any,
      };

      jest.spyOn(httpService, 'get').mockReturnValue(of(mockResponse));

      await service.getBusiness(businessId);

      expect(httpService.get).toHaveBeenCalledWith(
        `${mockBaseUrl}/businesses/${businessId}`,
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
    });

    it('should throw InternalServerErrorException on API failure', async () => {
      jest.spyOn(httpService, 'get').mockReturnValue(
        throwError(() => new Error('Business not found'))
      );

      await expect(
        service.getBusiness(businessId, mockAuthToken)
      ).rejects.toThrow(InternalServerErrorException);
    });
  });

  describe('Authorization Header (Issue #1)', () => {
    it('should send Authorization header when token provided', async () => {
      const mockResponse: AxiosResponse = {
        data: {},
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any,
      };

      jest.spyOn(httpService, 'get').mockReturnValue(of(mockResponse));

      await service.getUser('user-id', mockAuthToken);

      const callArgs = (httpService.get as jest.Mock).mock.calls[0];
      expect(callArgs[1].headers.Authorization).toBe(`Bearer ${mockAuthToken}`);
    });

    it('should NOT send Authorization header when token not provided', async () => {
      const mockResponse: AxiosResponse = {
        data: {},
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any,
      };

      jest.spyOn(httpService, 'get').mockReturnValue(of(mockResponse));

      await service.getUser('user-id');

      const callArgs = (httpService.get as jest.Mock).mock.calls[0];
      expect(callArgs[1].headers.Authorization).toBeUndefined();
    });
  });

  describe('Role Structure (Issue #3)', () => {
    it('should handle single role object (not array) from upstream', async () => {
      const mockResponse: AxiosResponse = {
        data: {
          role: {
            // Single object, NOT an array
            id: 'role-uuid',
            name: 'Student',
            label: null,
            description: 'Student',
          },
        },
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any,
      };

      jest.spyOn(httpService, 'get').mockReturnValue(of(mockResponse));

      const result = await service.getBusinessUserRoles('biz-id', 'user-id');

      expect(result.role).toBeDefined();
      expect(result.role.name).toBe('Student');
      expect(Array.isArray(result.role)).toBe(false);
    });
  });
});
