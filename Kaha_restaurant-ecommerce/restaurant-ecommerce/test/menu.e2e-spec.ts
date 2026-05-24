import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe, VersioningType } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { E2EAuthHelper } from './test-helpers/auth.helper';
import { DataSource } from 'typeorm';
import { DatabaseHelper } from './test-helpers/database.helper';

describe('Menu API (E2E)', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let adminToken: string;
  let testCategoryId: string;
  let testMenuId: string;

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
    adminToken = E2EAuthHelper.generateAdminToken();
  });

  beforeEach(async () => {
    const seededData = await DatabaseHelper.resetDatabase(dataSource);
    testCategoryId = seededData.categoryIds[1]; // Use the burger category
    testMenuId = seededData.menuIds[0];
  });

  afterAll(async () => {
    await DatabaseHelper.cleanDatabase(dataSource);
    await app.close();
  });

  describe('POST /api/v1/menu - Create Menu', () => {
    it('should create a menu item with valid data', () => {
      return request(app.getHttpServer())
        .post('/api/v1/menu')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'E2E Test Burger',
          categoryId: testCategoryId,
          description: 'Test burger',
          price: 19.99,
          isAvailable: true,
          allowAddOns: true,
        })
        .expect(201)
        .expect((res) => {
          expect(res.body.message).toBe('Menu created successfully.');
        });
    });

    it('should reject menu creation without auth', () => {
      return request(app.getHttpServer())
        .post('/api/v1/menu')
        .send({
          name: 'Unauthorized Menu',
          categoryId: testCategoryId,
          price: 15.99,
        })
        .expect(401);
    });

    it('should reject menu with invalid category', () => {
      return request(app.getHttpServer())
        .post('/api/v1/menu')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Test Menu',
          categoryId: '00000000-0000-0000-0000-000000000000',
          price: 15.99,
          isAvailable: true,
        })
        .expect(404);
    });

    it('should reject duplicate menu name', async () => {
      const menuData = {
        name: 'Duplicate Menu',
        categoryId: testCategoryId,
        price: 15.99,
        isAvailable: true,
        allowAddOns: false,
      };

      await request(app.getHttpServer())
        .post('/api/v1/menu')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(menuData)
        .expect(201);

      return request(app.getHttpServer())
        .post('/api/v1/menu')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(menuData)
        .expect(409);
    });

    it('should validate price is a number', () => {
      return request(app.getHttpServer())
        .post('/api/v1/menu')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Test Menu',
          categoryId: testCategoryId,
          price: 'expensive', // Invalid
          isAvailable: true,
        })
        .expect(400);
    });
  });

  describe('GET /api/v1/menu/:businessId - Get All Menus', () => {
    it('should return all menus for a business', () => {
      return request(app.getHttpServer())
        .get('/api/v1/menu/biz-e2e-001')
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('data');
          expect(res.body).toHaveProperty('metaData');
          expect(Array.isArray(res.body.data)).toBe(true);
        });
    });

    it('should support pagination', () => {
      return request(app.getHttpServer())
        .get('/api/v1/menu/biz-e2e-001?page=1&take=10')
        .expect(200)
        .expect((res) => {
          expect(res.body.metaData.currentPage).toBe(1);
          expect(res.body.metaData.perPage).toBe(10);
        });
    });

    it('should filter by category', () => {
      return request(app.getHttpServer())
        .get(`/api/v1/menu/biz-e2e-001?categoryId=${testCategoryId}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.data).toBeDefined();
        });
    });

    it('should filter by name', () => {
      return request(app.getHttpServer())
        .get('/api/v1/menu/biz-e2e-001?name=Burger')
        .expect(200);
    });

    it('should filter by price range', () => {
      return request(app.getHttpServer())
        .get('/api/v1/menu/biz-e2e-001?minPrice=10&maxPrice=20')
        .expect(200);
    });
  });

  describe('GET /api/v1/menu/:id - Get Menu by ID', () => {
    it('should return a specific menu item', () => {
      return request(app.getHttpServer())
        .get(`/api/v1/menu/${testMenuId}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.id).toBe(testMenuId);
          expect(res.body.name).toContain('E2E Test Burger');
        });
    });
  });

  describe('PATCH /api/v1/menu/:id - Update Menu', () => {
    it('should update a menu item', () => {
      return request(app.getHttpServer())
        .patch(`/api/v1/menu/${testMenuId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Updated E2E Burger',
          categoryId: testCategoryId,
          price: 17.99,
          isAvailable: true,
        })
        .expect(200)
        .expect((res) => {
          expect(res.body.message).toContain('successfully updated');
        });
    });

    it('should reject update without auth', () => {
      return request(app.getHttpServer())
        .patch(`/api/v1/menu/${testMenuId}`)
        .send({
          name: 'Unauthorized Update',
          categoryId: testCategoryId,
          price: 20.00,
        })
        .expect(401);
    });
  });

  describe('DELETE /api/v1/menu/:id - Delete Menu', () => {
    it('should delete a menu item', () => {
      return request(app.getHttpServer())
        .delete(`/api/v1/menu/${testMenuId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.message).toContain('successfully deleted');
        });
    });

    it('should reject delete without auth', () => {
      return request(app.getHttpServer())
        .delete(`/api/v1/menu/${testMenuId}`)
        .expect(401);
    });
  });

  describe('PATCH /api/v1/menu/toggle-signature/:id - Toggle Signature', () => {
    it('should mark menu as signature', () => {
      return request(app.getHttpServer())
        .patch(`/api/v1/menu/toggle-signature/${testMenuId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ isSignature: true })
        .expect(200)
        .expect((res) => {
          expect(res.body.message).toContain('signature');
        });
    });

    it('should enforce signature menu limit (max 3)', async () => {
      // Create and mark 3 menus as signature
      for (let i = 1; i <= 3; i++) {
        await dataSource.query(`
          INSERT INTO "menu_entity" (name, "businessId", "categoryId", price, "isAvailable", "isSignature", "createdAt", "updatedAt")
          VALUES ('Signature ${i}', 'biz-e2e-001', $1, 20.00, true, true, NOW(), NOW())
        `, [testCategoryId]);
      }

      // Try to mark 4th menu as signature
      return request(app.getHttpServer())
        .patch(`/api/v1/menu/toggle-signature/${testMenuId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ isSignature: true })
        .expect(400)
        .expect((res) => {
          expect(res.body.message).toContain('maximum limit');
        });
    });
  });
});
