# Unit Tests Guide

## Overview
This document describes the unit testing setup for the KAHA Restaurant E-commerce API.

## Test Structure

```
src/
├── test-utils/                    # Shared test utilities
│   ├── mock-data.factory.ts      # Mock data for all tests
│   ├── jwt-test.helper.ts        # JWT token generation
│   ├── repository.mock.ts        # Repository mocks
│   └── index.ts                  # Exports
├── modules/
│   ├── category/__tests__/
│   │   ├── category.service.spec.ts
│   │   └── category-dto.validation.spec.ts
│   ├── menu/__tests__/
│   │   ├── menu.service.spec.ts
│   │   └── menu-dto.validation.spec.ts
│   ├── addon-groups/__tests__/
│   │   ├── addon-groups.service.spec.ts
│   │   └── validation.spec.ts
│   ├── cart/__tests__/
│   │   └── cart.service.spec.ts
│   └── auth/__tests__/
│       ├── jwt.strategy.spec.ts
│       └── roles.guard.spec.ts
```

## Running Tests

### Run All Tests
```bash
npm test
```

### Run Tests in Watch Mode
```bash
npm run test:watch
```

### Run Tests with Coverage
```bash
npm run test:cov
```

### Run Specific Test File
```bash
npm test -- category.service.spec
```

### Run Tests for Specific Module
```bash
npm test -- modules/category
```

## Test Categories

### 1. Service Tests
Test business logic in isolation with mocked dependencies.

**Example:**
```typescript
describe('CategoryService', () => {
  let service: CategoryService;
  let repository: any;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        CategoryService,
        {
          provide: CategoryRepository,
          useValue: createMockRepository(),
        },
      ],
    }).compile();

    service = module.get<CategoryService>(CategoryService);
    repository = module.get<CategoryRepository>(CategoryRepository);
  });

  it('should create a category', async () => {
    repository.save.mockResolvedValue({ id: 'cat-001' });
    const result = await service.createCategory(dto);
    expect(result).toBeDefined();
  });
});
```

### 2. DTO Validation Tests
Test input validation using class-validator.

**Example:**
```typescript
describe('CreateCategoryDto', () => {
  it('should accept valid data', async () => {
    const dto = plainToClass(CreateCategoryDto, {
      name: 'Burgers',
      description: 'Delicious burgers',
    });

    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it('should reject missing name', async () => {
    const dto = plainToClass(CreateCategoryDto, {
      description: 'Test',
    });

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });
});
```

### 3. Guard Tests
Test authentication and authorization guards.

**Example:**
```typescript
describe('RolesGuard', () => {
  it('should allow access if user has required role', () => {
    const context = createMockExecutionContext(mockUser);
    jest.spyOn(reflector, 'get').mockReturnValue([UserRoleEnum.BUSINESS_SUPER_ADMIN]);

    const result = guard.canActivate(context);
    expect(result).toBe(true);
  });
});
```

### 4. Strategy Tests
Test JWT authentication strategy.

**Example:**
```typescript
describe('JwtStrategy', () => {
  it('should validate and return user payload', async () => {
    serviceCommunicationService.getBusinessUserRoles.mockResolvedValue(['BUSINESS_SUPER_ADMIN']);

    const result = await strategy.validate(payload);
    expect(result.role).toBe('BUSINESS_SUPER_ADMIN');
  });
});
```

## Test Utilities

### Mock Data Factory
Provides consistent test data across all tests.

```typescript
import { MockDataFactory } from 'test-utils';

// Use in tests
const mockUser = MockDataFactory.mockUser;
const mockCategory = MockDataFactory.mockCategory;
const createDto = MockDataFactory.createCategoryDto;
```

### JWT Test Helper
Generate valid JWT tokens for testing.

```typescript
import { JwtTestHelper } from 'test-utils';

const adminToken = JwtTestHelper.generateAdminToken();
const ownerToken = JwtTestHelper.generateOwnerToken();
const userToken = JwtTestHelper.generateUserToken();
```

### Repository Mocks
Create mock repositories with common methods.

```typescript
import { createMockRepository } from 'test-utils';

const mockRepo = createMockRepository();
mockRepo.findOne.mockResolvedValue(mockData);
mockRepo.save.mockResolvedValue(savedData);
```

## Best Practices

### 1. Test Isolation
- Each test should be independent
- Use `beforeEach` to reset state
- Use `afterEach` to clear mocks

```typescript
afterEach(() => {
  jest.clearAllMocks();
});
```

### 2. Descriptive Test Names
```typescript
// Good
it('should throw ConflictException if category name already exists', async () => {});

// Bad
it('should fail', async () => {});
```

### 3. Arrange-Act-Assert Pattern
```typescript
it('should create a category', async () => {
  // Arrange
  const createDto = MockDataFactory.createCategoryDto;
  repository.save.mockResolvedValue({ id: 'cat-001' });

  // Act
  const result = await service.createCategory(createDto);

  // Assert
  expect(result).toBeDefined();
  expect(repository.save).toHaveBeenCalled();
});
```

### 4. Test Edge Cases
- Null/undefined inputs
- Empty arrays/objects
- Boundary values
- Error conditions

### 5. Mock External Dependencies
- Always mock repositories
- Mock external services
- Mock HTTP calls

## Coverage Goals

- **Statements**: > 80%
- **Branches**: > 75%
- **Functions**: > 80%
- **Lines**: > 80%

## Current Test Coverage

### Modules Tested
- ✅ Category (Service + DTO Validation)
- ✅ Menu (Service + DTO Validation)
- ✅ Addon Groups (Service)
- ✅ Cart (Service)
- ✅ Auth (JWT Strategy + Roles Guard)

### Modules Pending
- ⏳ Order (Integration tests recommended)
- ⏳ Service Communication (Mock auth tests)

## Troubleshooting

### Tests Failing with Module Resolution Errors
Ensure `moduleNameMapper` in `package.json` jest config matches `tsconfig.json` paths.

### Mock Not Working
```typescript
// Clear mocks between tests
afterEach(() => {
  jest.clearAllMocks();
});

// Reset mock implementation
mockRepo.findOne.mockReset();
mockRepo.findOne.mockResolvedValue(newValue);
```

### Async Test Timeout
```typescript
it('should handle long operation', async () => {
  // Increase timeout for specific test
}, 10000); // 10 seconds
```

## Next Steps

1. **Integration Tests**: Test API endpoints with real database
2. **E2E Tests**: Full application tests with supertest
3. **Performance Tests**: Load testing for critical endpoints
4. **Contract Tests**: API contract validation

## Resources

- [NestJS Testing Documentation](https://docs.nestjs.com/fundamentals/testing)
- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [Testing Best Practices](https://github.com/goldbergyoni/javascript-testing-best-practices)
