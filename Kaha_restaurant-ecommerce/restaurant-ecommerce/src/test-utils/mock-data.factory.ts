import { UserRoleEnum, MenuServiceEnum } from 'common/enums';

/**
 * Mock Data Factory for Tests
 * Provides consistent test data across all test suites
 */

export const MockDataFactory = {
  // Auth & User Data
  mockUser: {
    id: 'admin-mock-001',
    kahaId: 'kaha-admin-001',
    businessId: 'biz-mock-001',
    email: 'admin@test.com',
    role: UserRoleEnum.BUSINESS_SUPER_ADMIN,
  },

  mockOwner: {
    id: 'owner-mock-001',
    kahaId: 'kaha-owner-001',
    businessId: 'biz-mock-001',
    email: 'owner@test.com',
    role: UserRoleEnum.ADMIN,
  },

  mockRegularUser: {
    id: 'user-mock-001',
    kahaId: 'kaha-user-001',
    businessId: 'biz-mock-001',
    email: 'user@test.com',
    role: UserRoleEnum.USER,
  },

  // Business Data
  mockBusiness: {
    id: 'biz-mock-001',
    name: 'Test Restaurant',
    email: 'business@test.com',
  },

  // Category Data
  mockCategory: {
    id: 'cat-test-001',
    name: 'Test Category',
    businessId: 'biz-mock-001',
    description: 'Test category description',
    icon: 'test-icon.png',
    isActive: true,
    sortOrder: 1,
    parentId: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  },

  mockCategoryWithParent: {
    id: 'cat-test-002',
    name: 'Sub Category',
    businessId: 'biz-mock-001',
    description: 'Sub category description',
    icon: 'sub-icon.png',
    isActive: true,
    sortOrder: 2,
    parentId: 'cat-test-001',
    createdAt: new Date(),
    updatedAt: new Date(),
  },

  // Menu Data
  mockMenu: {
    id: 'menu-test-001',
    name: 'Test Burger',
    businessId: 'biz-mock-001',
    categoryId: 'cat-test-001',
    description: 'Delicious test burger',
    details: { calories: '500 kcal', allergens: 'Gluten' },
    services: [MenuServiceEnum.DINE_IN, MenuServiceEnum.TAKEAWAY],
    images: ['test-image.jpg'],
    isBarItem: false,
    isSignature: false,
    isAvailable: true,
    allowAddOns: true,
    price: 15.99,
    discountedPrice: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  },

  mockSignatureMenu: {
    id: 'menu-test-002',
    name: 'Signature Dish',
    businessId: 'biz-mock-001',
    categoryId: 'cat-test-001',
    description: 'Our signature dish',
    details: {},
    services: [MenuServiceEnum.DINE_IN],
    images: [],
    isBarItem: false,
    isSignature: true,
    isAvailable: true,
    allowAddOns: false,
    price: 25.99,
    discountedPrice: 22.99,
    createdAt: new Date(),
    updatedAt: new Date(),
  },

  // Addon Data
  mockAddon: {
    id: 'addon-test-001',
    name: 'Extra Cheese',
    businessId: 'biz-mock-001',
    description: 'Additional cheese topping',
    price: 2.50,
    isAvailable: true,
    sortOrder: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
  },

  // Addon Group Data
  mockAddonGroup: {
    id: 'group-test-001',
    name: 'Toppings',
    businessId: 'biz-mock-001',
    description: 'Choose your toppings',
    isRequired: false,
    minSelect: 0,
    maxSelect: 3,
    sortOrder: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
  },

  mockRequiredAddonGroup: {
    id: 'group-test-002',
    name: 'Size',
    businessId: 'biz-mock-001',
    description: 'Choose size',
    isRequired: true,
    minSelect: 1,
    maxSelect: 1,
    sortOrder: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
  },

  // Cart Data
  mockCart: {
    id: 'cart-test-001',
    userId: 'user-mock-001',
    businessId: 'biz-mock-001',
    createdAt: new Date(),
    updatedAt: new Date(),
  },

  mockCartItem: {
    id: 'cartitem-test-001',
    cartId: 'cart-test-001',
    menuId: 'menu-test-001',
    quantity: 2,
    price: 15.99,
    notes: 'No onions',
    createdAt: new Date(),
    updatedAt: new Date(),
  },

  // Order Data
  mockOrder: {
    id: 'order-test-001',
    userId: 'user-mock-001',
    businessId: 'biz-mock-001',
    orderNumber: 'ORD-001',
    status: 'pending',
    totalAmount: 35.98,
    deliveryAddress: '123 Test St',
    paymentMethod: 'card',
    createdAt: new Date(),
    updatedAt: new Date(),
  },

  // JWT Payload
  mockJwtPayload: {
    id: 'admin-mock-001',
    kahaId: 'kaha-admin-001',
    businessId: 'biz-mock-001',
    email: 'admin@test.com',
    role: UserRoleEnum.BUSINESS_SUPER_ADMIN,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 3600,
  },

  // DTOs
  createCategoryDto: {
    name: 'New Category',
    description: 'New category description',
    icon: 'new-icon.png',
    isActive: true,
    sortOrder: 1,
  },

  updateCategoryDto: {
    name: 'Updated Category',
    description: 'Updated description',
    icon: 'updated-icon.png',
    isActive: true,
    sortOrder: 2,
  },

  createMenuDto: {
    name: 'New Menu Item',
    categoryId: 'cat-test-001',
    description: 'New menu description',
    details: {},
    services: [MenuServiceEnum.DINE_IN],
    images: [],
    isBarItem: false,
    isSignature: false,
    isAvailable: true,
    allowAddOns: true,
    price: 19.99,
    addOnIds: [],
    discountedPrice: null,
  },

  updateMenuDto: {
    name: 'Updated Menu Item',
    categoryId: 'cat-test-001',
    description: 'Updated description',
    details: {},
    services: [MenuServiceEnum.DINE_IN],
    images: [],
    isBarItem: false,
    isSignature: false,
    isAvailable: true,
    allowAddOns: true,
    price: 21.99,
    addOnIds: [],
    discountedPrice: null,
  },

  createAddonDto: {
    name: 'New Addon',
    description: 'New addon description',
    price: 3.50,
    isAvailable: true,
    sortOrder: 1,
  },

  createAddonGroupDto: {
    name: 'New Group',
    businessId: 'biz-mock-001',
    description: 'New group description',
    isRequired: false,
    minSelect: 0,
    maxSelect: 5,
    sortOrder: 1,
  },

  createCartItemDto: {
    menuId: 'menu-test-001',
    quantity: 1,
    notes: 'Test notes',
  },
};

/**
 * Helper to create mock request object with authenticated user
 */
export const createMockRequest = (user = MockDataFactory.mockUser) => ({
  user,
});

/**
 * Helper to create mock response object
 */
export const createMockResponse = () => {
  const res: any = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  res.send = jest.fn().mockReturnValue(res);
  return res;
};
