import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { AddonGroupsService } from '../addon-groups.service';
import { AddonGroupRepository, AddonsRepository } from 'repositories/index';
import { MockDataFactory, createMockRepository } from '../../../test-utils';

describe('AddonGroupsService', () => {
  let service: AddonGroupsService;
  let addonGroupRepository: any;
  let addonRepository: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AddonGroupsService,
        {
          provide: AddonGroupRepository,
          useValue: createMockRepository(),
        },
        {
          provide: AddonsRepository,
          useValue: createMockRepository(),
        },
      ],
    }).compile();

    service = module.get<AddonGroupsService>(AddonGroupsService);
    addonGroupRepository = module.get<AddonGroupRepository>(AddonGroupRepository);
    addonRepository = module.get<AddonsRepository>(AddonsRepository);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createGroup', () => {
    it('should create an addon group successfully', async () => {
      const createDto = MockDataFactory.createAddonGroupDto;
      
      addonGroupRepository.save.mockResolvedValue({ ...createDto, id: 'group-001' });

      const result = await service.createGroup(createDto);

      expect(result).toBeDefined();
      expect(result.id).toBe('group-001');
      expect(addonGroupRepository.save).toHaveBeenCalledWith(createDto);
    });

    it('should create required addon group', async () => {
      const createDto = {
        ...MockDataFactory.createAddonGroupDto,
        isRequired: true,
        minSelect: 1,
        maxSelect: 1,
      };
      
      addonGroupRepository.save.mockResolvedValue({ ...createDto, id: 'group-002' });

      const result = await service.createGroup(createDto);

      expect(result.isRequired).toBe(true);
      expect(result.minSelect).toBe(1);
    });
  });

  describe('findAll', () => {
    it('should return all addon groups with addons', async () => {
      const mockGroups = [
        { ...MockDataFactory.mockAddonGroup, addons: [MockDataFactory.mockAddon] },
      ];
      
      addonGroupRepository.find.mockResolvedValue(mockGroups);

      const result = await service.findAll();

      expect(result).toEqual(mockGroups);
      expect(addonGroupRepository.find).toHaveBeenCalledWith(
        expect.objectContaining({ relations: ['addons'] })
      );
    });

    it('should return empty array when no groups found', async () => {
      addonGroupRepository.find.mockResolvedValue([]);

      const result = await service.findAll();

      expect(result).toEqual([]);
    });
  });

  describe('findOne', () => {
    it('should return an addon group by id', async () => {
      const mockGroup = { ...MockDataFactory.mockAddonGroup, addons: [] };
      
      addonGroupRepository.findOne.mockResolvedValue(mockGroup);

      const result = await service.findOne('group-001');

      expect(result).toEqual(mockGroup);
      expect(addonGroupRepository.findOne).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'group-001' },
          relations: ['addons'],
        })
      );
    });

    it('should throw NotFoundException if group not found', async () => {
      addonGroupRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne('invalid-id')).rejects.toThrow(
        NotFoundException
      );
    });
  });

  describe('updateGroup', () => {
    it('should update an addon group successfully', async () => {
      const updateDto = {
        name: 'Updated Group',
        description: 'Updated description',
      };
      const mockGroup = { ...MockDataFactory.mockAddonGroup, ...updateDto };
      
      addonGroupRepository.findOne.mockResolvedValue(MockDataFactory.mockAddonGroup);
      addonGroupRepository.update.mockResolvedValue({ affected: 1 });
      addonGroupRepository.findOne.mockResolvedValue(mockGroup);

      const result = await service.updateGroup('group-001', updateDto);

      expect(result.name).toBe('Updated Group');
      expect(addonGroupRepository.update).toHaveBeenCalledWith('group-001', updateDto);
    });

    it('should throw NotFoundException if group not found', async () => {
      addonGroupRepository.findOne.mockResolvedValue(null);

      await expect(
        service.updateGroup('invalid-id', { name: 'Updated' })
      ).rejects.toThrow(NotFoundException);
    });

    it('should update selection constraints', async () => {
      const updateDto = {
        minSelect: 2,
        maxSelect: 5,
      };
      const mockGroup = { ...MockDataFactory.mockAddonGroup, ...updateDto };
      
      addonGroupRepository.findOne
        .mockResolvedValueOnce(MockDataFactory.mockAddonGroup)
        .mockResolvedValueOnce(mockGroup);
      addonGroupRepository.update.mockResolvedValue({ affected: 1 });

      const result = await service.updateGroup('group-001', updateDto);

      expect(result.minSelect).toBe(2);
      expect(result.maxSelect).toBe(5);
    });
  });

  describe('deleteGroup', () => {
    it('should soft delete an addon group', async () => {
      const mockGroup = { ...MockDataFactory.mockAddonGroup, isActive: true };
      
      addonGroupRepository.findOne.mockResolvedValue(mockGroup);
      addonGroupRepository.save.mockResolvedValue({ ...mockGroup, isActive: false });

      const result = await service.deleteGroup('group-001');

      expect(result.isActive).toBe(false);
      expect(addonGroupRepository.save).toHaveBeenCalled();
    });

    it('should throw NotFoundException if group not found', async () => {
      addonGroupRepository.findOne.mockResolvedValue(null);

      await expect(service.deleteGroup('invalid-id')).rejects.toThrow(
        NotFoundException
      );
    });
  });

  describe('addAddonToGroup', () => {
    it('should add addon to group successfully', async () => {
      const createAddonDto = MockDataFactory.createAddonDto;
      const mockGroup = MockDataFactory.mockAddonGroup;
      
      addonGroupRepository.findOne.mockResolvedValue(mockGroup);
      addonRepository.create.mockReturnValue({ ...createAddonDto, addonGroup: mockGroup });
      addonRepository.save.mockResolvedValue({ ...createAddonDto, id: 'addon-001' });

      const result = await service.addAddonToGroup('group-001', createAddonDto);

      expect(result).toBeDefined();
      expect(result.id).toBe('addon-001');
      expect(addonRepository.save).toHaveBeenCalled();
    });

    it('should throw NotFoundException if group not found', async () => {
      addonGroupRepository.findOne.mockResolvedValue(null);

      await expect(
        service.addAddonToGroup('invalid-id', MockDataFactory.createAddonDto)
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateAddon', () => {
    it('should update addon successfully', async () => {
      const updateDto = {
        name: 'Updated Addon',
        price: 3.99,
      };
      const mockAddon = { ...MockDataFactory.mockAddon };
      
      addonRepository.findOne.mockResolvedValue(mockAddon);
      addonRepository.save.mockResolvedValue({ ...mockAddon, ...updateDto });

      const result = await service.updateAddon('addon-001', updateDto);

      expect(result.name).toBe('Updated Addon');
      expect(result.price).toBe(3.99);
    });

    it('should throw NotFoundException if addon not found', async () => {
      addonRepository.findOne.mockResolvedValue(null);

      await expect(
        service.updateAddon('invalid-id', { name: 'Updated' })
      ).rejects.toThrow(NotFoundException);
    });

    it('should update only provided fields', async () => {
      const updateDto = { price: 4.50 };
      const mockAddon = { ...MockDataFactory.mockAddon, name: 'Original Name' };
      
      addonRepository.findOne.mockResolvedValue(mockAddon);
      addonRepository.save.mockResolvedValue({ ...mockAddon, price: 4.50 });

      const result = await service.updateAddon('addon-001', updateDto);

      expect(result.price).toBe(4.50);
      expect(result.name).toBe('Original Name'); // Should remain unchanged
    });

    it('should update sortOrder', async () => {
      const updateDto = { sortOrder: 5 };
      const mockAddon = { ...MockDataFactory.mockAddon };
      
      addonRepository.findOne.mockResolvedValue(mockAddon);
      addonRepository.save.mockResolvedValue({ ...mockAddon, sortOrder: 5 });

      const result = await service.updateAddon('addon-001', updateDto);

      expect(result.sortOrder).toBe(5);
    });

    it('should update isActive status', async () => {
      const updateDto = { isActive: false };
      const mockAddon = { ...MockDataFactory.mockAddon, isActive: true };
      
      addonRepository.findOne.mockResolvedValue(mockAddon);
      addonRepository.save.mockResolvedValue({ ...mockAddon, isActive: false });

      const result = await service.updateAddon('addon-001', updateDto);

      expect(result.isActive).toBe(false);
    });
  });

  describe('deleteAddon', () => {
    it('should soft delete an addon', async () => {
      const mockAddon = { ...MockDataFactory.mockAddon, isActive: true };
      
      addonRepository.findOne.mockResolvedValue(mockAddon);
      addonRepository.save.mockResolvedValue({ ...mockAddon, isActive: false });

      const result = await service.deleteAddon('addon-001');

      expect(result.isActive).toBe(false);
      expect(addonRepository.save).toHaveBeenCalled();
    });

    it('should throw NotFoundException if addon not found', async () => {
      addonRepository.findOne.mockResolvedValue(null);

      await expect(service.deleteAddon('invalid-id')).rejects.toThrow(
        NotFoundException
      );
    });
  });
});
