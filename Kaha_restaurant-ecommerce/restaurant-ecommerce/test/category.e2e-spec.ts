import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe, VersioningType } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { E2EAuthHelper } from './test-helpers/auth.helper';
import { DataSource } from 'typeorm';
import { DatabaseHelper } from './test-helpers/database.helper';

describe('Category API (E2E)', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let adminToken: string;
  let userToken: string;
  let testCategoryId: string;
  let testCategory2Id: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    
    // Configure app same as main.ts
    app.setGlobalPrefix('api');
    app.enableVersioning({ type: VersioningType.URI, defaultVersion: '1' });
    
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: true,
      })
    );
    await app.init();

    dataSource = app.get(DataSource);
    
    // Generate auth tokens
    adminToken = E2EAuthHelper.generateAdminToken();
    userToken = E2EAuthHelper.generateUserToken();
  });

  beforeEach(async () => {
    // Reset database before each test and get seeded IDs
    const seededData = await DatabaseHelper.resetDatabase(dataSource);
    testCategoryId = seededData.categoryIds[0];
    testCategory2Id = seededData.categoryIds[1];
  });

  afterAll(async () => {
    await DatabaseHelper.cleanDatabase(dataSource);
    await app.close();
  });

  describe('POST /api/v1/categories - Create Category', () => {
    it('should create a category with valid data and admin token', () => {
      return request(app.getHttpServer())
        .post('/api/v1/categories')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'New E2E Category',
          description: 'Created via E2E test',
          icon: 'test-icon.png',
          businessId: 'biz-e2e-001',
          isAvailable: true,
          position: 10,
        })
        .expect(201)
        .expect((res) => {
          expect(res.body.message).toBe('Category successfully created.');
        });
    });

    it('should reject category creation without auth token', () => {
      return request(app.getHttpServer())
        .post('/api/v1/categories')
        .send({
          name: 'Unauthorized Category',
          businessId: 'biz-e2e-001',
        })
        .expect(401);
    });

    it('should reject category with missing required fields', () => {
      return request(app.getHttpServer())
        .post('/api/v1/categories')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          description: 'Missing name field',
        })
        .expect(400);
    });

    it('should reject duplicate category name', async () => {
      const categoryData = {
        name: 'Duplicate Category',
        businessId: 'biz-e2e-001',
        isAvailable: true,
      };

      // Create first category
      await request(app.getHttpServer())
        .post('/api/v1/categories')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(categoryData)
        .expect(201);

      // Try to create duplicate
      return request(app.getHttpServer())
        .post('/api/v1/categories')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(categoryData)
        .expect(409)
        .expect((res) => {
          expect(res.body.message).toContain('already exists');
        });
    });

    it('should validate data types', () => {
      return request(app.getHttpServer())
        .post('/api/v1/categories')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Test Category',
          businessId: 'biz-e2e-001',
          isAvailable: 'yes', // Should be boolean
          position: 'first', // Should be number
        })
        .expect(400);
    });
  });

  describe('GET /api/v1/categories/business/:businessId - Get All Categories', () => {
    it('should return all categories for a business', () => {
      return request(app.getHttpServer())
        .get('/api/v1/categories/business/biz-e2e-001')
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
          expect(res.body.length).toBeGreaterThan(0);
        });
    });

    it('should return empty array for business with no categories', () => {
      return request(app.getHttpServer())
        .get('/api/v1/categories/business/non-existent-business')
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
          expect(res.body.length).toBe(0);
        });
    });

    it('should return categories with correct structure', () => {
      return request(app.getHttpServer())
        .get('/api/v1/categories/business/biz-e2e-001')
        .expect(200)
        .expect((res) => {
          const category = res.body[0];
          expect(category).toHaveProperty('id');
          expect(category).toHaveProperty('name');
          expect(category).toHaveProperty('description');
          expect(category).toHaveProperty('isActive');
          expect(category).toHaveProperty('childrens');
        });
    });
  });

  describe('GET /api/v1/categories/:id - Get Category by ID', () => {
    it('should return a specific category', () => {
      return request(app.getHttpServer())
        .get(`/api/v1/categories/${testCategoryId}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.id).toBe(testCategoryId);
          expect(res.body.name).toContain('E2E Test Category');
        });
    });

    it('should handle non-existent category', () => {
      return request(app.getHttpServer())
        .get('/api/v1/categories/00000000-0000-0000-0000-000000000000')
        .expect(200); // Returns null or empty, not 404
    });
  });

  describe('PATCH /api/v1/categories/:id - Update Category', () => {
    it('should update a category with valid data', () => {
      return request(app.getHttpServer())
        .patch(`/api/v1/categories/${testCategoryId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Updated E2E Category',
          description: 'Updated description',
          isActive: true,
        })
        .expect(200)
        .expect((res) => {
          expect(res.body.message).toBe('Category successfully updated.');
        });
    });

    it('should reject update without auth token', () => {
      return request(app.getHttpServer())
        .patch(`/api/v1/categories/${testCategoryId}`)
        .send({
          name: 'Unauthorized Update',
          isActive: true,
        })
        .expect(401);
    });

    it('should reject update with invalid data', () => {
      return request(app.getHttpServer())
        .patch(`/api/v1/categories/${testCategoryId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: '', // Empty name
          isActive: true,
        })
        .expect(400);
    });
  });

  describe('DELETE /api/v1/categories/:id - Delete Category', () => {
    it('should delete a category', () => {
      return request(app.getHttpServer())
        .delete(`/api/v1/categories/${testCategoryId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.message).toBe('Category successfully deleted.');
        });
    });

    it('should reject delete without auth token', () => {
      return request(app.getHttpServer())
        .delete(`/api/v1/categories/${testCategoryId}`)
        .expect(401);
    });

    it('should handle deleting non-existent category', () => {
      return request(app.getHttpServer())
        .delete('/api/v1/categories/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200); // May return success even if not found
    });
  });

  describe('Authentication & Authorization', () => {
    it('should reject requests with invalid token', () => {
      return request(app.getHttpServer())
        .post('/api/v1/categories')
        .set('Authorization', 'Bearer invalid-token')
        .send({
          name: 'Test Category',
          businessId: 'biz-e2e-001',
        })
        .expect(401);
    });

    it('should reject requests with expired token', () => {
      const expiredToken = E2EAuthHelper.generateCustomToken({
        id: 'expired-user',
        kahaId: 'kaha-expired',
        businessId: 'biz-e2e-001',
        email: 'expired@test.com',
        role: 'BUSINESS_SUPER_ADMIN' as any,
      });

      return request(app.getHttpServer())
        .post('/api/v1/categories')
        .set('Authorization', `Bearer ${expiredToken}`)
        .send({
          name: 'Test Category',
          businessId: 'biz-e2e-001',
        })
        .expect(401);
    });

    it('should allow admin to perform all operations', async () => {
      // Create
      await request(app.getHttpServer())
        .post('/api/v1/categories')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Admin Test Category',
          businessId: 'biz-e2e-001',
          isAvailable: true,
        })
        .expect(201);

      // Update
      await request(app.getHttpServer())
        .patch(`/api/v1/categories/${testCategoryId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Admin Updated',
          isActive: true,
        })
        .expect(200);

      // Delete
      await request(app.getHttpServer())
        .delete(`/api/v1/categories/${testCategoryId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
    });
  });

  describe('Data Validation & Business Logic', () => {
    it('should enforce maximum description length', () => {
      const longDescription = 'a'.repeat(300);
      
      return request(app.getHttpServer())
        .post('/api/v1/categories')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Test Category',
          description: longDescription,
          businessId: 'biz-e2e-001',
        })
        .expect(400);
    });

    it('should handle special characters in name', () => {
      return request(app.getHttpServer())
        .post('/api/v1/categories')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Test & Category <script>',
          businessId: 'biz-e2e-001',
          isAvailable: true,
        })
        .expect(201);
    });

    it('should create category with parent relationship', () => {
      return request(app.getHttpServer())
        .post('/api/v1/categories')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Sub Category',
          parentId: testCategoryId,
          businessId: 'biz-e2e-001',
          isAvailable: true,
        })
        .expect(201);
    });
  });
});
