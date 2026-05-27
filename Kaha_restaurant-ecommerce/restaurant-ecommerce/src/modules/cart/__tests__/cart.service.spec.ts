import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, NotFoundException, BadRequestException } from '@nestjs/common';
import { CartService } from '../cart.service';
import {
  CartRepository,
  CartItemRepository,
  CartItemAddOnsRepository,
  MenuVariantRepository,
  AddonsRepository,
} from 'repositories/index';
import { MockDataFactory, createMockRepository } from '../../../test-utils';

describe('CartService', () => {
  let service: CartService;
  let cartRepository: any;
  let cartItemRepository: any;
  let cartItemAddonsRepository: any;
  let menuVariantRepository: any;
  let addonsRepository: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CartService,
        {
          provide: CartRepository,
          useValue: createMockRepository(),
        },
        {
          provide: CartItemRepository,
          useValue: createMockRepository(),
        },
        {
          provide: CartItemAddOnsRepository,
          useValue: createMockRepository(),
        },
        {
          provide: MenuVariantRepository,
          useValue: createMockRepository(),
        },
        {
          provide: AddonsRepository,
          useValue: createMockRepository(),
        },
      ],
    }).compile();

    service = module.get<CartService>(CartService);
    cartRepository = module.get<CartRepository>(CartRepository);
    cartItemRepository = module.get<CartItemRepository>(CartItemRepository);
    cartItemAddonsRepository = module.get<CartItemAddOnsRepository>(CartItemAddOnsRepository);
    menuVariantRepository = module.get<MenuVariantRepository>(MenuVariantRepository);
    addonsRepository = module.get<AddonsRepository>(AddonsRepository);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createCart', () => {
    it('should create a cart successfully', async () => {
      cartRepository.findOne.mockResolvedValue(null);
      cartRepository.save.mockResolvedValue({ ...MockDataFactory.mockCart, id: 'cart-001' });

      const result = await service.createCart('user-mock-001', 'biz-mock-001');

      expect(result).toBeDefined();
      expect(result.id).toBe('cart-001');
      expect(cartRepository.save).toHaveBeenCalledWith({ userId: 'user-mock-001', businessId: 'biz-mock-001' });
    });

    it('should throw ConflictException if cart already exists', async () => {
      cartRepository.findOne.mockResolvedValue(MockDataFactory.mockCart);

      await expect(service.createCart('user-mock-001', 'biz-mock-001')).rejects.toThrow(
        ConflictException
      );
    });
  });

  describe('createCartItem', () => {
    it('should create cart item successfully', async () => {
      const createDto = {
        ...MockDataFactory.createCartItemDto,
        userId: 'user-mock-001',
        menuVariantId: 'variant-001',
      };
      const mockVariant = {
        id: 'variant-001',
        price: 15.99,
        isAvailable: true,
        menu: { id: 'menu-001', addonGroups: [] },
      };

      cartRepository.findOne.mockResolvedValue(MockDataFactory.mockCart);
      menuVariantRepository.findOne.mockResolvedValue(mockVariant);
      cartItemRepository.save.mockResolvedValue({ ...createDto, id: 'cartitem-001' });

      const result = await service.createCartItem(createDto);

      expect(result).toEqual({ message: 'CartItem successfully created.' });
      expect(cartItemRepository.save).toHaveBeenCalled();
    });

    it('should create cart if not exists', async () => {
      const createDto = {
        ...MockDataFactory.createCartItemDto,
        userId: 'user-mock-001',
        menuVariantId: 'variant-001',
      };
      const mockVariant = {
        id: 'variant-001',
        price: 15.99,
        isAvailable: true,
        menu: { id: 'menu-001', addonGroups: [] },
      };

      cartRepository.findOne
        .mockResolvedValueOnce(null) // No existing cart
        .mockResolvedValueOnce(null); // For createCart check
      cartRepository.save.mockResolvedValue(MockDataFactory.mockCart);
      menuVariantRepository.findOne.mockResolvedValue(mockVariant);
      cartItemRepository.save.mockResolvedValue({ ...createDto, id: 'cartitem-001' });

      const result = await service.createCartItem(createDto);

      expect(result).toEqual({ message: 'CartItem successfully created.' });
      expect(cartRepository.save).toHaveBeenCalled();
    });

    it('should create cart item with addons', async () => {
      const createDto = {
        ...MockDataFactory.createCartItemDto,
        userId: 'user-mock-001',
        menuVariantId: 'variant-001',
        addonInfo: [{ addonsId: 'addon-001', quantity: 1 }],
      };
      const mockVariant = {
        id: 'variant-001',
        price: 15.99,
        isAvailable: true,
        menu: { 
          id: 'menu-001', 
          addonGroups: [{
            id: 'group-001',
            addons: [{ id: 'addon-001' }],
            isRequired: false,
          }]
        },
      };

      cartRepository.findOne.mockResolvedValue(MockDataFactory.mockCart);
      menuVariantRepository.findOne.mockResolvedValue(mockVariant);
      addonsRepository.findOne.mockResolvedValue({ ...MockDataFactory.mockAddon, price: 2.50 });
      cartItemRepository.save.mockResolvedValue({ ...createDto, id: 'cartitem-001' });
      cartItemAddonsRepository.save.mockResolvedValue({});

      const result = await service.createCartItem(createDto);

      expect(result).toEqual({ message: 'CartItem successfully created.' });
      expect(cartItemAddonsRepository.save).toHaveBeenCalled();
    });

    it('should throw BadRequestException if variant not available', async () => {
      const createDto = {
        ...MockDataFactory.createCartItemDto,
        userId: 'user-mock-001',
        menuVariantId: 'variant-001',
      };
      const mockVariant = {
        id: 'variant-001',
        price: 15.99,
        isAvailable: false,
        menu: { id: 'menu-001', addonGroups: [] },
      };

      cartRepository.findOne.mockResolvedValue(MockDataFactory.mockCart);
      menuVariantRepository.findOne.mockResolvedValue(mockVariant);

      await expect(service.createCartItem(createDto)).rejects.toThrow(
        BadRequestException
      );
    });

    it('should throw BadRequestException if required addon group not selected', async () => {
      const createDto = {
        ...MockDataFactory.createCartItemDto,
        userId: 'user-mock-001',
        menuVariantId: 'variant-001',
        addonInfo: [],
      };
      const mockVariant = {
        id: 'variant-001',
        price: 15.99,
        isAvailable: true,
        menu: { 
          id: 'menu-001', 
          addonGroups: [{
            id: 'group-001',
            name: 'Size',
            addons: [{ id: 'addon-001' }],
            isRequired: true,
          }]
        },
      };

      cartRepository.findOne.mockResolvedValue(MockDataFactory.mockCart);
      menuVariantRepository.findOne.mockResolvedValue(mockVariant);

      await expect(service.createCartItem(createDto)).rejects.toThrow(
        BadRequestException
      );
    });
  });

  describe('findUserCart', () => {
    it('should return user cart', async () => {
      const mockCart = {
        ...MockDataFactory.mockCart,
        cartItems: [
          {
            ...MockDataFactory.mockCartItem,
            menu: MockDataFactory.mockMenu,
            menuVariant: { name: 'Regular' },
            addOns: [],
          },
        ],
      };

      cartRepository.findOne.mockResolvedValue(mockCart);

      const result = await service.findUserCart({}, 'user-mock-001');

      expect(result).toBeDefined();
      expect(result.userId).toBe('user-mock-001');
    });

    it('should group cart items by business', async () => {
      const mockCart = {
        ...MockDataFactory.mockCart,
        cartItems: [
          {
            ...MockDataFactory.mockCartItem,
            menu: { ...MockDataFactory.mockMenu, businessId: 'biz-001' },
            menuVariant: { name: 'Regular' },
            addOns: [],
          },
        ],
      };

      cartRepository.findOne.mockResolvedValue(mockCart);

      const result = await service.findUserCart({ groupBy: 'business' }, 'user-mock-001');

      expect(result.business).toBeDefined();
      expect(result.business['biz-001']).toBeDefined();
    });
  });

  describe('updateCartItem', () => {
    it('should update cart item quantity', async () => {
      const mockCartItem = {
        ...MockDataFactory.mockCartItem,
        menu: MockDataFactory.mockMenu,
        menuVariant: { id: 'variant-001', name: 'Regular' },
        addOns: [],
      };
      const mockVariant = {
        id: 'variant-001',
        price: 15.99,
        isAvailable: true,
        menu: { id: 'menu-001', addonGroups: [] },
      };

      cartItemRepository.findOne.mockResolvedValue(mockCartItem);
      menuVariantRepository.findOne.mockResolvedValue(mockVariant);
      cartItemAddonsRepository.remove.mockResolvedValue([]);
      cartItemRepository.save.mockResolvedValue({ ...mockCartItem, quantity: 3 });

      const result = await service.updateCartItem('user-mock-001', 'cartitem-001', { quantity: 3 });

      expect(result).toEqual({ message: 'The menu item was successfully updated.' });
    });

    it('should throw NotFoundException if quantity less than 1 and cart item not found', async () => {
      // When quantity < 1, service first tries to find cart item
      // If not found, throws NotFoundException before checking quantity
      cartItemRepository.findOne.mockResolvedValue(null);

      await expect(
        service.updateCartItem('user-mock-001', 'cartitem-001', { quantity: 0 })
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException if cart item not found', async () => {
      cartItemRepository.findOne.mockResolvedValue(null);

      await expect(
        service.updateCartItem('user-mock-001', 'invalid-id', { quantity: 2 })
      ).rejects.toThrow(NotFoundException);
    });

    it('should update cart item addons', async () => {
      const mockCartItem = {
        ...MockDataFactory.mockCartItem,
        menu: MockDataFactory.mockMenu,
        menuVariant: { id: 'variant-001', name: 'Regular' },
        addOns: [],
      };
      const mockVariant = {
        id: 'variant-001',
        price: 15.99,
        isAvailable: true,
        menu: { 
          id: 'menu-001', 
          addonGroups: [{
            id: 'group-001',
            addons: [{ id: 'addon-002' }],
            isRequired: false,
          }]
        },
      };

      cartItemRepository.findOne.mockResolvedValue(mockCartItem);
      menuVariantRepository.findOne.mockResolvedValue(mockVariant);
      cartItemAddonsRepository.remove.mockResolvedValue([]);
      cartItemAddonsRepository.create.mockReturnValue({});
      cartItemAddonsRepository.save.mockResolvedValue([]);
      cartItemRepository.save.mockResolvedValue(mockCartItem);

      const result = await service.updateCartItem('user-mock-001', 'cartitem-001', {
        quantity: 2,
        addonInfo: [{ addOnId: 'addon-002', quantity: 1 }],
      });

      expect(result).toEqual({ message: 'The menu item was successfully updated.' });
    });
  });

  describe('deleteCart', () => {
    it('should delete cart successfully', async () => {
      cartRepository.delete.mockResolvedValue({ affected: 1 });

      const result = await service.deleteCart('cart-001', 'user-mock-001');

      expect(result).toEqual({ message: 'Cart was successfully deleted.' });
      expect(cartRepository.delete).toHaveBeenCalledWith({
        id: 'cart-001',
        userId: 'user-mock-001',
      });
    });
  });

  describe('deleteCartItem', () => {
    it('should delete cart item successfully', async () => {
      cartItemRepository.findOne.mockResolvedValue(MockDataFactory.mockCartItem);
      cartItemRepository.delete.mockResolvedValue({ affected: 1 });

      const result = await service.deleteCartItem('user-mock-001', 'cartitem-001');

      expect(result).toEqual({ message: 'Cartitem was successfully deleted.' });
    });

    it('should throw NotFoundException if cart item not found', async () => {
      cartItemRepository.findOne.mockResolvedValue(null);

      await expect(
        service.deleteCartItem('user-mock-001', 'invalid-id')
      ).rejects.toThrow(NotFoundException);
    });
  });
});
