/**
 * Repository Mock Factory
 * Creates mock repositories for unit testing
 */

export const createMockRepository = () => ({
  find: jest.fn(),
  findOne: jest.fn(),
  findAndCount: jest.fn(),
  save: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
  count: jest.fn(),
  remove: jest.fn(),
  createQueryBuilder: jest.fn(() => ({
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    orWhere: jest.fn().mockReturnThis(),
    leftJoinAndSelect: jest.fn().mockReturnThis(),
    innerJoinAndSelect: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    take: jest.fn().mockReturnThis(),
    getOne: jest.fn(),
    getMany: jest.fn(),
    getManyAndCount: jest.fn(),
    execute: jest.fn(),
  })),
});

/**
 * Mock TypeORM Repository with common methods
 */
export class MockRepository<T = any> {
  private data: T[] = [];

  find = jest.fn().mockImplementation((options?: any) => {
    return Promise.resolve(this.data);
  });

  findOne = jest.fn().mockImplementation((options?: any) => {
    return Promise.resolve(this.data[0] || null);
  });

  findAndCount = jest.fn().mockImplementation((options?: any) => {
    return Promise.resolve([this.data, this.data.length]);
  });

  save = jest.fn().mockImplementation((entity: T) => {
    this.data.push(entity);
    return Promise.resolve(entity);
  });

  create = jest.fn().mockImplementation((entityLike: Partial<T>) => {
    return entityLike as T;
  });

  update = jest.fn().mockImplementation((criteria: any, partialEntity: any) => {
    return Promise.resolve({ affected: 1 });
  });

  delete = jest.fn().mockImplementation((criteria: any) => {
    return Promise.resolve({ affected: 1 });
  });

  count = jest.fn().mockImplementation((options?: any) => {
    return Promise.resolve(this.data.length);
  });

  remove = jest.fn().mockImplementation((entity: T) => {
    return Promise.resolve(entity);
  });

  // Helper methods for testing
  setData(data: T[]) {
    this.data = data;
  }

  getData() {
    return this.data;
  }

  clear() {
    this.data = [];
  }
}
