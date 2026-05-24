import 'reflect-metadata';
import { validate } from 'class-validator';
import { plainToClass } from 'class-transformer';
import { CreateAddonDto } from '../dtos';

describe('Addon DTO Validation with Type Transformation', () => {
  it('should accept numeric price', async () => {
    const dto = plainToClass(CreateAddonDto, {
      name: 'Premium Cheese',
      price: 1.50,
      description: 'Extra cheese',
    }) as any;

    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it('should accept string numeric price and transform it', async () => {
    const dto = plainToClass(CreateAddonDto, {
      name: 'Premium Cheese',
      price: '1.50',
      description: 'Extra cheese',
    }) as any;

    const errors = await validate(dto);
    expect(errors.length).toBe(0);
    expect(dto.price).toBe(1.50);
    expect(typeof dto.price).toBe('number');
  });

  it('should accept numeric sortOrder', async () => {
    const dto = plainToClass(CreateAddonDto, {
      name: 'Cheese',
      price: 1.50,
      sortOrder: 5,
    }) as any;

    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it('should accept string numeric sortOrder and transform it', async () => {
    const dto = plainToClass(CreateAddonDto, {
      name: 'Cheese',
      price: '1.50',
      sortOrder: '5',
    }) as any;

    const errors = await validate(dto);
    expect(errors.length).toBe(0);
    expect(dto.sortOrder).toBe(5);
    expect(typeof dto.sortOrder).toBe('number');
  });

  it('should reject non-numeric price', async () => {
    const dto = plainToClass(CreateAddonDto, {
      name: 'Cheese',
      price: 'invalid',
    }) as any;

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });

  it('should have name property', async () => {
    const dto = plainToClass(CreateAddonDto, {
      name: 'Premium Cheese',
      price: 1.50,
    }) as any;

    const errors = await validate(dto);
    expect(errors.length).toBe(0);
    expect(dto.name).toBe('Premium Cheese');
  });
});
