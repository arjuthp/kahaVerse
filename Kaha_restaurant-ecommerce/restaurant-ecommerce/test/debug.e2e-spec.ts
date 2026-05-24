import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';

describe('Debug API Routes (E2E)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api'); // Make sure global prefix is set
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('should respond to root path', () => {
    return request(app.getHttpServer())
      .get('/')
      .expect(200);
  });

  it('should respond to /api path', () => {
    return request(app.getHttpServer())
      .get('/api')
      .expect(404); // Expected since there's no route at /api
  });

  it('should list available routes', async () => {
    const server = app.getHttpServer();
    const router = server._events.request._router;
    
    console.log('Available routes:');
    if (router && router.stack) {
      router.stack.forEach((layer: any) => {
        if (layer.route) {
          const methods = Object.keys(layer.route.methods).join(',').toUpperCase();
          console.log(`${methods} ${layer.route.path}`);
        }
      });
    }
  });
});
