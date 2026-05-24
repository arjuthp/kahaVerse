# E2E & Integration Tests Guide

## Overview
End-to-End (E2E) tests validate the complete application flow from HTTP request to database and back. These tests use real HTTP requests, real database operations, and mock authentication.

## Test Environment

### Configuration
- **Environment**: Local development
- **Database**: Local PostgreSQL (test database)
- **Authentication**: Mock JWT tokens
- **Server**: NestJS application with all modules loaded

### Environment Variables (`.env.test`)
```env
NODE_ENV=test
DB_NAME=kaha_restaurant_test
USE_MOCK_AUTH=true
JWT_SECRET=test-secret-key-for-e2e-tests
```

---

## Test Structure

```
test/
├── test-helpers/
│   ├── auth.helper.ts          # JWT token generation
│   └── database.helper.ts      # DB setup/cleanup
├── category.e2e-spec.ts        # Category API tests
├── menu.e2e-spec.ts            # Menu API tests
├── cart.e2e-spec.ts            # Cart API tests (to be created)
├── order.e2e-spec.ts           # Order API tests (to be created)
└── jest-e2e.json               # E2E Jest configuration
```

---

## Running E2E Tests

### Commands
```bash
# Run all E2E tests
npm run test:e2e

# Run specific E2E test file
npm run test:e2e -- category.e2e-spec

# Run with coverage
npm run test:e2e -- --coverage

# Watch mode
npm run test:e2e -- --watch
```

### Before Running
1. Ensure PostgreSQL is running
2. Create test database: `createdb kaha_restaurant_test`
3. Run migrations on test database
4. Set `USE_MOCK_AUTH=true` in `.env.test`

---

## Test Helpers

### 1. Auth Helper (`auth.helper.ts`)

Generates valid JWT tokens for testing:

```typescript
import { E2EAuthHelper } from './test-helpers/auth.helper';

// Generate admin token
const adminToken = E2EAuthHelper.generateAdminToken();

// Generate user token
const userToken = E2EAuthHelper.generateUserToken();

// Use in request
.set('Authorization', `Bearer ${adminToken}`)
```

**Mock Users:**
- **Admin**: `admin-e2e-001` (BUSINESS_SUPER_ADMIN)
- **User**: `user-e2e-001` (USER)
- **Business**: `biz-e2e-001`

### 2. Database Helper (`database.helper.ts`)

Manages test database:

```typescript
import { DatabaseHelper } from './test-helpers/database.helper';

// Clean all tables
await DatabaseHelper.cleanDatabase(dataSource);

// Seed test data
await DatabaseHelper.seedTestData(dataSource);

// Reset to clean state
await DatabaseHelper.resetDatabase(dataSource);
```

---

## Test Categories

### 1. Category API Tests (`category.e2e-spec.ts`)

**Coverage:**
- ✅ Create category (POST)
- ✅ Get all categories (GET)
- ✅ Get category by ID (GET)
- ✅ Update category (PATCH)
- ✅ Delete category (DELETE)
- ✅ Authentication validation
- ✅ Authorization checks
- ✅ Data validation
- ✅ Business logic (duplicates, parent relationships)

**Test Count:** 20+ tests

### 2. Menu API Tests (`menu.e2e-spec.ts`)

**Coverage:**
- ✅ Create menu (POST)
- ✅ Get all menus with pagination (GET)
- ✅ Get menu by ID (GET)
- ✅ Update menu (PATCH)
- ✅ Delete menu (DELETE)
- ✅ Toggle signature menu
- ✅ Filtering (category, name, price)
- ✅ Signature menu limit (max 3)
- ✅ Authentication & authorization

**Test Count:** 15+ tests

---

## Test Patterns

### Basic E2E Test Structure

```typescript
describe('Feature API (E2E)', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let adminToken: string;

  beforeAll(async () => {
    // Setup application
    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();

    dataSource = app.get(DataSource);
    adminToken = E2EAuthHelper.generateAdminToken();
  });

  beforeEach(async () => {
    // Reset database before each test
    await DatabaseHelper.resetDatabase(dataSource);
  });

  afterAll(async () => {
    // Cleanup
    await DatabaseHelper.cleanDatabase(dataSource);
    await app.close();
  });

  it('should perform operation', () => {
    return request(app.getHttpServer())
      .post('/api/v1/endpoint')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ data: 'value' })
      .expect(201)
      .expect((res) => {
        expect(res.body.message).toBe('Success');
      });
  });
});
```

### Testing Authentication

```typescript
describe('Authentication', () => {
  it('should reject requests without token', () => {
    return request(app.getHttpServer())
      .post('/api/v1/protected-endpoint')
      .send({ data: 'value' })
      .expect(401);
  });

  it('should reject requests with invalid token', () => {
    return request(app.getHttpServer())
      .post('/api/v1/protected-endpoint')
      .set('Authorization', 'Bearer invalid-token')
      .send({ data: 'value' })
      .expect(401);
  });

  it('should allow requests with valid admin token', () => {
    return request(app.getHttpServer())
      .post('/api/v1/protected-endpoint')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ data: 'value' })
      .expect(201);
  });
});
```

### Testing Validation

```typescript
describe('Data Validation', () => {
  it('should reject missing required fields', () => {
    return request(app.getHttpServer())
      .post('/api/v1/endpoint')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ incomplete: 'data' })
      .expect(400);
  });

  it('should reject invalid data types', () => {
    return request(app.getHttpServer())
      .post('/api/v1/endpoint')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'Valid',
        price: 'not-a-number', // Invalid
      })
      .expect(400);
  });
});
```

### Testing Business Logic

```typescript
describe('Business Logic', () => {
  it('should enforce business rules', async () => {
    // Setup: Create initial data
    await request(app.getHttpServer())
      .post('/api/v1/endpoint')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ data: 'first' })
      .expect(201);

    // Test: Try to violate business rule
    return request(app.getHttpServer())
      .post('/api/v1/endpoint')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ data: 'first' }) // Duplicate
      .expect(409)
      .expect((res) => {
        expect(res.body.message).toContain('already exists');
      });
  });
});
```

---

## Test Data Management

### Seeded Test Data

**Categories:**
- `cat-e2e-001`: E2E Test Category
- `cat-e2e-002`: E2E Burgers

**Menus:**
- `menu-e2e-001`: E2E Test Burger

**Business:**
- `biz-e2e-001`: Test business

### Creating Additional Test Data

```typescript
// In test
await dataSource.query(`
  INSERT INTO table_name (id, field1, field2)
  VALUES ('test-id', 'value1', 'value2')
  ON CONFLICT (id) DO NOTHING;
`);
```

---

## Best Practices

### 1. Test Isolation
- ✅ Reset database before each test
- ✅ Use unique IDs for test data
- ✅ Clean up after tests

### 2. Descriptive Test Names
```typescript
// Good
it('should reject category creation without auth token', () => {});

// Bad
it('should fail', () => {});
```

### 3. Test One Thing
```typescript
// Good - Tests one scenario
it('should create category with valid data', () => {});

// Bad - Tests multiple scenarios
it('should create, update, and delete category', () => {});
```

### 4. Use Proper HTTP Status Codes
```typescript
.expect(201) // Created
.expect(200) // OK
.expect(400) // Bad Request
.expect(401) // Unauthorized
.expect(403) // Forbidden
.expect(404) // Not Found
.expect(409) // Conflict
```

### 5. Validate Response Structure
```typescript
.expect((res) => {
  expect(res.body).toHaveProperty('message');
  expect(res.body).toHaveProperty('data');
  expect(typeof res.body.data).toBe('object');
});
```

---

## Debugging E2E Tests

### Enable Detailed Logging
```typescript
beforeAll(async () => {
  app = moduleFixture.createNestApplication();
  app.useLogger(console); // Enable logging
  await app.init();
});
```

### Print Response Body
```typescript
.expect((res) => {
  console.log('Response:', JSON.stringify(res.body, null, 2));
  expect(res.body.message).toBe('Success');
});
```

### Check Database State
```typescript
it('should create record in database', async () => {
  await request(app.getHttpServer())
    .post('/api/v1/endpoint')
    .set('Authorization', `Bearer ${adminToken}`)
    .send({ name: 'Test' })
    .expect(201);

  // Verify in database
  const result = await dataSource.query(
    'SELECT * FROM table_name WHERE name = $1',
    ['Test']
  );
  expect(result.length).toBe(1);
});
```

---

## Coverage Goals

- **E2E Tests**: > 80% API endpoint coverage
- **Integration Tests**: > 70% module interaction coverage
- **Overall**: > 75% combined coverage

---

## Next Steps

### To Be Created:
1. ✅ Category E2E tests - **DONE**
2. ✅ Menu E2E tests - **DONE**
3. ⏳ Cart E2E tests
4. ⏳ Order E2E tests
5. ⏳ Addon Groups E2E tests
6. ⏳ Performance tests
7. ⏳ Load tests

---

## Troubleshooting

### Database Connection Issues
```bash
# Check PostgreSQL is running
sudo systemctl status postgresql

# Create test database
createdb kaha_restaurant_test

# Run migrations
npm run migration:run
```

### Authentication Issues
- Ensure `USE_MOCK_AUTH=true` in `.env.test`
- Check JWT_SECRET matches in test and app
- Verify token generation in auth.helper.ts

### Test Failures
- Check database is clean before tests
- Verify test data is seeded correctly
- Check for port conflicts (default: 3001)

---

## Resources

- [NestJS Testing Documentation](https://docs.nestjs.com/fundamentals/testing)
- [Supertest Documentation](https://github.com/visionmedia/supertest)
- [Jest E2E Testing](https://jestjs.io/docs/testing-frameworks)
