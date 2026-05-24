# Requirements Document: Phase 1 Platform Foundation
## Restaurant E-Commerce Multi-Tenant Platform

---

## Document Information

**Version**: 1.0  
**Date**: May 13, 2026  
**Status**: Draft  
**Architecture**: Microservices (Standalone Restaurant Service + Kaha Main v3)

---

## Executive Summary

This document specifies the requirements for Phase 1 of a multi-tenant restaurant e-commerce platform. The system is built on a **microservices architecture** where:

- **Kaha Main v3** handles: Authentication, User Management, Business Management
- **Restaurant E-Commerce Service** handles: Menu, Categories, Cart, Orders, Ratings

The platform enables restaurants with multiple branches to manage operations through an admin panel while customers browse menus, place orders, and track deliveries.

---

## System Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    CLIENT APPLICATIONS                      │
│              (Web/Mobile - Customer & Admin)                │
└────────────────────────┬────────────────────────────────────┘
                         │
                         │ HTTP/REST API
                         │
        ┌────────────────┴────────────────┐
        │                                 │
        ▼                                 ▼
┌──────────────────┐            ┌──────────────────┐
│  KAHA MAIN V3    │◄──────────►│   RESTAURANT     │
│    SERVICE       │   HTTP API │   E-COMMERCE     │
│                  │            │    SERVICE       │
├──────────────────┤            ├──────────────────┤
│ • Auth           │            │ • Menu           │
│ • Users          │            │ • Categories     │
│ • Business       │            │ • Cart           │
│ • Business Users │            │ • Orders         │
└────────┬─────────┘            │ • Ratings        │
         │                      └────────┬─────────┘
         │                               │
         ▼                               ▼
┌──────────────────┐            ┌──────────────────┐
│    AUTH_DB       │            │  RESTAURANT_DB   │
│  (PostgreSQL)    │            │  (PostgreSQL)    │
└──────────────────┘            └──────────────────┘
```

---

## Glossary


### Core Terms

- **System**: The complete restaurant e-commerce platform (Kaha Main v3 + Restaurant Service)
- **Kaha_Main_v3**: Microservice handling authentication, users, and business management
- **Restaurant_Service**: Microservice handling menu, cart, orders, and ratings
- **Admin_Panel**: Web application for restaurant staff to manage operations
- **Customer_Panel**: Web/mobile application for customers to browse and order
- **Restaurant/Business**: A business entity that owns one or more branches (managed in Kaha Main v3)
- **Branch**: A physical location of a restaurant (managed in Kaha Main v3)
- **Menu_Item**: A food or beverage product available for purchase
- **Category**: A grouping of related menu items (hierarchical structure supported)
- **Add_On**: Extra items that can be added to menu items (toppings, extras)
- **Order**: A customer's request to purchase menu items
- **Service_Type**: The method of order fulfillment (DINE_IN, TAKEAWAY, DELIVERY)
- **Order_Status**: The current state of an order (PENDING, CONFIRMED, PREPARING, READY, DELIVERED, CANCELLED)

### User Roles

- **USER/CUSTOMER**: End-user who browses menu and places orders
- **ADMIN/STAFF**: Restaurant staff who manage orders
- **BUSINESS_SUPER_ADMIN**: Restaurant owner with full business management access
- **SUPER_ADMIN**: Platform administrator (Kaha Main v3)

### Technical Terms

- **JWT**: JSON Web Token for session management
- **OTP**: One-Time Password for authentication
- **Service_Communication**: HTTP-based inter-service communication layer
- **Soft_Delete**: Logical deletion using `deletedAt` timestamp
- **Price_Snapshot**: Storing prices at order time (not references)

---

## System Context

### Service Boundaries

#### Kaha Main v3 Service (External Dependency)
**Base URL**: `process.env.KAH_API_V3_BASE_URL`

**Responsibilities**:
- User authentication (OTP-based, social login)
- User profile management
- Business/restaurant registration and management
- Business-user role assignments
- Business verification workflow

**Key Endpoints Used**:
```
GET  /users/:userId
GET  /businesses/:businessId
GET  /business-users/:businessId/:userId
```

#### Restaurant E-Commerce Service (This System)
**Responsibilities**:
- Menu catalog management
- Category hierarchy management
- Add-ons management
- Shopping cart operations
- Order processing and tracking
- Menu ratings and reviews

---

## Requirements

### Requirement 1: Service Communication Layer

**User Story:** As a system, I need to communicate with Kaha Main v3 service to retrieve user and business information.

#### Acceptance Criteria

1. WHEN the Restaurant Service needs user information, THE System SHALL call `GET /users/:userId` on Kaha Main v3
2. WHEN the Restaurant Service needs business information, THE System SHALL call `GET /businesses/:businessId` on Kaha Main v3
3. WHEN the Restaurant Service needs to verify business-user roles, THE System SHALL call `GET /business-users/:businessId/:userId` on Kaha Main v3
4. WHEN service communication fails, THE System SHALL throw InternalServerErrorException with descriptive message
5. THE System SHALL use HttpService from @nestjs/axios for HTTP requests
6. THE System SHALL use environment variable `KAH_API_V3_BASE_URL` for Kaha Main v3 base URL
7. WHEN making HTTP requests, THE System SHALL handle timeouts and network errors gracefully
8. THE System SHALL NOT cache user or business data locally (always fetch fresh data)

---

### Requirement 2: Authentication and Authorization

**User Story:** As a system, I need to authenticate users via Kaha Main v3 and authorize actions based on roles.

#### Acceptance Criteria

1. WHEN a user makes an authenticated request, THE System SHALL validate JWT token issued by Kaha Main v3
2. WHEN JWT token is invalid or expired, THE System SHALL return 401 Unauthorized
3. WHEN extracting user information, THE System SHALL read `userId`, `businessId`, and `role` from JWT payload
4. THE System SHALL support the following roles: USER, ADMIN, BUSINESS_SUPER_ADMIN, SUPER_ADMIN
5. WHEN a user attempts an unauthorized action, THE System SHALL return 403 Forbidden
6. THE System SHALL use JwtAuthGuard for protected endpoints
7. THE System SHALL use RolesGuard for role-based access control
8. THE System SHALL use @Roles decorator to specify required roles per endpoint

**Role-Based Access Matrix**:

| Action | USER | ADMIN | BUSINESS_SUPER_ADMIN | SUPER_ADMIN |
|--------|------|-------|---------------------|-------------|
| Browse Menu | ✅ | ✅ | ✅ | ✅ |
| Add to Cart | ✅ | ✅ | ✅ | ✅ |
| Place Order | ✅ | ✅ | ✅ | ✅ |
| Rate Menu | ✅ | ✅ | ✅ | ✅ |
| Manage Menu | ❌ | ❌ | ✅ | ✅ |
| Manage Categories | ❌ | ❌ | ✅ | ✅ |
| Manage Add-ons | ❌ | ❌ | ✅ | ✅ |
| View Business Orders | ❌ | ❌ | ✅ | ✅ |
| Update Order Status | ❌ | ❌ | ✅ | ✅ |

---

### Requirement 3: Menu Category Management

**User Story:** As a restaurant admin, I want to organize menu items into hierarchical categories, so that customers can easily browse the menu.

#### Acceptance Criteria

1. WHEN an admin creates a category, THE System SHALL require name, businessId, and optional parentId
2. THE System SHALL support hierarchical categories with unlimited nesting depth
3. WHEN an admin creates a category, THE System SHALL allow setting icon, description, isActive, and position
4. THE System SHALL prevent duplicate category names within the same business
5. WHEN an admin updates category display order, THE System SHALL update the position field
6. WHEN an admin deletes a category, THE System SHALL prevent deletion if menu items are assigned to it
7. WHEN an admin deletes a category, THE System SHALL soft-delete it (set deletedAt timestamp)
8. THE System SHALL allow categories to be marked as active or inactive via isActive field
9. WHEN a category is inactive, THE System SHALL hide it and its items from customer view
10. WHEN fetching categories, THE System SHALL return them ordered by position field
11. THE System SHALL support filtering categories by businessId
12. WHEN fetching categories, THE System SHALL include parent-child relationships

**API Endpoints**:
```
POST   /categories
GET    /categories/:businessId
GET    /categories/:id
PATCH  /categories/:id
DELETE /categories/:id
```

---

### Requirement 4: Menu Item Management

**User Story:** As a restaurant admin, I want to create and manage menu items with images and details, so that customers know what they can order.

#### Acceptance Criteria

1. WHEN an admin creates a menu item, THE System SHALL require name, description, price, businessId, and categoryId
2. WHEN a menu item is created, THE System SHALL allow multiple images (array of URLs)
3. THE System SHALL allow menu items to have discountedPrice field
4. THE System SHALL allow menu items to be marked as isBarItem, isSignature, isAvailable
5. THE System SHALL allow menu items to specify services array (DINE_IN, TAKEAWAY, DELIVERY)
6. THE System SHALL allow menu items to have allowAddOns boolean flag
7. THE System SHALL prevent duplicate menu names within the same business
8. WHEN an admin updates a menu item, THE System SHALL validate businessId ownership
9. WHEN a menu item is out of stock, THE System SHALL set isAvailable to false
10. WHEN a menu item is deleted, THE System SHALL soft-delete it (set deletedAt timestamp)
11. THE System SHALL allow assigning multiple add-ons to a menu item (many-to-many relationship)
12. WHEN fetching menu items, THE System SHALL support filtering by categoryId, isSignature, isAvailable, services
13. WHEN fetching menu items, THE System SHALL support price range filtering (minPrice, maxPrice)
14. WHEN fetching menu items, THE System SHALL support search by name (case-insensitive)
15. WHEN fetching menu items, THE System SHALL support pagination (page, take)
16. WHEN fetching menu items, THE System SHALL support grouping by category (groupBy=category)
17. WHEN toggling signature status, THE System SHALL limit maximum 3 signature items per business

**API Endpoints**:
```
POST   /menu
GET    /menu/:businessId
GET    /menu/:id
PATCH  /menu/:id
DELETE /menu/:id
PATCH  /menu/toggle-signature/:id
PATCH  /menu/update-addons/:id
```

---

### Requirement 5: Add-ons Management

**User Story:** As a restaurant admin, I want to manage add-ons (toppings, extras), so that customers can customize their orders.

#### Acceptance Criteria

1. WHEN an admin creates an add-on, THE System SHALL require name, price, and description
2. WHEN an add-on is created, THE System SHALL allow optional coverImg field
3. THE System SHALL allow add-ons to be assigned to multiple menu items
4. WHEN an admin updates an add-on, THE System SHALL update price and details
5. WHEN an admin deletes an add-on, THE System SHALL soft-delete it (set deletedAt timestamp)
6. WHEN an admin deletes an add-on, THE System SHALL check if it's assigned to any menu items
7. THE System SHALL support fetching all add-ons with pagination
8. WHEN updating menu add-ons, THE System SHALL replace existing add-ons with new list

**API Endpoints**:
```
POST   /addons
GET    /addons
GET    /addons/:id
PATCH  /addons/:id
DELETE /addons/:id
```

---

### Requirement 6: Shopping Cart Management

**User Story:** As a customer, I want to add items to a cart and modify quantities, so that I can prepare my order before checkout.

#### Acceptance Criteria

1. WHEN a customer adds an item to cart, THE System SHALL create a cart if one doesn't exist for the user
2. WHEN a customer adds an item, THE System SHALL require menuId and quantity
3. WHEN a customer adds an item, THE System SHALL allow optional addonInfo array with addonsId and quantity
4. THE System SHALL create CartItem entity linked to Cart and Menu
5. THE System SHALL create CartItemAddOns entities for each add-on
6. WHEN a customer views cart, THE System SHALL return all cart items with menu details and add-ons
7. WHEN a customer views cart, THE System SHALL calculate itemTotal (menu price × quantity)
8. WHEN a customer views cart, THE System SHALL calculate addonsTotal (sum of addon price × quantity)
9. WHEN a customer views cart, THE System SHALL calculate grandTotal (itemTotal + addonsTotal)
10. WHEN a customer updates cart item, THE System SHALL allow changing quantity and add-ons
11. WHEN a customer updates cart item quantity, THE System SHALL validate quantity >= 1
12. WHEN a customer removes cart item, THE System SHALL delete CartItem and associated CartItemAddOns
13. THE System SHALL support grouping cart items by businessId (groupBy=business)
14. THE System SHALL enforce one active cart per user
15. WHEN cart is accessed, THE System SHALL validate user ownership via JWT userId

**API Endpoints**:
```
POST   /cart
POST   /cart/item
GET    /cart
PATCH  /cart/:itemId
DELETE /cart/:id
```

---

### Requirement 7: Order Placement

**User Story:** As a customer, I want to place an order with my selected items, so that the restaurant can prepare my food.

#### Acceptance Criteria

1. WHEN a customer places an order, THE System SHALL require businessId and items array
2. WHEN an order is placed, THE System SHALL allow optional remarks field (max 500 characters)
3. WHEN an order is created, THE System SHALL validate all menu items exist and are available
4. WHEN an order is created, THE System SHALL create Order entity with userId, businessId, totalAmount, remarks
5. WHEN an order is created, THE System SHALL create OrderItem entities with quantity and price snapshot
6. WHEN an order is created, THE System SHALL create OrderItemAddon entities with quantity and price snapshot
7. WHEN an order is created, THE System SHALL calculate totalAmount as sum of all order item subtotals
8. WHEN an order is created, THE System SHALL create initial OrderStatus with status PENDING
9. WHEN an order is created, THE System SHALL clear the customer's cart
10. WHEN an order is created, THE System SHALL return orderId, totalAmount, and status
11. THE System SHALL store price snapshots (not references) to preserve historical accuracy
12. THE System SHALL generate unique order identifiers

**Price Snapshot Logic**:
```
OrderItem.price = Menu.price (at order time)
OrderItemAddon.price = AddOn.price (at order time)
```

**API Endpoints**:
```
POST   /order
```

---

### Requirement 8: Order Viewing and Filtering

**User Story:** As a customer/admin, I want to view and filter orders, so that I can track order history.

#### Acceptance Criteria

1. WHEN a customer views their orders, THE System SHALL return only orders where userId matches JWT userId
2. WHEN an admin views business orders, THE System SHALL return only orders where businessId matches
3. THE System SHALL display orders in reverse chronological order by default
4. WHEN filtering by status, THE System SHALL show only orders with matching current status
5. WHEN filtering by date range, THE System SHALL show only orders within that range
6. THE System SHALL support pagination (page, limit)
7. WHEN viewing order details, THE System SHALL include order items with menu details
8. WHEN viewing order details, THE System SHALL include order item add-ons with details
9. WHEN viewing order details, THE System SHALL include status history (all OrderStatus entries)
10. THE System SHALL calculate and return totalAmount for each order

**API Endpoints**:
```
GET    /order/user (customer view)
GET    /order/business-man-vs/:businessId (admin view)
GET    /order/:id (single order details)
```

---

### Requirement 9: Order Status Management

**User Story:** As a restaurant staff member, I want to update order status, so that customers know the progress of their orders.

#### Acceptance Criteria

1. WHEN staff updates order status, THE System SHALL require status and optional remarks
2. THE System SHALL support the following statuses: PENDING, CONFIRMED, PREPARING, READY, DELIVERED, CANCELLED
3. WHEN order status is updated, THE System SHALL create new OrderStatus entity
4. WHEN order status is updated, THE System SHALL record updatedBy (userId from JWT)
5. WHEN order status is updated, THE System SHALL record timestamp
6. THE System SHALL maintain complete status history (not overwrite previous statuses)
7. WHEN fetching order, THE System SHALL return latest status as current status
8. WHEN fetching order details, THE System SHALL return all status history entries
9. THE System SHALL validate businessId ownership before allowing status updates
10. THE System SHALL allow customers to cancel their own orders (status = CANCELLED)

**Status Flow**:
```
PENDING → CONFIRMED → PREPARING → READY → DELIVERED
                                        ↓
                                   CANCELLED (can happen at any stage)
```

**API Endpoints**:
```
POST   /order/:orderId/change-status
```

---

### Requirement 10: Menu Rating and Reviews

**User Story:** As a customer, I want to rate and review menu items, so that I can share my experience.

#### Acceptance Criteria

1. WHEN a customer rates a menu item, THE System SHALL require menuId, rating, and businessId
2. WHEN a customer rates a menu item, THE System SHALL require rating between 1 and 5
3. WHEN a customer submits a review, THE System SHALL allow optional comments field (max 1000 characters)
4. WHEN a review is submitted, THE System SHALL associate it with ratedBy (userId from JWT)
5. WHEN a review is submitted, THE System SHALL create MenuRating entity
6. THE System SHALL allow multiple ratings per menu item from different users
7. THE System SHALL allow one rating per menu item per user (update if exists)
8. WHEN fetching menu ratings, THE System SHALL support filtering by menuId
9. WHEN fetching menu ratings, THE System SHALL support filtering by businessId
10. WHEN fetching menu ratings, THE System SHALL support pagination
11. WHEN fetching menu item, THE System SHALL calculate and return average rating
12. WHEN deleting a rating, THE System SHALL soft-delete it (set deletedAt timestamp)

**API Endpoints**:
```
POST   /menu-rating
GET    /menu-rating
GET    /menu-rating/:id
DELETE /menu-rating/:id
```

---

### Requirement 11: Data Validation and Error Handling

**User Story:** As a developer, I want comprehensive input validation and error handling, so that the system is robust and secure.

#### Acceptance Criteria

1. WHEN API requests are received, THE System SHALL validate all input parameters using class-validator
2. WHEN validation fails, THE System SHALL return 400 Bad Request with specific error messages
3. WHEN a database constraint is violated, THE System SHALL return 409 Conflict with descriptive message
4. WHEN a resource is not found, THE System SHALL return 404 Not Found
5. WHEN an unauthorized action is attempted, THE System SHALL return 403 Forbidden
6. WHEN authentication fails, THE System SHALL return 401 Unauthorized
7. WHEN an internal error occurs, THE System SHALL return 500 Internal Server Error
8. WHEN an internal error occurs, THE System SHALL log error with stack trace
9. THE System SHALL sanitize all user input to prevent XSS attacks
10. THE System SHALL use parameterized queries to prevent SQL injection
11. THE System SHALL validate UUID format for all ID parameters
12. THE System SHALL validate enum values for status, role, and service type fields
13. WHEN service communication fails, THE System SHALL throw InternalServerErrorException

**Validation Rules**:
```typescript
// Example DTOs
CreateMenuDto {
  @IsString() @IsNotEmpty() name: string;
  @IsNumber() @Min(0) price: number;
  @IsUUID() categoryId: string;
  @IsUUID() businessId: string;
  @IsArray() @IsEnum(ServiceType, { each: true }) services: ServiceType[];
}

CreateOrderDto {
  @IsUUID() businessId: string;
  @IsArray() @ValidateNested({ each: true }) items: OrderItemDto[];
  @IsString() @MaxLength(500) @IsOptional() remarks?: string;
}
```

---

### Requirement 12: Database Design and Soft Deletes

**User Story:** As a system, I need proper database schema with soft deletes for audit trail.

#### Acceptance Criteria

1. THE System SHALL use PostgreSQL as the database
2. THE System SHALL use TypeORM as the ORM
3. ALL entities SHALL inherit from BaseEntity with id, createdAt, updatedAt, deletedAt
4. WHEN records are deleted, THE System SHALL use soft deletes (set deletedAt timestamp)
5. WHEN querying records, THE System SHALL exclude soft-deleted records by default
6. THE System SHALL use UUID for all primary keys
7. THE System SHALL use appropriate indexes on foreign keys and frequently queried columns
8. THE System SHALL enforce referential integrity at application level (not database level for cross-service references)
9. THE System SHALL use cascade delete for dependent entities (CartItem → CartItemAddOns)
10. THE System SHALL store price snapshots in order entities (not foreign key references)

**Entity Relationships**:
```
Category (self-referencing via parentId)
  ↓ 1:N
Menu
  ↓ N:M
AddOn

Cart
  ↓ 1:N
CartItem
  ↓ 1:N
CartItemAddOns

Order
  ↓ 1:N
OrderItem
  ↓ 1:N
OrderItemAddon

Order
  ↓ 1:N
OrderStatus

Menu
  ↓ 1:N
MenuRating
```

---

### Requirement 13: Multi-Tenancy via Business ID

**User Story:** As a platform, I need to isolate data per business for multi-tenancy.

#### Acceptance Criteria

1. ALL business-specific entities SHALL have businessId field
2. WHEN creating records, THE System SHALL require businessId
3. WHEN querying records, THE System SHALL filter by businessId
4. WHEN updating/deleting records, THE System SHALL validate businessId ownership
5. THE System SHALL prevent cross-business data access
6. WHEN admin views data, THE System SHALL show only data for their assigned business
7. THE System SHALL fetch business information from Kaha Main v3 via service communication
8. THE System SHALL NOT store business details locally (always fetch from Kaha Main v3)

**Business ID Validation Flow**:
```
1. Extract businessId from JWT token (for admins)
2. OR extract from request body/params
3. Validate business exists via Kaha Main v3 API
4. Filter all queries by businessId
5. Validate ownership before updates/deletes
```

---

### Requirement 14: API Documentation

**User Story:** As a developer, I want comprehensive API documentation, so that I can integrate with the system easily.

#### Acceptance Criteria

1. THE System SHALL provide Swagger/OpenAPI documentation
2. THE System SHALL document all API endpoints with @ApiTags decorator
3. THE System SHALL document request parameters with @ApiProperty decorator
4. THE System SHALL document response schemas with @ApiResponse decorator
5. THE System SHALL document authentication requirements with @ApiBearerAuth decorator
6. THE System SHALL provide example requests and responses
7. THE System SHALL host interactive API documentation at /api-docs endpoint
8. WHEN API changes are made, THE System SHALL update documentation automatically

---

### Requirement 15: Logging and Monitoring

**User Story:** As a system administrator, I want comprehensive logging, so that I can troubleshoot issues.

#### Acceptance Criteria

1. WHEN an API request is received, THE System SHALL log request method, path, and userId
2. WHEN an error occurs, THE System SHALL log error message, stack trace, and context
3. THE System SHALL log to structured JSON format
4. THE System SHALL use NestJS Logger for all logging
5. WHEN service communication fails, THE System SHALL log the error with request details
6. THE System SHALL exclude sensitive data (passwords, tokens) from logs
7. THE System SHALL log database query execution times for slow queries
8. THE System SHALL use appropriate log levels (log, warn, error)

---

### Requirement 16: Performance and Caching

**User Story:** As a system, I need optimized performance through efficient queries and caching.

#### Acceptance Criteria

1. WHEN fetching menu data, THE System SHALL use eager loading for relations (category, addOns)
2. WHEN fetching cart data, THE System SHALL use eager loading for relations (cartItems, menu, addOns)
3. WHEN fetching order data, THE System SHALL use eager loading for relations (orderItems, orderStatus)
4. THE System SHALL use database connection pooling
5. THE System SHALL use pagination for all list endpoints
6. THE System SHALL use indexes on businessId, userId, categoryId, menuId columns
7. THE System SHALL compress API responses using gzip when response size exceeds 1KB
8. WHEN calculating totals, THE System SHALL perform calculations in application layer (not database)
9. THE System SHALL limit query results to prevent memory issues
10. THE System SHALL use TypeORM query builder for complex queries with joins

**Pagination Standard**:
```typescript
interface PaginationQuery {
  page?: number; // default: 1
  take?: number; // default: 10, max: 100
}

interface PaginationResponse<T> {
  metaData: {
    currentPage: number;
    totalPages: number;
    totalCount: number;
    perPage: number;
  };
  data: T[];
}
```

---

### Requirement 17: Security Requirements

**User Story:** As a system administrator, I want secure authentication and authorization, so that user data is protected.

#### Acceptance Criteria

1. THE System SHALL validate JWT tokens on all protected endpoints
2. THE System SHALL use HTTPS for all API communications in production
3. THE System SHALL implement CORS with whitelist of allowed origins
4. THE System SHALL implement rate limiting (100 requests per minute per IP)
5. THE System SHALL use parameterized queries to prevent SQL injection
6. THE System SHALL sanitize all user input to prevent XSS attacks
7. THE System SHALL validate file uploads (type, size) if implemented
8. THE System SHALL NOT log sensitive data (passwords, tokens, payment info)
9. THE System SHALL use environment variables for sensitive configuration
10. THE System SHALL validate businessId ownership before allowing data access

---

### Requirement 18: Environment Configuration

**User Story:** As a developer, I need proper environment configuration management.

#### Acceptance Criteria

1. THE System SHALL use @nestjs/config for configuration management
2. THE System SHALL load configuration from .env file
3. THE System SHALL validate required environment variables on startup
4. THE System SHALL provide .env.example file with all required variables
5. THE System SHALL use ConfigurationService to access environment variables
6. THE System SHALL NOT commit .env file to version control

**Required Environment Variables**:
```bash
# Database
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_NAME=restaurant_ecommerce
DATABASE_USER=postgres
DATABASE_PASSWORD=password

# Kaha Main v3 Service
KAH_API_V3_BASE_URL=http://localhost:3000

# JWT
JWT_SECRET=your-secret-key
JWT_EXPIRATION=7d

# Server
PORT=3001
NODE_ENV=development
```

---

### Requirement 19: Testing Requirements

**User Story:** As a developer, I want comprehensive test coverage, so that the system is reliable.

#### Acceptance Criteria

1. THE System SHALL have unit tests for all service methods
2. THE System SHALL have integration tests for all API endpoints
3. THE System SHALL achieve minimum 70% code coverage
4. WHEN tests are run, THE System SHALL use a separate test database
5. THE System SHALL include tests for authentication and authorization flows
6. THE System SHALL include tests for error handling scenarios
7. THE System SHALL include tests for validation logic
8. THE System SHALL use Jest as the testing framework
9. THE System SHALL mock external service calls (Kaha Main v3) in tests

---

### Requirement 20: Migration and Seeding

**User Story:** As a developer, I need database migrations and seed data for development.

#### Acceptance Criteria

1. THE System SHALL use TypeORM migrations for schema changes
2. WHEN a migration is applied, THE System SHALL record migration name and timestamp
3. THE System SHALL support rollback of migrations
4. THE System SHALL provide seed scripts for development data
5. THE System SHALL provide separate seed scripts for:
   - Categories (default food categories)
   - Sample menu items
   - Sample add-ons
6. THE System SHALL NOT seed production databases automatically
7. THE System SHALL use migration files in src/migrations directory

**Migration Commands**:
```bash
npm run migration:generate -- -n MigrationName
npm run migration:run
npm run migration:revert
npm run seed:dev
```

---

## Data Flow Diagrams

### Customer Order Flow

```
┌─────────────┐
│  Customer   │
└──────┬──────┘
       │
       │ 1. Browse Menu
       ▼
┌─────────────────────────────────────┐
│ GET /menu/:businessId               │
│ (Public - No Auth)                  │
└──────┬──────────────────────────────┘
       │
       │ 2. Add to Cart (Auth Required)
       ▼
┌─────────────────────────────────────┐
│ POST /cart/item                     │
│ { menuId, quantity, addonInfo[] }   │
└──────┬──────────────────────────────┘
       │
       │ 3. View Cart
       ▼
┌─────────────────────────────────────┐
│ GET /cart                           │
│ Returns: items with calculated      │
│ totals                              │
└──────┬──────────────────────────────┘
       │
       │ 4. Place Order
       ▼
┌─────────────────────────────────────┐
│ POST /order                         │
│ { businessId, items[], remarks }    │
│                                     │
│ Process:                            │
│ 1. Validate items                   │
│ 2. Create Order (status: PENDING)   │
│ 3. Create OrderItems (price snapshot)│
│ 4. Create OrderItemAddons           │
│ 5. Clear cart                       │
└──────┬──────────────────────────────┘
       │
       │ 5. Track Order
       ▼
┌─────────────────────────────────────┐
│ GET /order/:id                      │
│ Returns: order with status history  │
└──────┬──────────────────────────────┘
       │
       │ 6. Rate Menu (After Delivery)
       ▼
┌─────────────────────────────────────┐
│ POST /menu-rating                   │
│ { menuId, rating, comments }        │
└─────────────────────────────────────┘
```

### Admin Order Management Flow

```
┌─────────────────┐
│ Business Admin  │
└────────┬────────┘
         │
         │ 1. View Orders
         ▼
┌─────────────────────────────────────┐
│ GET /order/business-man-vs/         │
│     :businessId                     │
│                                     │
│ Filters: status, dateRange          │
└────────┬────────────────────────────┘
         │
         │ 2. Update Status
         ▼
┌─────────────────────────────────────┐
│ POST /order/:orderId/change-status  │
│ { status, remarks }                 │
│                                     │
│ Creates new OrderStatus entry       │
│ Records updatedBy (admin userId)    │
└─────────────────────────────────────┘
```

---

## Database Schema

### Entity Definitions

#### Category Entity
```typescript
@Entity('category_entity')
export class CategoryEntity extends BaseEntity {
  @Column({ type: 'varchar', length: 255, unique: true })
  name: string;

  @Column({ type: 'varchar', length: 1024, nullable: true })
  description: string;

  @Column({ type: 'text', nullable: true })
  icon: string;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @Column({ type: 'int', nullable: true })
  position: number;

  @Column({ type: 'uuid' })
  businessId: string; // FK to Kaha Main v3

  @ManyToOne(() => CategoryEntity, { nullable: true })
  @JoinColumn({ name: 'parent_id' })
  parent: CategoryEntity;

  @Column({ type: 'uuid', nullable: true })
  parentId: string;
}
```

#### Menu Entity
```typescript
@Entity('menu_entity')
export class MenuEntity extends BaseEntity {
  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'text', array: true, default: [] })
  images: string[];

  @Column({ type: 'jsonb', nullable: true })
  details: any;

  @Column({ type: 'boolean', default: false })
  isBarItem: boolean;

  @Column({ type: 'boolean', default: true })
  isAvailable: boolean;

  @Column({ type: 'varchar', array: true, default: ['DINE_IN'] })
  services: string[]; // DINE_IN, TAKEAWAY, DELIVERY

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  price: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true })
  discountedPrice: number;

  @Column({ type: 'uuid' })
  businessId: string; // FK to Kaha Main v3

  @Column({ type: 'boolean', default: false })
  isSignature: boolean;

  @Column({ type: 'boolean', default: false })
  allowAddOns: boolean;

  @ManyToOne(() => CategoryEntity)
  @JoinColumn({ name: 'category_id' })
  category: CategoryEntity;

  @Column({ type: 'uuid' })
  categoryId: string;

  @ManyToMany(() => AddOnEntity)
  @JoinTable({ name: 'menu_add_on_junction' })
  addOns: AddOnEntity[];
}
```

#### AddOn Entity
```typescript
@Entity('add_on_entity')
export class AddOnEntity extends BaseEntity {
  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  price: number;

  @Column({ type: 'text', nullable: true })
  coverImg: string;
}
```

#### Cart Entity
```typescript
@Entity('cart_entity')
export class CartEntity extends BaseEntity {
  @Column({ type: 'uuid' })
  userId: string; // FK to Kaha Main v3

  @OneToMany(() => CartItemEntity, (item) => item.cart)
  cartItems: CartItemEntity[];
}
```

#### CartItem Entity
```typescript
@Entity('cart_item_entity')
export class CartItemEntity extends BaseEntity {
  @Column({ type: 'int' })
  quantity: number;

  @ManyToOne(() => CartEntity, (cart) => cart.cartItems, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'cart_id' })
  cart: CartEntity;

  @Column({ type: 'uuid' })
  cartId: string;

  @ManyToOne(() => MenuEntity)
  @JoinColumn({ name: 'menu_id' })
  menu: MenuEntity;

  @Column({ type: 'uuid' })
  menuId: string;

  @OneToMany(() => CartItemAddOnsEntity, (addon) => addon.cartItem)
  addOns: CartItemAddOnsEntity[];
}
```

#### CartItemAddOns Entity
```typescript
@Entity('cart_item_add_ons_entity')
export class CartItemAddOnsEntity extends BaseEntity {
  @Column({ type: 'int' })
  quantity: number;

  @ManyToOne(() => CartItemEntity, (item) => item.addOns, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'cart_item_id' })
  cartItem: CartItemEntity;

  @Column({ type: 'uuid' })
  cartItemId: string;

  @ManyToOne(() => AddOnEntity)
  @JoinColumn({ name: 'add_on_id' })
  menuAddOn: AddOnEntity;

  @Column({ type: 'uuid' })
  addOnId: string;
}
```

#### Order Entity
```typescript
@Entity('order_entity')
export class OrderEntity extends BaseEntity {
  @Column({ type: 'uuid' })
  userId: string; // FK to Kaha Main v3

  @Column({ type: 'uuid' })
  businessId: string; // FK to Kaha Main v3

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  totalAmount: number;

  @Column({ type: 'text', nullable: true })
  remarks: string;

  @OneToMany(() => OrderItemEntity, (item) => item.order)
  orderItems: OrderItemEntity[];

  @OneToMany(() => OrderStatusEntity, (status) => status.order)
  orderStatuses: OrderStatusEntity[];
}
```

#### OrderItem Entity
```typescript
@Entity('order_item_entity')
export class OrderItemEntity extends BaseEntity {
  @Column({ type: 'int' })
  quantity: number;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  price: number; // Price snapshot at order time

  @ManyToOne(() => OrderEntity, (order) => order.orderItems, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'order_id' })
  order: OrderEntity;

  @Column({ type: 'uuid' })
  orderId: string;

  @Column({ type: 'uuid' })
  menuId: string; // Reference only (not FK)

  @OneToMany(() => OrderItemAddonEntity, (addon) => addon.orderItem)
  addons: OrderItemAddonEntity[];
}
```

#### OrderItemAddon Entity
```typescript
@Entity('order_item_addon_entity')
export class OrderItemAddonEntity extends BaseEntity {
  @Column({ type: 'int' })
  quantity: number;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  price: number; // Price snapshot at order time

  @ManyToOne(() => OrderItemEntity, (item) => item.addons, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'order_item_id' })
  orderItem: OrderItemEntity;

  @Column({ type: 'uuid' })
  orderItemId: string;

  @Column({ type: 'uuid' })
  addOnId: string; // Reference only (not FK)
}
```

#### OrderStatus Entity
```typescript
@Entity('order_status_entity')
export class OrderStatusEntity extends BaseEntity {
  @ManyToOne(() => OrderEntity, (order) => order.orderStatuses, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'order_id' })
  order: OrderEntity;

  @Column({ type: 'uuid' })
  orderId: string;

  @Column({ type: 'varchar', length: 50 })
  status: string; // PENDING, CONFIRMED, PREPARING, READY, DELIVERED, CANCELLED

  @Column({ type: 'uuid' })
  updatedBy: string; // FK to Kaha Main v3 (userId)

  @Column({ type: 'text', nullable: true })
  remarks: string;
}
```

#### MenuRating Entity
```typescript
@Entity('menu_rating_entity')
export class MenuRatingEntity extends BaseEntity {
  @Column({ type: 'float' })
  rating: number; // 1-5

  @Column({ type: 'text', nullable: true })
  comments: string;

  @Column({ type: 'uuid' })
  ratedBy: string; // FK to Kaha Main v3 (userId)

  @Column({ type: 'uuid' })
  businessId: string; // FK to Kaha Main v3

  @ManyToOne(() => MenuEntity)
  @JoinColumn({ name: 'menu_id' })
  menu: MenuEntity;

  @Column({ type: 'uuid' })
  menuId: string;
}
```

#### BaseEntity (Abstract)
```typescript
export abstract class BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at' })
  deletedAt: Date;
}
```

---

## API Endpoints Summary

### Public Endpoints (No Authentication)

```
GET    /menu/:businessId          # Browse menu items
GET    /menu/:id                  # View menu item details
GET    /categories/:businessId    # Browse categories
```

### Customer Endpoints (USER role)

```
POST   /cart                      # Create cart
POST   /cart/item                 # Add item to cart
GET    /cart                      # View cart
PATCH  /cart/:itemId              # Update cart item
DELETE /cart/:id                  # Remove cart item

POST   /order                     # Place order
GET    /order/user                # View my orders
GET    /order/:id                 # View order details
POST   /order/:orderId/change-status  # Cancel order

POST   /menu-rating               # Rate menu item
GET    /menu-rating               # View ratings
DELETE /menu-rating/:id           # Delete my rating
```

### Admin Endpoints (BUSINESS_SUPER_ADMIN role)

```
POST   /categories                # Create category
PATCH  /categories/:id            # Update category
DELETE /categories/:id            # Delete category

POST   /menu                      # Create menu item
PATCH  /menu/:id                  # Update menu item
DELETE /menu/:id                  # Delete menu item
PATCH  /menu/toggle-signature/:id # Toggle signature status
PATCH  /menu/update-addons/:id    # Update menu add-ons

POST   /addons                    # Create add-on
PATCH  /addons/:id                # Update add-on
DELETE /addons/:id                # Delete add-on

GET    /order/business-man-vs/:businessId  # View business orders
POST   /order/:orderId/change-status       # Update order status
```

---

## Service Communication Patterns

### Pattern 1: User Validation

```typescript
// When: Need to validate user exists and get user details
// Service: ServiceCommunicationService.getUser(userId)

async getUser(userId: string) {
  const baseUrl = process.env.KAH_API_V3_BASE_URL;
  const url = `${baseUrl}/users/${userId}`;
  
  try {
    const response = await lastValueFrom(this.httpService.get(url));
    return response.data;
  } catch (error) {
    throw new InternalServerErrorException('Failed to fetch user');
  }
}

// Response from Kaha Main v3:
{
  id: string;
  fullName: string;
  email: string;
  contactNumber: string;
  role: string;
  avatar: string;
  kahaId: string;
}
```

### Pattern 2: Business Validation

```typescript
// When: Need to validate business exists and get business details
// Service: ServiceCommunicationService.getBusiness(businessId)

async getBusiness(businessId: string) {
  const baseUrl = process.env.KAH_API_V3_BASE_URL;
  const url = `${baseUrl}/businesses/${businessId}`;
  
  try {
    const response = await lastValueFrom(this.httpService.get(url));
    return response.data;
  } catch (error) {
    throw new InternalServerErrorException('Failed to fetch business');
  }
}

// Response from Kaha Main v3:
{
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  avatar: string;
  isActive: boolean;
}
```

### Pattern 3: Business-User Role Validation

```typescript
// When: Need to verify user has access to business
// Service: ServiceCommunicationService.getBusinessUserRoles(businessId, userId)

async getBusinessUserRoles(businessId: string, userId: string) {
  const baseUrl = process.env.KAH_API_V3_BASE_URL;
  const url = `${baseUrl}/business-users/${businessId}/${userId}`;
  
  try {
    const response = await lastValueFrom(this.httpService.get(url));
    return response.data;
  } catch (error) {
    throw new InternalServerErrorException('Failed to fetch business user role');
  }
}

// Response from Kaha Main v3:
{
  id: string;
  businessId: string;
  userId: string;
  role: string; // STAFF, MANAGER, ADMIN
  isActive: boolean;
}
```

---

## Error Handling Standards

### HTTP Status Codes

| Status Code | Usage | Example |
|-------------|-------|---------|
| 200 OK | Successful GET, PATCH, DELETE | Menu item fetched successfully |
| 201 Created | Successful POST | Menu item created successfully |
| 400 Bad Request | Validation error | Invalid quantity (must be >= 1) |
| 401 Unauthorized | Authentication failed | Invalid or expired JWT token |
| 403 Forbidden | Authorization failed | User not allowed to manage menu |
| 404 Not Found | Resource not found | Menu item not found |
| 409 Conflict | Duplicate or constraint violation | Menu with same name already exists |
| 500 Internal Server Error | Unexpected error | Database connection failed |

### Error Response Format

```typescript
// Standard error response
{
  statusCode: number;
  message: string | string[];
  error: string;
  timestamp: string;
  path: string;
}

// Example: Validation error
{
  statusCode: 400,
  message: [
    "name should not be empty",
    "price must be a positive number"
  ],
  error: "Bad Request",
  timestamp: "2026-05-13T10:30:00.000Z",
  path: "/menu"
}

// Example: Not found error
{
  statusCode: 404,
  message: "Menu item not found",
  error: "Not Found",
  timestamp: "2026-05-13T10:30:00.000Z",
  path: "/menu/123e4567-e89b-12d3-a456-426614174000"
}
```

---

## Success Response Standards

### Standard Success Response

```typescript
// For operations that don't return data
{
  message: string;
}

// Example
{
  message: "Menu item created successfully"
}
```

### Paginated Response

```typescript
{
  metaData: {
    currentPage: number;
    totalPages: number;
    totalCount: number;
    perPage: number;
  };
  data: T[];
}

// Example
{
  metaData: {
    currentPage: 1,
    totalPages: 5,
    totalCount: 48,
    perPage: 10
  },
  data: [
    { id: "...", name: "Burger", price: 9.99, ... },
    { id: "...", name: "Pizza", price: 12.99, ... }
  ]
}
```

### Grouped Response

```typescript
// When groupBy parameter is used
{
  [groupKey: string]: T[];
}

// Example: Menu grouped by category
{
  "Burgers": [
    { id: "...", name: "Classic Burger", price: 9.99 },
    { id: "...", name: "Cheese Burger", price: 10.99 }
  ],
  "Drinks": [
    { id: "...", name: "Coke", price: 2.99 },
    { id: "...", name: "Sprite", price: 2.99 }
  ]
}
```

---

## Non-Functional Requirements

### Performance

1. API response time SHALL be < 500ms for 95% of requests
2. Database queries SHALL be optimized with appropriate indexes
3. List endpoints SHALL support pagination to limit result sets
4. System SHALL handle 100 concurrent users per business
5. System SHALL handle 1000 orders per day per business

### Scalability

1. System SHALL support horizontal scaling of application servers
2. Database SHALL support read replicas for read-heavy operations
3. System SHALL support multiple businesses (multi-tenancy)
4. System SHALL support unlimited menu items per business
5. System SHALL support unlimited orders (with archiving strategy)

### Availability

1. System SHALL have 99.5% uptime during business hours
2. System SHALL implement graceful degradation when Kaha Main v3 is unavailable
3. System SHALL implement retry logic for service communication failures
4. System SHALL implement circuit breaker pattern for external service calls

### Security

1. All API endpoints SHALL use HTTPS in production
2. JWT tokens SHALL expire after 7 days
3. Passwords SHALL NOT be stored in Restaurant Service (handled by Kaha Main v3)
4. System SHALL implement rate limiting (100 req/min per IP)
5. System SHALL validate all user input
6. System SHALL use parameterized queries to prevent SQL injection
7. System SHALL sanitize output to prevent XSS attacks

### Maintainability

1. Code SHALL follow NestJS best practices
2. Code SHALL have TypeScript strict mode enabled
3. Code SHALL have comprehensive JSDoc comments
4. Code SHALL follow consistent naming conventions
5. Code SHALL have modular architecture (modules, services, controllers, repositories)
6. Code SHALL have separation of concerns (DTOs, entities, responses)

### Monitoring

1. System SHALL log all errors with stack traces
2. System SHALL log all API requests (method, path, userId, duration)
3. System SHALL log slow database queries (> 1 second)
4. System SHALL expose health check endpoint (/health)
5. System SHALL expose metrics endpoint for monitoring tools

---

## Deployment Requirements

### Environment Setup

1. System SHALL run on Node.js v18 or higher
2. System SHALL use PostgreSQL 14 or higher
3. System SHALL use TypeORM for database management
4. System SHALL use NestJS framework v10 or higher
5. System SHALL use Docker for containerization

### Configuration

1. System SHALL use environment variables for configuration
2. System SHALL provide .env.example file
3. System SHALL validate required environment variables on startup
4. System SHALL support multiple environments (development, staging, production)

### Database Migrations

1. System SHALL use TypeORM migrations for schema changes
2. Migrations SHALL be versioned and tracked
3. Migrations SHALL be reversible (support rollback)
4. Migrations SHALL be tested before production deployment

### Continuous Integration

1. System SHALL run tests on every commit
2. System SHALL run linting on every commit
3. System SHALL build Docker image on successful tests
4. System SHALL deploy to staging environment automatically
5. System SHALL require manual approval for production deployment

---

## Future Enhancements (Out of Scope for Phase 1)

1. Real-time order tracking via WebSockets
2. Push notifications for order status updates
3. Payment gateway integration
4. Delivery tracking with GPS
5. Loyalty program and rewards
6. Discount codes and promotions
7. Multi-language support
8. Advanced analytics dashboard
9. Inventory management
10. Table reservation system
11. QR code menu scanning
12. Kitchen display system (KDS)
13. Delivery partner integration
14. Customer feedback system
15. Email notifications

---

## Acceptance Criteria Summary

### Phase 1 Completion Criteria

The system SHALL be considered complete for Phase 1 when:

✅ All 20 requirements are implemented and tested
✅ All API endpoints are documented in Swagger
✅ Unit test coverage is >= 70%
✅ Integration tests cover all critical user flows
✅ Service communication with Kaha Main v3 is working
✅ Database migrations are created and tested
✅ Seed data scripts are provided
✅ Environment configuration is documented
✅ Deployment guide is provided
✅ API documentation is accessible
✅ Error handling is comprehensive
✅ Logging is implemented
✅ Security measures are in place
✅ Performance benchmarks are met

---

## Appendix A: Sample API Requests

### Create Menu Item

```http
POST /menu
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json

{
  "name": "Classic Burger",
  "description": "Juicy beef patty with lettuce, tomato, and cheese",
  "images": [
    "https://cdn.example.com/burger1.jpg",
    "https://cdn.example.com/burger2.jpg"
  ],
  "price": 9.99,
  "discountedPrice": 8.99,
  "categoryId": "123e4567-e89b-12d3-a456-426614174000",
  "businessId": "123e4567-e89b-12d3-a456-426614174001",
  "services": ["DINE_IN", "TAKEAWAY", "DELIVERY"],
  "isBarItem": false,
  "allowAddOns": true,
  "addOnIds": [
    "123e4567-e89b-12d3-a456-426614174002",
    "123e4567-e89b-12d3-a456-426614174003"
  ]
}
```

### Add Item to Cart

```http
POST /cart/item
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json

{
  "menuId": "123e4567-e89b-12d3-a456-426614174000",
  "quantity": 2,
  "addonInfo": [
    {
      "addonsId": "123e4567-e89b-12d3-a456-426614174002",
      "quantity": 1
    },
    {
      "addonsId": "123e4567-e89b-12d3-a456-426614174003",
      "quantity": 2
    }
  ]
}
```

### Place Order

```http
POST /order
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json

{
  "businessId": "123e4567-e89b-12d3-a456-426614174001",
  "remarks": "Extra napkins please",
  "items": [
    {
      "menuId": "123e4567-e89b-12d3-a456-426614174000",
      "quantity": 2,
      "addons": [
        {
          "addonId": "123e4567-e89b-12d3-a456-426614174002",
          "quantity": 1
        }
      ]
    }
  ]
}
```

### Update Order Status

```http
POST /order/123e4567-e89b-12d3-a456-426614174000/change-status
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json

{
  "status": "CONFIRMED",
  "remarks": "Order confirmed by kitchen"
}
```

---

## Appendix B: Database Indexes

```sql
-- Category indexes
CREATE INDEX idx_category_business_id ON category_entity(business_id);
CREATE INDEX idx_category_parent_id ON category_entity(parent_id);
CREATE INDEX idx_category_is_active ON category_entity(is_active);
CREATE INDEX idx_category_position ON category_entity(position);

-- Menu indexes
CREATE INDEX idx_menu_business_id ON menu_entity(business_id);
CREATE INDEX idx_menu_category_id ON menu_entity(category_id);
CREATE INDEX idx_menu_is_available ON menu_entity(is_available);
CREATE INDEX idx_menu_is_signature ON menu_entity(is_signature);
CREATE INDEX idx_menu_price ON menu_entity(price);

-- Cart indexes
CREATE INDEX idx_cart_user_id ON cart_entity(user_id);
CREATE INDEX idx_cart_item_cart_id ON cart_item_entity(cart_id);
CREATE INDEX idx_cart_item_menu_id ON cart_item_entity(menu_id);

-- Order indexes
CREATE INDEX idx_order_user_id ON order_entity(user_id);
CREATE INDEX idx_order_business_id ON order_entity(business_id);
CREATE INDEX idx_order_created_at ON order_entity(created_at);
CREATE INDEX idx_order_item_order_id ON order_item_entity(order_id);
CREATE INDEX idx_order_status_order_id ON order_status_entity(order_id);
CREATE INDEX idx_order_status_status ON order_status_entity(status);

-- Rating indexes
CREATE INDEX idx_rating_menu_id ON menu_rating_entity(menu_id);
CREATE INDEX idx_rating_business_id ON menu_rating_entity(business_id);
CREATE INDEX idx_rating_rated_by ON menu_rating_entity(rated_by);
```

---

## Document Revision History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2026-05-13 | System Architect | Initial draft based on microservices architecture |

---

**END OF DOCUMENT**
