import 'reflect-metadata';
import { validate } from 'class-validator';
import { plainToClass } from 'class-transformer';
import { CreateCategoryDto, UpdateCategoryDto } from '../dtos';

describe('Category DTO Validation', () => {
  describe('CreateCategoryDto', () => {
    it('should accept valid category data', async () => {
      const dto = plainToClass(CreateCategoryDto, {
        name: 'Burgers',
        description: 'Delicious burgers',
        icon: 'burger-icon.png',
        isActive: true,
        sortOrder: 1,
      });

      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('should reject missing name', async () => {
      const dto = plainToClass(CreateCategoryDto, {
        description: 'Test',
        icon: 'icon.png',
      });

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('name');
    });

    it('should reject empty name', async () => {
      const dto = plainToClass(CreateCategoryDto, {
        name: '',
        description: 'Test',
      });

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
    });

    it('should accept optional fields as undefined', async () => {
      const dto = plainToClass(CreateCategoryDto, {
        name: 'Test Category',
      });

      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('should accept parentId when provided', async () => {
      const dto = plainToClass(CreateCategoryDto, {
        name: 'Sub Category',
        parentId: 'parent-cat-001',
      });

      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('should reject non-boolean isAvailable', async () => {
      const dto = plainToClass(CreateCategoryDto, {
        name: 'Test',
        isAvailable: 'yes' as any,
      });

      const errors = await validate(dto);
      expect(errors.some(e => e.property === 'isAvailable')).toBe(true);
    });

    it('should reject non-number position', async () => {
      const dto = plainToClass(CreateCategoryDto, {
        name: 'Test',
        position: 'first' as any,
      });

      const errors = await validate(dto);
      expect(errors.some(e => e.property === 'position')).toBe(true);
    });

    it('should transform string number to number for position', async () => {
      const dto = plainToClass(CreateCategoryDto, {
        name: 'Test',
        position: '5',
      });

      const errors = await validate(dto);
      expect(errors.length).toBe(0);
      expect(typeof dto.position).toBe('number');
      expect(dto.position).toBe(5);
    });
  });

  describe('UpdateCategoryDto', () => {
    it('should accept valid update data', async () => {
      const dto = plainToClass(UpdateCategoryDto, {
        name: 'Updated Category',
        description: 'Updated description',
        icon: 'new-icon.png',
        isActive: false,
        sortOrder: 2,
      });

      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('should reject missing name', async () => {
      const dto = plainToClass(UpdateCategoryDto, {
        description: 'Updated',
      });

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('name');
    });

    it('should accept partial updates', async () => {
      const dto = plainToClass(UpdateCategoryDto, {
        name: 'Updated Name',
        isActive: false,
      });

      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('should accept parentId for moving category', async () => {
      const dto = plainToClass(UpdateCategoryDto, {
        name: 'Category',
        isActive: true,
        parentId: 'new-parent-001',
      });

      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });
  });
});
