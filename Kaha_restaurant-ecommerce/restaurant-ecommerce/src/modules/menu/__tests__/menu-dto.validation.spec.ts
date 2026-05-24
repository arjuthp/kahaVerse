import 'reflect-metadata';
import { validate } from 'class-validator';
import { plainToClass } from 'class-transformer';
import { CreateMenuDto, UpdateMenuDto } from '../dtos';
import { MenuServiceEnum } from 'common/enums';

describe('Menu DTO Validation', () => {
  describe('CreateMenuDto', () => {
    it('should accept valid menu data', async () => {
      const dto = plainToClass(CreateMenuDto, {
        name: 'Burger',
        categoryId: 'cat-001',
        description: 'Delicious burger',
        price: 15.99,
        isAvailable: true,
        allowAddOns: true,
      });

      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('should reject missing name', async () => {
      const dto = plainToClass(CreateMenuDto, {
        categoryId: 'cat-001',
        price: 15.99,
      });

      const errors = await validate(dto);
      expect(errors.some(e => e.property === 'name')).toBe(true);
    });

    it('should reject missing categoryId', async () => {
      const dto = plainToClass(CreateMenuDto, {
        name: 'Burger',
        price: 15.99,
      });

      const errors = await validate(dto);
      expect(errors.some(e => e.property === 'categoryId')).toBe(true);
    });

    it('should reject missing price', async () => {
      const dto = plainToClass(CreateMenuDto, {
        name: 'Burger',
        categoryId: 'cat-001',
      });

      const errors = await validate(dto);
      expect(errors.some(e => e.property === 'price')).toBe(true);
    });

    it('should transform string price to number', async () => {
      const dto = plainToClass(CreateMenuDto, {
        name: 'Burger',
        categoryId: 'cat-001',
        price: '15.99',
      });

      const errors = await validate(dto);
      expect(errors.length).toBe(0);
      expect(typeof dto.price).toBe('number');
      expect(dto.price).toBe(15.99);
    });

    it('should reject non-numeric price', async () => {
      const dto = plainToClass(CreateMenuDto, {
        name: 'Burger',
        categoryId: 'cat-001',
        price: 'expensive' as any,
      });

      const errors = await validate(dto);
      expect(errors.some(e => e.property === 'price')).toBe(true);
    });

    it('should accept valid service enums', async () => {
      const dto = plainToClass(CreateMenuDto, {
        name: 'Burger',
        categoryId: 'cat-001',
        price: 15.99,
        services: [MenuServiceEnum.DINE_IN, MenuServiceEnum.TAKEAWAY],
      });

      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('should reject invalid service enum', async () => {
      const dto = plainToClass(CreateMenuDto, {
        name: 'Burger',
        categoryId: 'cat-001',
        price: 15.99,
        services: ['invalid_service'] as any,
      });

      const errors = await validate(dto);
      expect(errors.some(e => e.property === 'services')).toBe(true);
    });

    it('should accept optional fields', async () => {
      const dto = plainToClass(CreateMenuDto, {
        name: 'Burger',
        categoryId: 'cat-001',
        price: 15.99,
        description: 'Optional description',
        details: { calories: '500 kcal' },
        images: ['image1.jpg'],
        isBarItem: false,
        isSignature: false,
        discountedPrice: 12.99,
      });

      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('should accept addOnIds array', async () => {
      const dto = plainToClass(CreateMenuDto, {
        name: 'Burger',
        categoryId: 'cat-001',
        price: 15.99,
        addOnIds: ['addon-001', 'addon-002'],
      });

      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('should reject non-boolean isAvailable', async () => {
      const dto = plainToClass(CreateMenuDto, {
        name: 'Burger',
        categoryId: 'cat-001',
        price: 15.99,
        isAvailable: 'yes' as any,
      });

      const errors = await validate(dto);
      expect(errors.some(e => e.property === 'isAvailable')).toBe(true);
    });

    it('should accept details as object', async () => {
      const dto = plainToClass(CreateMenuDto, {
        name: 'Burger',
        categoryId: 'cat-001',
        price: 15.99,
        details: { 
          calories: '500 kcal',
          allergens: 'Gluten, Dairy'
        },
      });

      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });
  });

  describe('UpdateMenuDto', () => {
    it('should accept valid update data', async () => {
      const dto = plainToClass(UpdateMenuDto, {
        name: 'Updated Burger',
        categoryId: 'cat-001',
        description: 'Updated description',
        price: 17.99,
        isAvailable: false,
      });

      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('should reject missing required fields', async () => {
      const dto = plainToClass(UpdateMenuDto, {
        description: 'Updated',
      });

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
    });

    it('should transform string price to number', async () => {
      const dto = plainToClass(UpdateMenuDto, {
        name: 'Burger',
        categoryId: 'cat-001',
        price: '19.99',
      });

      const errors = await validate(dto);
      expect(errors.length).toBe(0);
      expect(typeof dto.price).toBe('number');
      expect(dto.price).toBe(19.99);
    });

    it('should accept optional discountedPrice', async () => {
      const dto = plainToClass(UpdateMenuDto, {
        name: 'Burger',
        categoryId: 'cat-001',
        price: 19.99,
        discountedPrice: 15.99,
      });

      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('should transform string discountedPrice to number', async () => {
      const dto = plainToClass(UpdateMenuDto, {
        name: 'Burger',
        categoryId: 'cat-001',
        price: 19.99,
        discountedPrice: '15.99',
      });

      const errors = await validate(dto);
      expect(errors.length).toBe(0);
      expect(typeof dto.discountedPrice).toBe('number');
    });

    it('should accept all optional fields', async () => {
      const dto = plainToClass(UpdateMenuDto, {
        name: 'Updated Burger',
        categoryId: 'cat-001',
        price: 19.99,
        description: 'New description',
        details: { calories: '600 kcal' },
        services: [MenuServiceEnum.HOME_DELIVERY],
        images: ['new-image.jpg'],
        isBarItem: true,
        isSignature: true,
        isAvailable: true,
        allowAddOns: true,
        addOnIds: ['addon-003'],
        discountedPrice: 16.99,
      });

      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });
  });
});
