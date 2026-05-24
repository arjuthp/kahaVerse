import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, NotFoundException, BadRequestException } from '@nestjs/common';
import { MenuService } from '../menu.service';
import { MenuRepository, CategoryRepository, AddonsRepository, MenuVariantRepository, AddonGroupRepository } from 'repositories/index';
import { MockDataFactory, createMockRepository } from '../../../test-utils';

describe('MenuService', () => {
  let service: MenuService;
  let menuRepository: any;
  let categoryRepository: any;
  let addonsRepository: any;
  let menuVariantRepository: any;
  let addonGroupRepository: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MenuService,
        {
          provide: MenuRepository,
          useValue: createMockRepository(),
        },
        {
          provide: CategoryRepository,
          useValue: createMockRepository(),
        },
        {
          provide: AddonsRepository,
          useValue: createMockRepository(),
        },
        {
          provide: MenuVariantRepository,
          useValue: createMockRepository(),
        },
        {
          provide: AddonGroupRepository,
          useValue: createMockRepository(),
        },
      ],
    }).compile();

    service = module.get<MenuService>(MenuService);
    menuRepository = module.get<MenuRepository>(MenuRepository);
    categoryRepository = module.get<CategoryRepository>(CategoryRepository);
    addonsRepository = module.get<AddonsRepository>(AddonsRepository);
    menuVariantRepository = module.get<MenuVariantRepository>(MenuVariantRepository);
    addonGroupRepository = module.get<AddonGroupRepository>(AddonGroupRepository);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createMenu', () => {
    it('should create a menu successfully', async () => {
      const createDto = MockDataFactory.createMenuDto;
      
      menuRepository.findOne.mockResolvedValue(null); // No existing menu
      categoryRepository.findOne.mockResolvedValue(MockDataFactory.mockCategory);
      menuRepository.save.mockResolvedValue({ ...createDto, id: 'menu-001' });

      const result = await service.createMenu('biz-mock-001', createDto);

      expect(result).toEqual({ message: 'Menu created successfully.' });
      expect(menuRepository.save).toHaveBeenCalled();
    });

    it('should throw ConflictException if menu name already exists', async () => {
      const createDto = MockDataFactory.createMenuDto;
      
      menuRepository.findOne.mockResolvedValue(MockDataFactory.mockMenu);

      await expect(service.createMenu('biz-mock-001', createDto)).rejects.toThrow(
        ConflictException
      );
      expect(menuRepository.save).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException if category not found', async () => {
      const createDto = MockDataFactory.createMenuDto;
      
      menuRepository.findOne.mockResolvedValue(null);
      categoryRepository.findOne.mockResolvedValue(null);

      await expect(service.createMenu('biz-mock-001', createDto)).rejects.toThrow(
        NotFoundException
      );
    });

    it('should create menu with addons', async () => {
      const createDto = { ...MockDataFactory.createMenuDto, addOnIds: ['addon-001'] };
      
      menuRepository.findOne.mockResolvedValue(null);
      categoryRepository.findOne.mockResolvedValue(MockDataFactory.mockCategory);
      addonsRepository.find.mockResolvedValue([MockDataFactory.mockAddon]);
      menuRepository.save.mockResolvedValue({ ...createDto, id: 'menu-001' });

      const result = await service.createMenu('biz-mock-001', createDto);

      expect(result).toEqual({ message: 'Menu created successfully.' });
      expect(addonsRepository.find).toHaveBeenCalled();
    });
  });

  describe('findAllMenu', () => {
    it('should return paginated menu list', async () => {
      const mockMenus = [MockDataFactory.mockMenu];
      
      menuRepository.findAndCount.mockResolvedValue([mockMenus, 1]);

      const result = await service.findAllMenu('biz-mock-001', { page: '1', take: '10' });

      expect(result.data).toBeDefined();
      expect(result.metaData).toBeDefined();
      expect(result.metaData.currentPage).toBe(1);
      expect(result.metaData.totalCount).toBe(1);
    });

    it('should filter by category', async () => {
      const mockMenus = [MockDataFactory.mockMenu];
      
      menuRepository.findAndCount.mockResolvedValue([mockMenus, 1]);

      await service.findAllMenu('biz-mock-001', { 
        page: '1', 
        take: '10',
        categoryId: 'cat-001'
      });

      expect(menuRepository.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ 'category.id': 'cat-001' }),
        })
      );
    });

    it('should filter by name', async () => {
      const mockMenus = [MockDataFactory.mockMenu];
      
      menuRepository.findAndCount.mockResolvedValue([mockMenus, 1]);

      await service.findAllMenu('biz-mock-001', { 
        page: '1', 
        take: '10',
        name: 'Burger'
      });

      expect(menuRepository.findAndCount).toHaveBeenCalled();
    });

    it('should filter by price range', async () => {
      const mockMenus = [MockDataFactory.mockMenu];
      
      menuRepository.findAndCount.mockResolvedValue([mockMenus, 1]);

      await service.findAllMenu('biz-mock-001', { 
        page: '1', 
        take: '10',
        minPrice: 10,
        maxPrice: 20
      });

      expect(menuRepository.findAndCount).toHaveBeenCalled();
    });

    it('should group by category when requested', async () => {
      const mockMenus = [
        { ...MockDataFactory.mockMenu, category: MockDataFactory.mockCategory, addonGroups: [] }
      ];
      
      menuRepository.findAndCount.mockResolvedValue([mockMenus, 1]);

      const result = await service.findAllMenu('biz-mock-001', { 
        page: '1', 
        take: '10',
        groupBy: 'category'
      });

      expect(result).toBeDefined();
      expect(typeof result).toBe('object');
    });

    it('should return empty array when no menus found', async () => {
      menuRepository.findAndCount.mockResolvedValue([[], 0]);

      const result = await service.findAllMenu('biz-mock-001', { page: '1', take: '10' });

      expect(result.data).toEqual([]);
      expect(result.metaData.totalCount).toBe(0);
    });
  });

  describe('findMenuById', () => {
    it('should return a menu by id', async () => {
      menuRepository.findOne.mockResolvedValue(MockDataFactory.mockMenu);

      const result = await service.findMenuById('menu-001');

      expect(result).toBeDefined();
      expect(result.id).toBe(MockDataFactory.mockMenu.id);
    });
  });

  describe('updateMenu', () => {
    it('should update a menu successfully', async () => {
      const updateDto = MockDataFactory.updateMenuDto;
      const existingMenu = { ...MockDataFactory.mockMenu, name: 'Old Menu Name' };
      
      menuRepository.findOne
        .mockResolvedValueOnce(existingMenu) // First call: find existing menu
        .mockResolvedValueOnce(null); // Second call: check for name conflict (no conflict)
      menuRepository.update.mockResolvedValue({ affected: 1 });

      const result = await service.updateMenu('menu-001', 'biz-mock-001', updateDto);

      expect(result).toEqual({ message: 'The menu item was successfully updated.' });
      expect(menuRepository.update).toHaveBeenCalled();
    });

    it('should throw ConflictException if new name already exists', async () => {
      const updateDto = { ...MockDataFactory.updateMenuDto, name: 'Existing Menu' };
      
      menuRepository.findOne
        .mockResolvedValueOnce({ ...MockDataFactory.mockMenu, name: 'Old Name' })
        .mockResolvedValueOnce({ ...MockDataFactory.mockMenu, name: 'Existing Menu' });

      await expect(
        service.updateMenu('menu-001', 'biz-mock-001', updateDto)
      ).rejects.toThrow(ConflictException);
    });

    it('should allow updating with same name (case insensitive)', async () => {
      const updateDto = { ...MockDataFactory.updateMenuDto, name: 'Test Burger' };
      const existingMenu = { ...MockDataFactory.mockMenu, name: 'test burger' };
      
      menuRepository.findOne.mockResolvedValue(existingMenu);
      menuRepository.update.mockResolvedValue({ affected: 1 });

      const result = await service.updateMenu('menu-001', 'biz-mock-001', updateDto);

      expect(result).toEqual({ message: 'The menu item was successfully updated.' });
    });
  });

  describe('toggleSignatureMenu', () => {
    it('should mark menu as signature', async () => {
      menuRepository.findOne.mockResolvedValue({ ...MockDataFactory.mockMenu, isSignature: false });
      menuRepository.count.mockResolvedValue(2); // Less than 3
      menuRepository.update.mockResolvedValue({ affected: 1 });

      const result = await service.toggleSignatureMenu('menu-001', 'biz-mock-001', { isSignature: true });

      expect(result.message).toContain('marked as signature');
      expect(menuRepository.update).toHaveBeenCalled();
    });

    it('should throw BadRequestException if already signature', async () => {
      menuRepository.findOne.mockResolvedValue({ ...MockDataFactory.mockMenu, isSignature: true });

      await expect(
        service.toggleSignatureMenu('menu-001', 'biz-mock-001', { isSignature: true })
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if signature limit reached', async () => {
      menuRepository.findOne.mockResolvedValue({ ...MockDataFactory.mockMenu, isSignature: false });
      menuRepository.count.mockResolvedValue(3); // Already 3 signature items

      await expect(
        service.toggleSignatureMenu('menu-001', 'biz-mock-001', { isSignature: true })
      ).rejects.toThrow(BadRequestException);
    });

    it('should remove signature status', async () => {
      menuRepository.findOne.mockResolvedValue({ ...MockDataFactory.mockMenu, isSignature: true });
      menuRepository.update.mockResolvedValue({ affected: 1 });

      const result = await service.toggleSignatureMenu('menu-001', 'biz-mock-001', { isSignature: false });

      expect(result.message).toContain('removed from signature');
    });

    it('should throw NotFoundException if menu not found', async () => {
      menuRepository.findOne.mockResolvedValue(null);

      await expect(
        service.toggleSignatureMenu('invalid-id', 'biz-mock-001', { isSignature: true })
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('deleteMenu', () => {
    it('should delete a menu successfully', async () => {
      menuRepository.delete.mockResolvedValue({ affected: 1 });

      const result = await service.deleteMenu('menu-001', 'biz-mock-001');

      expect(result).toEqual({ message: 'The menu item was successfully deleted.' });
      expect(menuRepository.delete).toHaveBeenCalledWith({
        id: 'menu-001',
        businessId: 'biz-mock-001',
      });
    });
  });

  describe('Menu Variants', () => {
    it('should add variant to menu', async () => {
      const variantDto = { name: 'Large', price: 5.00 };
      
      menuRepository.findOne.mockResolvedValue(MockDataFactory.mockMenu);
      menuVariantRepository.save.mockResolvedValue({ ...variantDto, id: 'variant-001' });

      const result = await service.addVariant('menu-001', 'biz-mock-001', variantDto);

      expect(result).toBeDefined();
      expect(menuVariantRepository.save).toHaveBeenCalled();
    });

    it('should throw NotFoundException if menu not found for variant', async () => {
      menuRepository.findOne.mockResolvedValue(null);

      await expect(
        service.addVariant('invalid-id', 'biz-mock-001', { name: 'Large', price: 5.00 })
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException for negative price', async () => {
      menuRepository.findOne.mockResolvedValue(MockDataFactory.mockMenu);

      await expect(
        service.addVariant('menu-001', 'biz-mock-001', { name: 'Large', price: -5.00 })
      ).rejects.toThrow(BadRequestException);
    });

    it('should get variants for menu', async () => {
      const mockVariants = [{ id: 'variant-001', name: 'Large', price: 5.00 }];
      
      menuVariantRepository.find.mockResolvedValue(mockVariants);

      const result = await service.getVariants('menu-001');

      expect(result).toEqual(mockVariants);
    });

    it('should update variant', async () => {
      const mockVariant = { 
        id: 'variant-001', 
        name: 'Large', 
        price: 5.00,
        menu: { ...MockDataFactory.mockMenu, businessId: 'biz-mock-001' }
      };
      
      menuVariantRepository.findOne.mockResolvedValue(mockVariant);
      menuVariantRepository.update.mockResolvedValue({ affected: 1 });
      menuVariantRepository.findOne.mockResolvedValue({ ...mockVariant, price: 6.00 });

      const result = await service.updateVariant('variant-001', 'biz-mock-001', { price: 6.00 });

      expect(result).toBeDefined();
    });

    it('should delete variant', async () => {
      const mockVariant = { 
        id: 'variant-001',
        menu: { ...MockDataFactory.mockMenu, businessId: 'biz-mock-001' }
      };
      
      menuVariantRepository.findOne.mockResolvedValue(mockVariant);
      menuVariantRepository.delete.mockResolvedValue({ affected: 1 });

      const result = await service.deleteVariant('variant-001', 'biz-mock-001');

      expect(result.message).toContain('deleted successfully');
    });
  });

  describe('Addon Groups', () => {
    it('should attach addon group to menu', async () => {
      const mockMenu = { ...MockDataFactory.mockMenu, addonGroups: [] };
      
      menuRepository.findOne.mockResolvedValue(mockMenu);
      addonGroupRepository.findOne.mockResolvedValue(MockDataFactory.mockAddonGroup);
      menuRepository.save.mockResolvedValue(mockMenu);

      const result = await service.attachAddonGroup('menu-001', 'biz-mock-001', 'group-001');

      expect(result.message).toContain('attached successfully');
    });

    it('should throw NotFoundException if menu not found', async () => {
      menuRepository.findOne.mockResolvedValue(null);

      await expect(
        service.attachAddonGroup('invalid-id', 'biz-mock-001', 'group-001')
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException if addon group not found', async () => {
      menuRepository.findOne.mockResolvedValue(MockDataFactory.mockMenu);
      addonGroupRepository.findOne.mockResolvedValue(null);

      await expect(
        service.attachAddonGroup('menu-001', 'biz-mock-001', 'invalid-group')
      ).rejects.toThrow(NotFoundException);
    });

    it('should detach addon group from menu', async () => {
      const mockMenu = { 
        ...MockDataFactory.mockMenu, 
        addonGroups: [MockDataFactory.mockAddonGroup] 
      };
      
      menuRepository.findOne.mockResolvedValue(mockMenu);
      menuRepository.save.mockResolvedValue(mockMenu);

      const result = await service.detachAddonGroup('menu-001', 'biz-mock-001', 'group-001');

      expect(result.message).toContain('detached successfully');
    });
  });
});
