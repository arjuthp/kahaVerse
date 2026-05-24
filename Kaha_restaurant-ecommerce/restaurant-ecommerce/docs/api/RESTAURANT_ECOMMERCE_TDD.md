# KAHA RESTAURANT E-COMMERCE
Smart Multi-Tenant Restaurant Ordering Platform  
Technical Design Document  
Version 1.0 | May 2026

| Property | Value |
|----------|-------|
| Project Name | Kaha Restaurant E-Commerce |
| Document Type | Technical Design Document (TDD) |
| Architecture | Multi-Tenant (Shared Database with Business Isolation) |
| Target Platforms | Mobile (iOS / Android), Web Dashboard |
| Backend Stack | Node.js / NestJS |
| Database | PostgreSQL with TypeORM |
| Authentication | JWT (JSON Web Tokens) |
| Version | 1.0 |

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [System Architecture](#2-system-architecture)
3. [Feature Modules](#3-feature-modules)
4. [Database Schema](#4-database-schema)
5. [API Endpoint Design](#5-api-endpoint-design)
6. [Security Considerations](#6-security-considerations)
7. [Deployment and Scalability](#7-deployment-and-scalability)
8. [Entity Relationship Summary](#8-entity-relationship-summary)
9. [Recommended Technology Stack](#9-recommended-technology-stack)
10. [Appendix](#10-appendix)

---

## 1. Executive Summary

Kaha Restaurant E-Commerce is a comprehensive multi-tenant SaaS platform designed for restaurants to manage their digital presence, menu offerings, and customer orders. The system enables restaurants to create digital menus with categories, add-ons, and pricing, while customers can browse menus, build carts, place orders, and track order status in real-time.

The platform operates on a **multi-tenant shared database architecture** where each restaurant (business) is isolated by a `businessId` field, ensuring complete data separation while maintaining cost efficiency. The system supports multiple user roles including Super Admin (platform management), Business Super Admin (restaurant owner), Admin (staff), and User (customer).

### Key Features:
- **Menu Management**: Create, update, and organize menu items with categories, images, pricing, and add-ons
- **Shopping Cart**: Real-time cart management with add-on selections and quantity updates
- **Order Processing**: Complete order lifecycle from placement to delivery with status tracking
- **Rating System**: Customer feedback and ratings for menu items
- **Multi-Service Support**: DINE_IN, TAKEAWAY, and DELIVERY service types
- **Role-Based Access Control**: Granular permissions for different user types
- **Real-time Updates**: Order status notifications and tracking


---

## 2. System Architecture

### 2.1 Multi-Tenant Strategy

Kaha Restaurant E-Commerce follows a **Shared Database with Business Isolation** model. All restaurants share the same PostgreSQL database, but data is strictly isolated using a `businessId` field present in all business-scoped entities. This approach provides:

- **Cost Efficiency**: Single database instance serves all tenants
- **Simplified Maintenance**: Schema updates apply to all tenants simultaneously
- **Data Isolation**: Query-level filtering ensures no cross-tenant data leakage
- **Scalability**: Horizontal scaling through read replicas and connection pooling
- **Regulatory Compliance**: Business-level data export and deletion capabilities

### 2.2 High-Level Architecture

The system consists of the following layers:

| Layer | Technology | Responsibility |
|-------|-----------|----------------|
| **API Gateway** | Nginx / AWS API Gateway | Rate limiting, SSL termination, load balancing |
| **Auth Service** | JWT + Passport.js | Authentication, token management, role validation |
| **Core API** | NestJS (Node.js) | Business logic, RBAC, CRUD operations |
| **Service Communication** | HTTP Client (Axios) | Integration with Kaha Main v3 API |
| **Database** | PostgreSQL 15+ | All application data with JSONB support |
| **ORM Layer** | TypeORM | Entity management, migrations, query building |
| **Cache Layer** | Redis (optional) | Session cache, rate limiting, query caching |
| **File Storage** | AWS S3 / Local Storage | Menu images, receipts, exports |
| **API Documentation** | Swagger / OpenAPI | Auto-generated API documentation |

### 2.3 Request Flow

Every API request follows this flow:

1. **Client** sends request with JWT token in Authorization header
2. **JWT Guard** validates token and extracts user payload (userId, role, businessId)
3. **Role Guard** checks if user has required permissions for the endpoint
4. **Controller** receives validated request and extracts parameters
5. **Service Layer** executes business logic with businessId filtering
6. **Repository Layer** performs database operations with TypeORM
7. **Response** returns formatted data with appropriate HTTP status

```
Client Request
     │
     ├─► JWT Authentication Guard
     │   └─► Extract: userId, role, businessId
     │
     ├─► Role Authorization Guard
     │   └─► Validate: required permissions
     │
     ├─► Controller Layer
     │   └─► Parse: params, query, body
     │
     ├─► Service Layer
     │   └─► Execute: business logic
     │
     ├─► Repository Layer
     │   └─► Query: database with businessId filter
     │
     └─► Response
         └─► Format: JSON with status code
```


---

## 3. Feature Modules

### 3.1 Authentication and Authorization Module

This module handles user authentication, JWT token management, and role-based access control.

**Features:**
- JWT-based authentication with access tokens
- Password hashing with bcrypt
- Role-based route guards
- User payload extraction from tokens
- Token refresh mechanism (if implemented)

**User Roles:**

| Role | Description | Key Permissions |
|------|-------------|-----------------|
| **SUPER_ADMIN** | Platform Administrator | Full system access, manage all businesses |
| **BUSINESS_SUPER_ADMIN** | Restaurant Owner | Full access to own business data, menu management, order management |
| **ADMIN** | Restaurant Staff | View orders, update order status, view menu |
| **USER** | Customer | Browse menu, manage cart, place orders, rate items |

**Authentication Flow:**
1. User registers or logs in with credentials
2. System validates credentials and generates JWT token
3. Token contains: userId, role, businessId (for business users)
4. Client includes token in Authorization header for subsequent requests
5. JWT Guard validates token on each protected endpoint

### 3.2 Menu Management Module

Comprehensive menu item management with categories, pricing, images, and add-ons.

**Features:**
- Create, read, update, delete (CRUD) menu items
- Multiple images per menu item
- Price and discounted price support
- Service type filtering (DINE_IN, TAKEAWAY, DELIVERY)
- Signature dish marking (max 3 per business)
- Availability toggle
- Bar item classification
- Add-on assignment and management
- Category-based organization

**Menu Fields:**

| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Unique identifier |
| name | VARCHAR(255) | Menu item name |
| description | TEXT | Detailed description |
| images | TEXT[] | Array of image URLs |
| details | JSONB | Additional structured data |
| price | DECIMAL(12,2) | Base price |
| discountedPrice | DECIMAL(12,2) | Sale price (nullable) |
| isAvailable | BOOLEAN | Availability status |
| isBarItem | BOOLEAN | Bar/alcohol classification |
| isSignature | BOOLEAN | Signature dish flag |
| allowAddOns | BOOLEAN | Whether add-ons are allowed |
| services | ENUM[] | [DINE_IN, TAKEAWAY, DELIVERY] |
| businessId | UUID | Business owner reference |
| categoryId | UUID | Category reference |

**Business Rules:**
- Maximum 3 signature dishes per business
- Menu names must be unique within a business
- Soft delete preserves historical data
- Add-ons are optional and configurable per menu item


### 3.3 Category Management Module

Hierarchical category system for organizing menu items.

**Features:**
- Create, read, update, delete categories
- Self-referencing parent-child relationships
- Unlimited nesting depth
- Position-based ordering
- Icon support for visual representation
- Active/inactive status toggle
- Business-scoped categories

**Category Fields:**

| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Unique identifier |
| name | VARCHAR(255) | Category name (unique per business) |
| description | TEXT | Category description |
| icon | VARCHAR(255) | Icon URL or identifier |
| isActive | BOOLEAN | Visibility status |
| position | INTEGER | Display order |
| businessId | UUID | Business owner reference |
| parentId | UUID | Parent category (nullable for root) |

**Hierarchy Example:**
```
Food (root)
├── Appetizers
│   ├── Salads
│   └── Soups
├── Main Course
│   ├── Vegetarian
│   └── Non-Vegetarian
└── Desserts

Beverages (root)
├── Hot Drinks
└── Cold Drinks
```

### 3.4 Add-ons Management Module

Reusable add-on items that can be attached to multiple menu items.

**Features:**
- Create, read, update, delete add-ons
- Price management
- Image/cover support
- Many-to-many relationship with menu items
- Quantity-based selection in cart and orders

**Add-on Fields:**

| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Unique identifier |
| name | VARCHAR(255) | Add-on name |
| price | DECIMAL(12,2) | Additional cost |
| description | TEXT | Add-on description |
| coverImg | VARCHAR(255) | Image URL |

**Usage Example:**
```
Menu Item: "Margherita Pizza"
Available Add-ons:
- Extra Cheese (+$2.00)
- Olives (+$1.50)
- Mushrooms (+$1.75)
- Pepperoni (+$2.50)

Customer Selection:
- Extra Cheese (qty: 2) = $4.00
- Mushrooms (qty: 1) = $1.75
Total Add-ons: $5.75
```


### 3.5 Shopping Cart Module

Real-time shopping cart management with add-on selections.

**Features:**
- One cart per user (auto-created on first item addition)
- Add, update, remove cart items
- Quantity management
- Add-on selection per cart item
- Business-grouped cart view
- Price calculation with add-ons
- Cascade delete (deleting cart removes all items)

**Cart Structure:**

```
Cart
├── id: UUID
├── userId: UUID
└── CartItems[]
    ├── CartItem 1
    │   ├── id: UUID
    │   ├── menuId: UUID
    │   ├── quantity: INTEGER
    │   └── CartItemAddOns[]
    │       ├── addOnId: UUID
    │       └── quantity: INTEGER
    └── CartItem 2
        └── ...
```

**Price Calculation Logic:**
```javascript
For each CartItem:
  itemTotal = menu.price × cartItem.quantity
  
  For each CartItemAddOn:
    addonTotal = addOn.price × addOn.quantity
    addonsTotal += addonTotal
  
  cartItemGrandTotal = itemTotal + addonsTotal

cartGrandTotal = sum(all cartItemGrandTotals)
```

**Business Rules:**
- Cart is user-specific (one cart per user)
- Cart items reference live menu prices (not snapshot)
- Deleting a cart cascades to all cart items and their add-ons
- Cart can be grouped by businessId for multi-restaurant support

### 3.6 Order Management Module

Complete order lifecycle management from placement to delivery.

**Features:**
- Create orders from cart items
- Price snapshot at order time
- Order status tracking with history
- Business-scoped order views
- Customer order history
- Status update with remarks
- Order item and add-on preservation

**Order Lifecycle:**

```
PENDING → CONFIRMED → PREPARING → READY → DELIVERED
                ↓
            CANCELLED (at any stage)
```

**Order Status Enum:**

| Status | Description | Who Can Set |
|--------|-------------|-------------|
| PENDING | Order placed, awaiting confirmation | System (on creation) |
| CONFIRMED | Restaurant confirmed the order | Business Admin |
| PREPARING | Order is being prepared | Business Admin |
| READY | Order ready for pickup/delivery | Business Admin |
| DELIVERED | Order completed | Business Admin / Customer |
| CANCELLED | Order cancelled | Business Admin / Customer |

**Order Fields:**

| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Unique identifier |
| userId | UUID | Customer reference |
| businessId | UUID | Restaurant reference |
| totalAmount | FLOAT | Total order value (snapshot) |
| remarks | TEXT | Customer notes |
| createdAt | TIMESTAMP | Order placement time |

**Order Item Fields:**

| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Unique identifier |
| orderId | UUID | Parent order reference |
| menuId | UUID | Menu item reference |
| quantity | INTEGER | Item quantity |
| price | DECIMAL(12,2) | **Price snapshot** at order time |

**Order Item Add-on Fields:**

| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Unique identifier |
| orderItemId | UUID | Parent order item reference |
| addonId | UUID | Add-on reference |
| quantity | INTEGER | Add-on quantity |
| price | DECIMAL(12,2) | **Price snapshot** at order time |

**Price Snapshot Pattern:**

Unlike cart items which reference live prices, order items store price snapshots to ensure:
- Historical accuracy (price changes don't affect past orders)
- Financial audit compliance
- Customer trust (price at checkout is price paid)
- Reporting accuracy


### 3.7 Order Status Tracking Module

Maintains complete history of order status changes.

**Features:**
- Status history preservation
- Timestamp tracking for each status change
- User tracking (who updated the status)
- Remarks/notes for each status change
- Audit trail for compliance

**Order Status Fields:**

| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Unique identifier |
| orderId | UUID | Parent order reference |
| status | ENUM | Current status value |
| updatedBy | UUID | User who made the change |
| remarks | TEXT | Optional notes |
| createdAt | TIMESTAMP | When status was set |

**Status History Example:**
```
Order #12345 Status History:
1. PENDING (2026-05-13 10:30:00) - System - "Order placed"
2. CONFIRMED (2026-05-13 10:32:15) - Admin User - "Order confirmed"
3. PREPARING (2026-05-13 10:45:00) - Kitchen Staff - "Started preparation"
4. READY (2026-05-13 11:15:00) - Kitchen Staff - "Ready for pickup"
5. DELIVERED (2026-05-13 11:30:00) - Delivery Staff - "Delivered to customer"
```

### 3.8 Menu Rating Module

Customer feedback and rating system for menu items.

**Features:**
- Rate menu items (1-5 scale)
- Written comments/reviews
- Business-scoped ratings
- User attribution
- Average rating calculation

**Menu Rating Fields:**

| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Unique identifier |
| menuId | UUID | Menu item reference |
| rating | FLOAT | Rating value (1.0 - 5.0) |
| comments | TEXT | Customer review |
| ratedBy | UUID | Customer user ID |
| businessId | UUID | Business reference |
| createdAt | TIMESTAMP | Rating submission time |

**Rating Display:**
```
Menu Item: "Chicken Biryani"
Average Rating: 4.5 ★ (based on 127 reviews)

Recent Reviews:
★★★★★ (5.0) - John D. - "Best biryani in town!"
★★★★☆ (4.0) - Sarah M. - "Good taste, slightly spicy"
★★★★★ (5.0) - Mike R. - "Authentic flavors"
```

### 3.9 Service Communication Module

Integration layer for communicating with external services (Kaha Main v3 API).

**Features:**
- HTTP client wrapper (Axios)
- Configurable base URL from environment
- Error handling and retry logic
- Request/response logging
- Authentication token forwarding

**Configuration:**
```typescript
KAHA_API_LINK=https://api.kaha-main-v3.com
```

**Usage Example:**
```typescript
// Sync menu data with main platform
await serviceCommunicationService.post('/menu/sync', {
  businessId,
  menuItems: [...],
});

// Fetch business details
const business = await serviceCommunicationService.get(
  `/business/${businessId}`
);
```


---

## 4. Database Schema

### 4.1 Base Entity (Abstract)

All entities extend from a base entity providing common fields:

| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Primary key, auto-generated |
| createdAt | TIMESTAMP | Record creation time |
| updatedAt | TIMESTAMP | Last modification time |
| deletedAt | TIMESTAMP | Soft delete marker (nullable) |

**Soft Delete Pattern:**
- Records are never physically deleted
- `deletedAt` timestamp marks deletion
- Queries automatically filter deleted records
- Data recovery is possible
- Audit trail is maintained

### 4.2 Core Entities

#### **category** (CategoryEntity)

Hierarchical menu categorization.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK, NOT NULL | Unique identifier |
| name | VARCHAR(255) | NOT NULL, UNIQUE(name, businessId) | Category name |
| description | TEXT | NULLABLE | Category description |
| icon | VARCHAR(255) | NULLABLE | Icon URL or identifier |
| isActive | BOOLEAN | DEFAULT true | Visibility status |
| position | INTEGER | DEFAULT 0 | Display order |
| businessId | UUID | NOT NULL, INDEXED | Business owner |
| parentId | UUID | FK → category.id, NULLABLE | Parent category |
| createdAt | TIMESTAMP | DEFAULT NOW() | Creation time |
| updatedAt | TIMESTAMP | DEFAULT NOW() | Last update |
| deletedAt | TIMESTAMP | NULLABLE | Soft delete marker |

**Relationships:**
- Self-referencing: `parentId` → `category.id` (parent-child hierarchy)
- One-to-Many: `category` → `menu` (one category has many menus)

**Indexes:**
- `idx_category_business` on `businessId`
- `idx_category_parent` on `parentId`
- `unique_category_name_business` on `(name, businessId)` where `deletedAt IS NULL`

---

#### **add_on_entity** (AddOnEntity)

Reusable add-on items.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK, NOT NULL | Unique identifier |
| name | VARCHAR(255) | NOT NULL | Add-on name |
| price | DECIMAL(12,2) | NOT NULL, CHECK > 0 | Additional cost |
| description | TEXT | NULLABLE | Add-on description |
| coverImg | VARCHAR(255) | NULLABLE | Image URL |
| createdAt | TIMESTAMP | DEFAULT NOW() | Creation time |
| updatedAt | TIMESTAMP | DEFAULT NOW() | Last update |
| deletedAt | TIMESTAMP | NULLABLE | Soft delete marker |

**Relationships:**
- Many-to-Many: `add_on_entity` ↔ `menu_entity` (via `menu_add_on_entity` junction)
- Referenced by: `cart_item_add_ons_entity`, `order_item_addon_entity`

---

#### **menu_entity** (MenuEntity)

Menu items with pricing and configuration.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK, NOT NULL | Unique identifier |
| name | VARCHAR(255) | NOT NULL | Menu item name |
| description | TEXT | NULLABLE | Detailed description |
| images | TEXT[] | DEFAULT '{}' | Array of image URLs |
| details | JSONB | NULLABLE | Additional structured data |
| price | DECIMAL(12,2) | NOT NULL, CHECK > 0 | Base price |
| discountedPrice | DECIMAL(12,2) | NULLABLE, CHECK > 0 | Sale price |
| isAvailable | BOOLEAN | DEFAULT true | Availability status |
| isBarItem | BOOLEAN | DEFAULT false | Bar/alcohol classification |
| isSignature | BOOLEAN | DEFAULT false | Signature dish flag |
| allowAddOns | BOOLEAN | DEFAULT true | Add-ons allowed |
| services | ENUM[] | NOT NULL | [DINE_IN, TAKEAWAY, DELIVERY] |
| businessId | UUID | NOT NULL, INDEXED | Business owner |
| categoryId | UUID | FK → category.id | Category reference |
| createdAt | TIMESTAMP | DEFAULT NOW() | Creation time |
| updatedAt | TIMESTAMP | DEFAULT NOW() | Last update |
| deletedAt | TIMESTAMP | NULLABLE | Soft delete marker |

**Relationships:**
- Many-to-One: `menu_entity` → `category`
- Many-to-Many: `menu_entity` ↔ `add_on_entity` (via junction)
- One-to-Many: `menu_entity` → `menu_rating_entity`
- Referenced by: `cart_item_entity`, `order_item_entity`

**Indexes:**
- `idx_menu_business` on `businessId`
- `idx_menu_category` on `categoryId`
- `idx_menu_signature` on `(businessId, isSignature)` where `isSignature = true`

**Constraints:**
- `check_discounted_price` CHECK (`discountedPrice` IS NULL OR `discountedPrice` < `price`)
- `unique_menu_name_business` UNIQUE (`name`, `businessId`) where `deletedAt IS NULL`


---

#### **menu_add_on_entity** (Junction Table)

Many-to-many relationship between menus and add-ons.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| menuId | UUID | FK → menu_entity.id | Menu reference |
| addOnId | UUID | FK → add_on_entity.id | Add-on reference |

**Composite Primary Key:** (`menuId`, `addOnId`)

**Relationships:**
- Links `menu_entity` ↔ `add_on_entity`

---

#### **menu_rating_entity** (MenuRatingEntity)

Customer ratings and reviews for menu items.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK, NOT NULL | Unique identifier |
| menuId | UUID | FK → menu_entity.id, NOT NULL | Menu item reference |
| rating | FLOAT | NOT NULL, CHECK (1.0 - 5.0) | Rating value |
| comments | TEXT | NULLABLE | Customer review |
| ratedBy | UUID | NOT NULL | Customer user ID |
| businessId | UUID | NOT NULL, INDEXED | Business reference |
| createdAt | TIMESTAMP | DEFAULT NOW() | Rating time |
| updatedAt | TIMESTAMP | DEFAULT NOW() | Last update |
| deletedAt | TIMESTAMP | NULLABLE | Soft delete marker |

**Relationships:**
- Many-to-One: `menu_rating_entity` → `menu_entity`

**Indexes:**
- `idx_rating_menu` on `menuId`
- `idx_rating_business` on `businessId`

---

#### **cart_entity** (CartEntity)

User shopping carts.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK, NOT NULL | Unique identifier |
| userId | UUID | NOT NULL, UNIQUE | User reference |
| createdAt | TIMESTAMP | DEFAULT NOW() | Cart creation time |
| updatedAt | TIMESTAMP | DEFAULT NOW() | Last update |
| deletedAt | TIMESTAMP | NULLABLE | Soft delete marker |

**Relationships:**
- One-to-Many: `cart_entity` → `cart_item_entity` (CASCADE DELETE)

**Indexes:**
- `unique_cart_user` UNIQUE on `userId` where `deletedAt IS NULL`

---

#### **cart_item_entity** (CartItemEntity)

Items in shopping cart.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK, NOT NULL | Unique identifier |
| cartId | UUID | FK → cart_entity.id, NOT NULL | Cart reference |
| menuId | UUID | FK → menu_entity.id, NOT NULL | Menu item reference |
| quantity | INTEGER | NOT NULL, CHECK > 0 | Item quantity |
| createdAt | TIMESTAMP | DEFAULT NOW() | Addition time |
| updatedAt | TIMESTAMP | DEFAULT NOW() | Last update |
| deletedAt | TIMESTAMP | NULLABLE | Soft delete marker |

**Relationships:**
- Many-to-One: `cart_item_entity` → `cart_entity` (CASCADE DELETE)
- Many-to-One: `cart_item_entity` → `menu_entity`
- One-to-Many: `cart_item_entity` → `cart_item_add_ons_entity`

**Indexes:**
- `idx_cartitem_cart` on `cartId`
- `idx_cartitem_menu` on `menuId`

**Cascade Behavior:**
- Deleting cart deletes all cart items
- Deleting cart item deletes all its add-ons

---

#### **cart_item_add_ons_entity** (CartItemAddOnsEntity)

Add-on selections for cart items.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK, NOT NULL | Unique identifier |
| cartItemId | UUID | FK → cart_item_entity.id, NOT NULL | Cart item reference |
| menuAddOnId | UUID | FK → add_on_entity.id, NOT NULL | Add-on reference |
| quantity | INTEGER | NOT NULL, CHECK > 0 | Add-on quantity |
| createdAt | TIMESTAMP | DEFAULT NOW() | Addition time |
| updatedAt | TIMESTAMP | DEFAULT NOW() | Last update |
| deletedAt | TIMESTAMP | NULLABLE | Soft delete marker |

**Relationships:**
- Many-to-One: `cart_item_add_ons_entity` → `cart_item_entity`
- Many-to-One: `cart_item_add_ons_entity` → `add_on_entity`

**Indexes:**
- `idx_cartitem_addon_item` on `cartItemId`
- `idx_cartitem_addon_addon` on `menuAddOnId`


---

#### **order_entity** (OrderEntity)

Customer orders.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK, NOT NULL | Unique identifier |
| userId | UUID | NOT NULL, INDEXED | Customer reference |
| businessId | UUID | NOT NULL, INDEXED | Restaurant reference |
| totalAmount | FLOAT | NOT NULL, CHECK >= 0 | Total order value |
| remarks | TEXT | NULLABLE | Customer notes |
| createdAt | TIMESTAMP | DEFAULT NOW() | Order placement time |
| updatedAt | TIMESTAMP | DEFAULT NOW() | Last update |
| deletedAt | TIMESTAMP | NULLABLE | Soft delete marker |

**Relationships:**
- One-to-Many: `order_entity` → `order_item_entity`
- One-to-Many: `order_entity` → `order_status_entity`

**Indexes:**
- `idx_order_user` on `userId`
- `idx_order_business` on `businessId`
- `idx_order_created` on `createdAt DESC`

---

#### **order_item_entity** (OrderItemEntity)

Items in an order with price snapshot.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK, NOT NULL | Unique identifier |
| orderId | UUID | FK → order_entity.id, NOT NULL | Order reference |
| menuId | UUID | FK → menu_entity.id, NOT NULL | Menu item reference |
| quantity | INTEGER | NOT NULL, CHECK > 0 | Item quantity |
| price | DECIMAL(12,2) | NOT NULL, CHECK > 0 | **Price snapshot** |
| createdAt | TIMESTAMP | DEFAULT NOW() | Creation time |
| updatedAt | TIMESTAMP | DEFAULT NOW() | Last update |
| deletedAt | TIMESTAMP | NULLABLE | Soft delete marker |

**Relationships:**
- Many-to-One: `order_item_entity` → `order_entity`
- Many-to-One: `order_item_entity` → `menu_entity`
- One-to-Many: `order_item_entity` → `order_item_addon_entity`

**Indexes:**
- `idx_orderitem_order` on `orderId`
- `idx_orderitem_menu` on `menuId`

**Important:** Price is stored as a snapshot at order time, not a reference to live menu price.

---

#### **order_item_addon_entity** (OrderItemAddonEntity)

Add-on selections in order with price snapshot.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK, NOT NULL | Unique identifier |
| orderItemId | UUID | FK → order_item_entity.id, NOT NULL | Order item reference |
| addonId | UUID | FK → add_on_entity.id, NOT NULL | Add-on reference |
| quantity | INTEGER | NOT NULL, CHECK > 0 | Add-on quantity |
| price | DECIMAL(12,2) | NOT NULL, CHECK > 0 | **Price snapshot** |
| createdAt | TIMESTAMP | DEFAULT NOW() | Creation time |
| updatedAt | TIMESTAMP | DEFAULT NOW() | Last update |
| deletedAt | TIMESTAMP | NULLABLE | Soft delete marker |

**Relationships:**
- Many-to-One: `order_item_addon_entity` → `order_item_entity`
- Many-to-One: `order_item_addon_entity` → `add_on_entity`

**Indexes:**
- `idx_orderitem_addon_item` on `orderItemId`
- `idx_orderitem_addon_addon` on `addonId`

**Important:** Price is stored as a snapshot at order time.

---

#### **order_status_entity** (OrderStatusEntity)

Order status history tracking.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK, NOT NULL | Unique identifier |
| orderId | UUID | FK → order_entity.id, NOT NULL | Order reference |
| status | ENUM | NOT NULL | Status value |
| updatedBy | UUID | NOT NULL | User who updated |
| remarks | TEXT | NULLABLE | Status change notes |
| createdAt | TIMESTAMP | DEFAULT NOW() | Status change time |
| updatedAt | TIMESTAMP | DEFAULT NOW() | Last update |
| deletedAt | TIMESTAMP | NULLABLE | Soft delete marker |

**Status Enum Values:**
- `PENDING`
- `CONFIRMED`
- `PREPARING`
- `READY`
- `DELIVERED`
- `CANCELLED`

**Relationships:**
- Many-to-One: `order_status_entity` → `order_entity`

**Indexes:**
- `idx_orderstatus_order` on `orderId`
- `idx_orderstatus_created` on `createdAt DESC`

**Business Logic:**
- Each status change creates a new record
- Complete audit trail of order lifecycle
- Latest status represents current order state


### 4.3 Entity Relationship Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                    DATABASE SCHEMA OVERVIEW                      │
└─────────────────────────────────────────────────────────────────┘

                    ┌──────────────┐
                    │   category   │◄─┐
                    └──────┬───────┘  │ (self-reference)
                           │          │ parent/children
                           │          │
                           ↓          │
                    ┌──────────────┐  │
            ┌──────►│ menu_entity  │  │
            │       └──────┬───────┘  │
            │              │          │
            │              ├──────────┘
            │              │
            │              ├─────────────────┐
            │              │                 │
            │              ↓                 ↓
            │       ┌──────────────┐  ┌──────────────┐
            │       │menu_rating   │  │cart_item     │
            │       │_entity       │  │_entity       │
            │       └──────────────┘  └──────┬───────┘
            │                                │
            │                                ↓
            │                         ┌──────────────┐
            │                         │cart_item     │
            │                         │_add_ons      │
            │                         │_entity       │
            │                         └──────┬───────┘
            │                                │
┌──────────────┐                            │
│ add_on_entity│◄───────────────────────────┘
└──────┬───────┘                            │
       ↑                                    │
       │                                    ↓
       │                             ┌──────────────┐
       │                             │cart_entity   │
       │                             └──────────────┘
       │
       │                             ┌──────────────┐
       └────────────────────────────►│order_item    │
                                     │_entity       │
                                     └──────┬───────┘
                                            │
                                            ↓
                                     ┌──────────────┐
                                     │order_item    │
                                     │_addon_entity │
                                     └──────┬───────┘
                                            │
                                            ↓
                                     ┌──────────────┐
                                     │order_entity  │
                                     └──────┬───────┘
                                            │
                                            ↓
                                     ┌──────────────┐
                                     │order_status  │
                                     │_entity       │
                                     └──────────────┘
```

### 4.4 Database Design Patterns

#### 1. Soft Delete Pattern
All entities use soft delete via `deletedAt` timestamp:
- **Benefits:** Data recovery, audit trail, referential integrity
- **Implementation:** TypeORM `@DeleteDateColumn()` decorator
- **Query Behavior:** Automatically filters deleted records

#### 2. Price Snapshot Pattern
Orders store prices at transaction time:
- **Cart Phase:** References live menu/add-on prices
- **Order Phase:** Stores price snapshots
- **Benefits:** Historical accuracy, audit compliance, customer trust

#### 3. Status History Pattern
Order status changes are append-only:
- **Never Update:** Each status change creates new record
- **Benefits:** Complete audit trail, timeline reconstruction
- **Query:** Latest status = current state

#### 4. Multi-Tenant Isolation
Business data isolated via `businessId`:
- **Enforcement:** Query-level filtering in repositories
- **Benefits:** Data security, cost efficiency
- **Implementation:** WHERE clause on all business-scoped queries


---

## 5. API Endpoint Design

All endpoints follow RESTful conventions. Base URL: `https://api.kaha-restaurant.com/api/v1`

### 5.1 Authentication Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/auth/register` | Register new user | No |
| POST | `/auth/login` | Login with credentials | No |
| POST | `/auth/refresh` | Refresh access token | Refresh Token |
| POST | `/auth/logout` | Logout user | Yes |

### 5.2 Menu Endpoints

| Method | Endpoint | Description | Required Role |
|--------|----------|-------------|---------------|
| GET | `/menu/:businessId` | List all menu items (public) | None |
| GET | `/menu/:id` | Get single menu item | None |
| POST | `/menu` | Create menu item | BUSINESS_SUPER_ADMIN |
| PATCH | `/menu/:id` | Update menu item | BUSINESS_SUPER_ADMIN |
| DELETE | `/menu/:id` | Delete menu item (soft) | BUSINESS_SUPER_ADMIN |
| PATCH | `/menu/toggle-signature/:id` | Toggle signature status | BUSINESS_SUPER_ADMIN |
| PATCH | `/menu/update-addons/:id` | Update menu add-ons | BUSINESS_SUPER_ADMIN |

**Query Parameters for GET `/menu/:businessId`:**
- `page` (number): Page number (default: 1)
- `take` (number): Items per page (default: 10)
- `name` (string): Filter by name (partial match)
- `categoryId` (UUID): Filter by category
- `minPrice` (number): Minimum price filter
- `maxPrice` (number): Maximum price filter
- `isSignature` (boolean): Filter signature dishes
- `isAvailable` (boolean): Filter available items
- `services` (enum): Filter by service type
- `groupBy` (string): Group results by "category"

### 5.3 Category Endpoints

| Method | Endpoint | Description | Required Role |
|--------|----------|-------------|---------------|
| GET | `/categories/:businessId` | List all categories | None |
| GET | `/categories/:id` | Get single category | None |
| POST | `/categories` | Create category | BUSINESS_SUPER_ADMIN |
| PATCH | `/categories/:id` | Update category | BUSINESS_SUPER_ADMIN |
| DELETE | `/categories/:id` | Delete category (soft) | BUSINESS_SUPER_ADMIN |

### 5.4 Add-ons Endpoints

| Method | Endpoint | Description | Required Role |
|--------|----------|-------------|---------------|
| GET | `/addons` | List all add-ons | None |
| GET | `/addons/:id` | Get single add-on | None |
| POST | `/addons` | Create add-on | BUSINESS_SUPER_ADMIN |
| PATCH | `/addons/:id` | Update add-on | BUSINESS_SUPER_ADMIN |
| DELETE | `/addons/:id` | Delete add-on (soft) | BUSINESS_SUPER_ADMIN |

### 5.5 Cart Endpoints

| Method | Endpoint | Description | Required Role |
|--------|----------|-------------|---------------|
| GET | `/cart` | Get user's cart | USER |
| POST | `/cart` | Create cart | USER |
| POST | `/cart/item` | Add item to cart | USER |
| PATCH | `/cart/:itemId` | Update cart item | USER |
| DELETE | `/cart/:id` | Delete cart item | USER |

**Query Parameters for GET `/cart`:**
- `groupBy` (string): Group by "business" for multi-restaurant carts

**Request Body for POST `/cart/item`:**
```json
{
  "menuId": "uuid",
  "quantity": 2,
  "addonInfo": [
    {
      "addonsId": "uuid",
      "quantity": 1
    }
  ]
}
```

### 5.6 Order Endpoints

| Method | Endpoint | Description | Required Role |
|--------|----------|-------------|---------------|
| GET | `/order/user` | Get user's orders | USER |
| GET | `/order/:id` | Get single order | USER / BUSINESS_SUPER_ADMIN |
| GET | `/order/business-man-vs/:businessId` | Get business orders | BUSINESS_SUPER_ADMIN |
| POST | `/order` | Create order | USER |
| POST | `/order/:orderId/change-status` | Update order status | USER / BUSINESS_SUPER_ADMIN |

**Query Parameters for GET `/order/user`:**
- `page` (number): Page number
- `take` (number): Items per page
- `status` (enum): Filter by status

**Query Parameters for GET `/order/business-man-vs/:businessId`:**
- `page` (number): Page number
- `take` (number): Items per page
- `status` (enum): Filter by status
- `dateFrom` (date): Start date filter
- `dateTo` (date): End date filter

**Request Body for POST `/order`:**
```json
{
  "businessId": "uuid",
  "remarks": "No onions please",
  "items": [
    {
      "menuId": "uuid",
      "quantity": 2,
      "addons": [
        {
          "addonId": "uuid",
          "quantity": 1
        }
      ]
    }
  ]
}
```

**Request Body for POST `/order/:orderId/change-status`:**
```json
{
  "status": "CONFIRMED",
  "remarks": "Order confirmed by restaurant"
}
```

### 5.7 Menu Rating Endpoints

| Method | Endpoint | Description | Required Role |
|--------|----------|-------------|---------------|
| GET | `/menu-rating` | List ratings | None |
| GET | `/menu-rating/:id` | Get single rating | None |
| POST | `/menu-rating` | Create rating | USER |
| PATCH | `/menu-rating/:id` | Update rating | USER (own only) |
| DELETE | `/menu-rating/:id` | Delete rating | USER (own only) |

**Request Body for POST `/menu-rating`:**
```json
{
  "menuId": "uuid",
  "rating": 4.5,
  "comments": "Excellent taste!",
  "businessId": "uuid"
}
```


---

## 6. Security Considerations

### 6.1 Authentication Security

**JWT Token Management:**
- Access tokens: Short-lived (15-60 minutes recommended)
- Refresh tokens: Long-lived (7-30 days)
- Tokens signed with RS256 or HS256 algorithm
- Secret key stored in environment variables
- Token payload includes: `userId`, `role`, `businessId`

**Password Security:**
- Passwords hashed with bcrypt (cost factor 10-12)
- Minimum password requirements enforced
- Password reset via secure token mechanism
- Account lockout after failed attempts (recommended)

**Rate Limiting:**
- Authentication endpoints: 5 attempts per minute per IP
- API endpoints: 100 requests per minute per user
- Implement using Redis or in-memory store

### 6.2 Authorization Security

**Role-Based Access Control (RBAC):**
- Route guards validate user role before execution
- Business-scoped operations validate `businessId` ownership
- User can only access own cart and orders
- Business admin can only access own business data

**Business Isolation:**
- All queries include `businessId` filter for business-scoped data
- Repository layer enforces business isolation
- Cross-tenant data access prevented at query level

**Input Validation:**
- All inputs validated using class-validator decorators
- DTO (Data Transfer Object) pattern for request validation
- SQL injection prevention via TypeORM parameterized queries
- XSS prevention via input sanitization

### 6.3 Data Security

**Encryption:**
- All API traffic over HTTPS (TLS 1.3)
- Sensitive data encrypted at rest (if required)
- Database connections use SSL/TLS

**Soft Delete:**
- Data never physically deleted
- Audit trail maintained for compliance
- Data recovery possible

**Audit Logging:**
- Log all write operations (create, update, delete)
- Track user actions with timestamps
- Store IP address and user agent (recommended)

### 6.4 API Security

**CORS Configuration:**
- Restrict origins to known domains
- Configure allowed methods and headers
- Credentials support if needed

**Request Validation:**
- Validate all UUID parameters
- Validate enum values
- Validate numeric ranges
- Validate required fields

**Error Handling:**
- Never expose internal errors to client
- Use generic error messages
- Log detailed errors server-side
- Return appropriate HTTP status codes

### 6.5 Security Best Practices

1. **Environment Variables:** Store all secrets in `.env` file (never commit)
2. **Dependency Updates:** Regularly update npm packages for security patches
3. **SQL Injection:** Use TypeORM query builder or parameterized queries
4. **XSS Prevention:** Sanitize user inputs, escape outputs
5. **CSRF Protection:** Implement CSRF tokens for state-changing operations
6. **File Upload:** Validate file types, sizes, and scan for malware
7. **Logging:** Log security events (failed logins, unauthorized access)
8. **Monitoring:** Monitor for suspicious activity and rate limit violations


---

## 7. Deployment and Scalability

### 7.1 Deployment Architecture

**Containerization:**
- Docker containers for application
- Docker Compose for local development
- Kubernetes for production orchestration

**Infrastructure:**
- **Application Servers:** Multiple Node.js instances behind load balancer
- **Database:** PostgreSQL managed instance (AWS RDS / GCP Cloud SQL)
- **Cache:** Redis cluster for session management
- **File Storage:** AWS S3 or equivalent for images
- **CDN:** CloudFront or equivalent for static assets

**Environment Configuration:**

```bash
# Application
APP_PORT=3005
NODE_ENV=production

# Database
DB_HOST=postgres.example.com
DB_PORT=5432
DB_NAME=kaha_restaurant
DB_USER_NAME=app_user
DB_PASSWORD=secure_password

# JWT
JWT_SECRET_TOKEN=your_secret_key_here

# External Services
KAHA_API_LINK=https://api.kaha-main-v3.com
```

### 7.2 Scalability Strategies

**Horizontal Scaling:**
- Multiple application instances behind load balancer
- Stateless application design (JWT tokens, no server sessions)
- Database connection pooling per instance

**Database Optimization:**
- Proper indexing on frequently queried fields
- Query optimization with EXPLAIN ANALYZE
- Read replicas for read-heavy operations
- Connection pooling (pg-pool)

**Caching Strategy:**
- Redis for session management
- Cache frequently accessed data (menu items, categories)
- Cache invalidation on data updates
- TTL-based cache expiration

**Performance Optimization:**
- Lazy loading of relations in TypeORM
- Pagination for list endpoints
- Compression middleware (gzip)
- Database query optimization
- CDN for static assets

### 7.3 Monitoring and Logging

**Application Monitoring:**
- Health check endpoint: `GET /health`
- Metrics collection (Prometheus)
- Performance monitoring (New Relic / DataDog)
- Error tracking (Sentry)

**Logging:**
- Structured logging (Winston / Pino)
- Log levels: ERROR, WARN, INFO, DEBUG
- Centralized log aggregation (ELK Stack / CloudWatch)
- Request/response logging

**Alerting:**
- High error rate alerts
- Database connection failures
- API response time degradation
- Disk space warnings

### 7.4 Backup and Disaster Recovery

**Database Backups:**
- Automated daily backups
- Point-in-time recovery enabled
- Backup retention: 30 days
- Regular backup restoration tests

**Disaster Recovery:**
- Multi-region deployment (optional)
- Database replication
- Automated failover
- Recovery Time Objective (RTO): < 1 hour
- Recovery Point Objective (RPO): < 15 minutes

### 7.5 CI/CD Pipeline

**Continuous Integration:**
1. Code push to Git repository
2. Automated tests run (unit, integration)
3. Code quality checks (ESLint, Prettier)
4. Security vulnerability scanning
5. Build Docker image
6. Push to container registry

**Continuous Deployment:**
1. Pull latest image from registry
2. Run database migrations
3. Deploy to staging environment
4. Run smoke tests
5. Deploy to production (blue-green deployment)
6. Health check verification
7. Rollback on failure


---

## 8. Entity Relationship Summary

### 8.1 Relationship Matrix

| Entity | Relates To | Relationship Type | Description |
|--------|-----------|-------------------|-------------|
| **category** | category (self) | One-to-Many | Parent-child hierarchy |
| **category** | menu_entity | One-to-Many | One category has many menus |
| **menu_entity** | category | Many-to-One | Each menu belongs to one category |
| **menu_entity** | add_on_entity | Many-to-Many | Menu can have multiple add-ons |
| **menu_entity** | menu_rating_entity | One-to-Many | Menu can have multiple ratings |
| **add_on_entity** | menu_entity | Many-to-Many | Add-on can be used in multiple menus |
| **cart_entity** | cart_item_entity | One-to-Many | Cart has multiple items |
| **cart_item_entity** | cart_entity | Many-to-One | Item belongs to one cart |
| **cart_item_entity** | menu_entity | Many-to-One | Item references one menu |
| **cart_item_entity** | cart_item_add_ons_entity | One-to-Many | Item can have multiple add-ons |
| **cart_item_add_ons_entity** | cart_item_entity | Many-to-One | Add-on belongs to one cart item |
| **cart_item_add_ons_entity** | add_on_entity | Many-to-One | References one add-on |
| **order_entity** | order_item_entity | One-to-Many | Order has multiple items |
| **order_entity** | order_status_entity | One-to-Many | Order has status history |
| **order_item_entity** | order_entity | Many-to-One | Item belongs to one order |
| **order_item_entity** | menu_entity | Many-to-One | Item references one menu |
| **order_item_entity** | order_item_addon_entity | One-to-Many | Item can have multiple add-ons |
| **order_item_addon_entity** | order_item_entity | Many-to-One | Add-on belongs to one order item |
| **order_item_addon_entity** | add_on_entity | Many-to-One | References one add-on |
| **order_status_entity** | order_entity | Many-to-One | Status belongs to one order |
| **menu_rating_entity** | menu_entity | Many-to-One | Rating belongs to one menu |

### 8.2 Cascade Behaviors

| Parent Entity | Child Entity | Delete Behavior |
|---------------|--------------|-----------------|
| cart_entity | cart_item_entity | CASCADE DELETE |
| cart_item_entity | cart_item_add_ons_entity | CASCADE DELETE |
| order_entity | order_item_entity | RESTRICT (soft delete) |
| order_item_entity | order_item_addon_entity | RESTRICT (soft delete) |
| category | menu_entity | RESTRICT (prevent if menus exist) |
| menu_entity | cart_item_entity | RESTRICT (prevent if in carts) |
| menu_entity | order_item_entity | RESTRICT (preserve for history) |

### 8.3 Data Flow Diagrams

**Customer Order Flow:**
```
1. Browse Menu
   ↓
2. Add to Cart (cart_item_entity + cart_item_add_ons_entity)
   ↓
3. Review Cart
   ↓
4. Place Order (order_entity created)
   ↓
5. Snapshot Prices (order_item_entity + order_item_addon_entity)
   ↓
6. Clear Cart
   ↓
7. Track Status (order_status_entity updates)
   ↓
8. Rate Menu (menu_rating_entity created)
```

**Business Menu Management Flow:**
```
1. Create Category (category)
   ↓
2. Create Add-ons (add_on_entity)
   ↓
3. Create Menu Item (menu_entity)
   ↓
4. Assign Category (menu_entity.categoryId)
   ↓
5. Assign Add-ons (menu_add_on_entity junction)
   ↓
6. Set Pricing & Availability
   ↓
7. Mark as Signature (optional, max 3)
```


---

## 9. Recommended Technology Stack

| Component | Technology | Reason |
|-----------|-----------|--------|
| **Backend Framework** | NestJS (TypeScript) | Modular architecture, built-in DI, decorators, scalable |
| **Runtime** | Node.js 18+ LTS | Async I/O, large ecosystem, performance |
| **ORM** | TypeORM | Type-safe queries, migrations, decorators, PostgreSQL support |
| **Database** | PostgreSQL 15+ | ACID compliance, JSONB support, robust, scalable |
| **Authentication** | Passport.js + JWT | Proven auth middleware, flexible strategies |
| **Validation** | class-validator + class-transformer | Decorator-based validation, type safety |
| **API Documentation** | Swagger (@nestjs/swagger) | Auto-generated docs, interactive testing |
| **HTTP Client** | Axios (@nestjs/axios) | Promise-based, interceptors, error handling |
| **Cache** | Redis 7+ | In-memory speed, pub/sub, session storage |
| **File Storage** | AWS S3 / MinIO | Scalable object storage, CDN integration |
| **Containerization** | Docker + Docker Compose | Consistent environments, easy deployment |
| **Orchestration** | Kubernetes (EKS/GKE) | Auto-scaling, self-healing, load balancing |
| **CI/CD** | GitHub Actions / GitLab CI | Automated testing, deployment pipelines |
| **Monitoring** | Prometheus + Grafana | Metrics collection, visualization, alerting |
| **Error Tracking** | Sentry | Real-time error tracking, stack traces |
| **Logging** | Winston / Pino | Structured logging, multiple transports |
| **Testing** | Jest | Unit tests, integration tests, mocking |
| **Code Quality** | ESLint + Prettier | Code consistency, style enforcement |
| **Load Balancer** | Nginx / AWS ALB | Traffic distribution, SSL termination |
| **CDN** | CloudFront / Cloudflare | Static asset delivery, caching |

### 9.1 Development Tools

| Tool | Purpose |
|------|---------|
| **VS Code** | IDE with TypeScript support |
| **Postman** | API testing and documentation |
| **DBeaver / pgAdmin** | Database management |
| **Redis Commander** | Redis data visualization |
| **Docker Desktop** | Local container management |
| **Git** | Version control |
| **npm / yarn** | Package management |

### 9.2 NPM Dependencies

**Core Dependencies:**
```json
{
  "@nestjs/common": "^10.0.0",
  "@nestjs/core": "^10.0.0",
  "@nestjs/platform-express": "^10.0.0",
  "@nestjs/typeorm": "^10.0.2",
  "@nestjs/config": "^3.2.0",
  "@nestjs/jwt": "^10.2.0",
  "@nestjs/passport": "^10.0.3",
  "@nestjs/swagger": "^7.3.0",
  "@nestjs/axios": "^3.0.2",
  "typeorm": "^0.3.20",
  "pg": "^8.11.3",
  "passport": "^0.7.0",
  "passport-jwt": "^4.0.1",
  "class-validator": "^0.14.1",
  "class-transformer": "^0.5.1",
  "axios": "^1.6.7",
  "bcrypt": "^5.1.1",
  "date-fns": "^3.6.0"
}
```

**Dev Dependencies:**
```json
{
  "@nestjs/cli": "^10.0.0",
  "@nestjs/testing": "^10.0.0",
  "@types/node": "^20.3.1",
  "@types/passport-jwt": "^4.0.1",
  "@typescript-eslint/eslint-plugin": "^6.0.0",
  "@typescript-eslint/parser": "^6.0.0",
  "eslint": "^8.42.0",
  "prettier": "^3.0.0",
  "jest": "^29.5.0",
  "ts-jest": "^29.1.0",
  "typescript": "^5.1.3"
}
```


---

## 10. Appendix

### 10.1 Service Type Enum

```typescript
export enum MenuServiceEnum {
  DINE_IN = 'DINE_IN',
  TAKEAWAY = 'TAKEAWAY',
  DELIVERY = 'DELIVERY',
}
```

### 10.2 Order Status Enum

```typescript
export enum OrderStatusEnum {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  PREPARING = 'PREPARING',
  READY = 'READY',
  DELIVERED = 'DELIVERED',
  CANCELLED = 'CANCELLED',
}
```

### 10.3 User Role Enum

```typescript
export enum UserRoleEnum {
  SUPER_ADMIN = 'SUPER_ADMIN',
  BUSINESS_SUPER_ADMIN = 'BUSINESS_SUPER_ADMIN',
  ADMIN = 'ADMIN',
  USER = 'USER',
}
```

### 10.4 Sample API Responses

**Success Response Format:**
```json
{
  "statusCode": 200,
  "message": "Operation successful",
  "data": {
    // Response data here
  }
}
```

**Paginated Response Format:**
```json
{
  "statusCode": 200,
  "message": "Data retrieved successfully",
  "metaData": {
    "currentPage": 1,
    "totalPages": 10,
    "totalCount": 95,
    "perPage": 10
  },
  "data": [
    // Array of items
  ]
}
```

**Error Response Format:**
```json
{
  "statusCode": 400,
  "message": "Validation failed",
  "error": "Bad Request",
  "details": [
    {
      "field": "email",
      "message": "Email must be a valid email address"
    }
  ]
}
```

### 10.5 Environment Variables Reference

| Variable | Type | Description | Example |
|----------|------|-------------|---------|
| APP_PORT | number | Application port | 3005 |
| DB_HOST | string | Database host | localhost |
| DB_PORT | number | Database port | 5432 |
| DB_NAME | string | Database name | kaha_restaurant |
| DB_USER_NAME | string | Database username | postgres |
| DB_PASSWORD | string | Database password | password123 |
| JWT_SECRET_TOKEN | string | JWT signing secret | your_secret_key |
| KAHA_API_LINK | string | External API URL | https://api.kaha-main-v3.com |

### 10.6 Database Indexes Summary

**Critical Indexes for Performance:**

```sql
-- Category indexes
CREATE INDEX idx_category_business ON category(businessId) WHERE deletedAt IS NULL;
CREATE INDEX idx_category_parent ON category(parentId) WHERE deletedAt IS NULL;
CREATE UNIQUE INDEX unique_category_name_business ON category(name, businessId) WHERE deletedAt IS NULL;

-- Menu indexes
CREATE INDEX idx_menu_business ON menu_entity(businessId) WHERE deletedAt IS NULL;
CREATE INDEX idx_menu_category ON menu_entity(categoryId) WHERE deletedAt IS NULL;
CREATE INDEX idx_menu_signature ON menu_entity(businessId, isSignature) WHERE isSignature = true AND deletedAt IS NULL;
CREATE UNIQUE INDEX unique_menu_name_business ON menu_entity(name, businessId) WHERE deletedAt IS NULL;

-- Cart indexes
CREATE UNIQUE INDEX unique_cart_user ON cart_entity(userId) WHERE deletedAt IS NULL;
CREATE INDEX idx_cartitem_cart ON cart_item_entity(cartId) WHERE deletedAt IS NULL;
CREATE INDEX idx_cartitem_menu ON cart_item_entity(menuId) WHERE deletedAt IS NULL;

-- Order indexes
CREATE INDEX idx_order_user ON order_entity(userId) WHERE deletedAt IS NULL;
CREATE INDEX idx_order_business ON order_entity(businessId) WHERE deletedAt IS NULL;
CREATE INDEX idx_order_created ON order_entity(createdAt DESC) WHERE deletedAt IS NULL;
CREATE INDEX idx_orderitem_order ON order_item_entity(orderId) WHERE deletedAt IS NULL;
CREATE INDEX idx_orderstatus_order ON order_status_entity(orderId) WHERE deletedAt IS NULL;

-- Rating indexes
CREATE INDEX idx_rating_menu ON menu_rating_entity(menuId) WHERE deletedAt IS NULL;
CREATE INDEX idx_rating_business ON menu_rating_entity(businessId) WHERE deletedAt IS NULL;
```


### 10.7 Common Query Patterns

**Find Menu Items by Business with Filters:**
```typescript
const menus = await menuRepository.find({
  where: {
    businessId,
    isAvailable: true,
    category: { id: categoryId },
    price: Between(minPrice, maxPrice),
  },
  relations: {
    category: true,
    addOns: true,
  },
  skip: (page - 1) * limit,
  take: limit,
  order: { createdAt: 'DESC' },
});
```

**Get User Cart with All Relations:**
```typescript
const cart = await cartRepository.findOne({
  where: { userId },
  relations: {
    cartItems: {
      menu: true,
      addOns: {
        menuAddOn: true,
      },
    },
  },
});
```

**Create Order with Items and Add-ons:**
```typescript
const order = await orderRepository.save({
  userId,
  businessId,
  totalAmount,
  remarks,
  orderItems: items.map(item => ({
    menuId: item.menuId,
    quantity: item.quantity,
    price: item.menu.price, // Snapshot
    addons: item.addons.map(addon => ({
      addonId: addon.addonId,
      quantity: addon.quantity,
      price: addon.addon.price, // Snapshot
    })),
  })),
  orderStatus: [{
    status: OrderStatusEnum.PENDING,
    updatedBy: userId,
  }],
});
```

**Get Order Status History:**
```typescript
const statusHistory = await orderStatusRepository.find({
  where: { orderId },
  order: { createdAt: 'ASC' },
});
```

### 10.8 Business Rules Summary

1. **Menu Management:**
   - Maximum 3 signature dishes per business
   - Menu names must be unique within a business
   - Discounted price must be less than regular price
   - Soft delete preserves historical data

2. **Cart Management:**
   - One cart per user
   - Cart items reference live menu prices
   - Deleting cart cascades to all items and add-ons
   - Cart can be grouped by businessId

3. **Order Management:**
   - Prices are snapshot at order time
   - Order status changes are append-only
   - Orders cannot be physically deleted
   - Status history maintains complete audit trail

4. **Category Management:**
   - Categories support unlimited nesting
   - Cannot delete category with active menus
   - Category names unique per business
   - Position field controls display order

5. **Rating System:**
   - Rating range: 1.0 to 5.0
   - Users can rate each menu item once
   - Ratings are business-scoped
   - Average rating calculated from all ratings

### 10.9 Migration Strategy

**Initial Setup:**
1. Create database and user
2. Run TypeORM migrations
3. Seed default data (roles, permissions)
4. Create initial business accounts

**Schema Updates:**
1. Create migration file: `npm run migration:create`
2. Write up/down migration logic
3. Test migration on staging
4. Run migration on production
5. Verify data integrity

**Data Migration:**
1. Export data from old system
2. Transform to new schema format
3. Validate data integrity
4. Import in batches
5. Verify relationships
6. Run data quality checks

### 10.10 Testing Strategy

**Unit Tests:**
- Service layer business logic
- Repository layer queries
- Utility functions
- Validators and transformers

**Integration Tests:**
- API endpoint testing
- Database operations
- Authentication flow
- Authorization checks

**E2E Tests:**
- Complete user journeys
- Order placement flow
- Menu management flow
- Cart operations

**Performance Tests:**
- Load testing with Artillery/k6
- Database query performance
- API response times
- Concurrent user handling

---

## Document Revision History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | May 13, 2026 | System Architect | Initial document creation |

---

**End of Document**

