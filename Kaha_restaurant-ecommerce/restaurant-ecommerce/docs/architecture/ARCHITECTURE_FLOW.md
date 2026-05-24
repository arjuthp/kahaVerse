# 🏗️ Restaurant E-Commerce Platform - Architecture Flow Documentation

## 📋 Table of Contents
1. [System Overview](#system-overview)
2. [User Roles & Permissions](#user-roles--permissions)
3. [Customer Journey Flow](#customer-journey-flow)
4. [Business Admin Flow](#business-admin-flow)
5. [Order Processing Flow](#order-processing-flow)
6. [Database Architecture](#database-architecture)
7. [Authentication & Authorization](#authentication--authorization)
8. [Multi-Tenancy Architecture](#multi-tenancy-architecture)

---

## 🎯 System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│           RESTAURANT E-COMMERCE PLATFORM                        │
│                  (Multi-Tenant SaaS)                            │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │
        ┌─────────────────────┼─────────────────────┐
        │                     │                     │
        ▼                     ▼                     ▼
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│   Customer   │    │   Business   │    │    Super     │
│    Portal    │    │    Admin     │    │    Admin     │
└──────────────┘    └──────────────┘    └──────────────┘
```


---

## 👥 User Roles & Permissions

```
┌─────────────────────────────────────────────────────────────────┐
│                        USER HIERARCHY                           │
└─────────────────────────────────────────────────────────────────┘

                    ┌──────────────────┐
                    │  SUPER_ADMIN     │
                    │  (Platform)      │
                    └────────┬─────────┘
                             │
                    ┌────────▼─────────┐
                    │ BUSINESS_SUPER   │
                    │     ADMIN        │
                    │ (Restaurant)     │
                    └────────┬─────────┘
                             │
                    ┌────────▼─────────┐
                    │      ADMIN       │
                    │   (Staff)        │
                    └────────┬─────────┘
                             │
                    ┌────────▼─────────┐
                    │      USER        │
                    │   (Customer)     │
                    └──────────────────┘
```

### Permission Matrix

| Feature                  | USER | ADMIN | BUSINESS_SUPER_ADMIN | SUPER_ADMIN |
|-------------------------|------|-------|---------------------|-------------|
| Browse Menu             | ✅   | ✅    | ✅                  | ✅          |
| Add to Cart             | ✅   | ✅    | ✅                  | ✅          |
| Place Order             | ✅   | ✅    | ✅                  | ✅          |
| View Own Orders         | ✅   | ✅    | ✅                  | ✅          |
| Rate Menu Items         | ✅   | ✅    | ✅                  | ✅          |
| Manage Menu             | ❌   | ❌    | ✅                  | ✅          |
| Manage Categories       | ❌   | ❌    | ✅                  | ✅          |
| Manage Add-ons          | ❌   | ❌    | ✅                  | ✅          |
| View Business Orders    | ❌   | ❌    | ✅                  | ✅          |
| Platform Management     | ❌   | ❌    | ❌                  | ✅          |



---

## 🛒 Customer Journey Flow

### 1. Discovery & Browsing Phase

```
┌─────────────┐
│  Customer   │
│   Visits    │
└──────┬──────┘
       │
       ▼
┌─────────────────────────────────────────┐
│  GET /categories/:businessId            │
│  (Public - No Auth Required)            │
└──────┬──────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────┐
│  Browse Categories                      │
│  - View category hierarchy              │
│  - See category icons & descriptions    │
└──────┬──────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────┐
│  GET /menu/:businessId                  │
│  (Public - No Auth Required)            │
│  Query Params:                          │
│  - categoryId (filter by category)      │
│  - isSignature (signature dishes)       │
│  - isAvailable (available items)        │
│  - services (DINE_IN/TAKEAWAY/DELIVERY) │
└──────┬──────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────┐
│  View Menu Items                        │
│  - Name, description, images            │
│  - Price & discounted price             │
│  - Available add-ons                    │
│  - Ratings & reviews                    │
│  - Service types                        │
└──────┬──────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────┐
│  GET /menu/:id                          │
│  (View detailed menu item)              │
└─────────────────────────────────────────┘
```



### 2. Shopping Cart Phase

```
┌─────────────┐
│  Customer   │
│   Selects   │
│    Item     │
└──────┬──────┘
       │
       ▼
┌─────────────────────────────────────────┐
│  Authentication Required                │
│  JWT Token Validation                   │
└──────┬──────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────┐
│  POST /cart                             │
│  Create cart for user (if not exists)   │
│  Input: userId (from JWT)               │
└──────┬──────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────┐
│  POST /cart/item                        │
│  Add item to cart                       │
│  Input:                                 │
│  - menuId                               │
│  - quantity                             │
│  - addOns[] (optional)                  │
│    - addonId                            │
│    - quantity                           │
└──────┬──────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────┐
│  Database Operations:                   │
│  1. Find/Create Cart for user           │
│  2. Create CartItem                     │
│  3. Create CartItemAddOns (if any)      │
└──────┬──────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────┐
│  GET /cart                              │
│  View cart with all items               │
│  Response includes:                     │
│  - Cart items with quantities           │
│  - Menu details for each item           │
│  - Selected add-ons                     │
│  - Total price calculation              │
└──────┬──────────────────────────────────┘
       │
       ├──────────────────┐
       │                  │
       ▼                  ▼
┌──────────────┐   ┌──────────────┐
│ PATCH /cart/ │   │ DELETE /cart/│
│   :itemId    │   │    :id       │
│ Update qty   │   │ Remove item  │
└──────────────┘   └──────────────┘
```



### 3. Checkout & Order Placement

```
┌─────────────┐
│  Customer   │
│  Proceeds   │
│ to Checkout │
└──────┬──────┘
       │
       ▼
┌─────────────────────────────────────────┐
│  POST /order                            │
│  Create order from cart                 │
│  Input:                                 │
│  - businessId                           │
│  - remarks (optional)                   │
│  - items[]                              │
│    - menuId                             │
│    - quantity                           │
│    - addons[]                           │
│      - addonId                          │
│      - quantity                         │
└──────┬──────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────┐
│  Order Processing Logic:                │
│                                         │
│  1. Validate menu items availability    │
│  2. Calculate prices (snapshot)         │
│     - Menu item prices                  │
│     - Add-on prices                     │
│     - Total amount                      │
│  3. Create Order entity                 │
│  4. Create OrderItem entities           │
│  5. Create OrderItemAddon entities      │
│  6. Create initial OrderStatus          │
│     (status: PENDING)                   │
│  7. Clear user's cart                   │
└──────┬──────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────┐
│  Order Created Successfully             │
│  Response:                              │
│  - orderId                              │
│  - orderNumber                          │
│  - totalAmount                          │
│  - status: PENDING                      │
│  - orderItems with details              │
└─────────────────────────────────────────┘
```



### 4. Order Tracking

```
┌─────────────┐
│  Customer   │
│   Tracks    │
│    Order    │
└──────┬──────┘
       │
       ├────────────────────────────────┐
       │                                │
       ▼                                ▼
┌──────────────────┐         ┌──────────────────┐
│ GET /order/user  │         │ GET /order/:id   │
│                  │         │                  │
│ List all orders  │         │ Single order     │
│ with filters:    │         │ details          │
│ - status         │         │                  │
│ - dateRange      │         │ Includes:        │
│ - pagination     │         │ - Order info     │
│                  │         │ - Items          │
│ Response:        │         │ - Add-ons        │
│ - Orders[]       │         │ - Status history │
│ - Pagination     │         │ - Timestamps     │
└──────────────────┘         └──────────────────┘
       │
       │
       ▼
┌─────────────────────────────────────────┐
│  POST /order/:orderId/change-status     │
│  (Customer can update status)           │
│  Input:                                 │
│  - status (enum)                        │
│  - remarks (optional)                   │
└─────────────────────────────────────────┘
```

### 5. Rating & Review

```
┌─────────────┐
│  Customer   │
│   Rates     │
│  Menu Item  │
└──────┬──────┘
       │
       ▼
┌─────────────────────────────────────────┐
│  POST /menu-rating                      │
│  Create rating for menu item            │
│  Input:                                 │
│  - menuId                               │
│  - rating (1-5)                         │
│  - comments                             │
│  - businessId                           │
└──────┬──────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────┐
│  Database Operations:                   │
│  1. Create MenuRating entity            │
│  2. Link to Menu & User                 │
│  3. Update menu average rating          │
└──────┬──────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────┐
│  GET /menu-rating                       │
│  View ratings for menu items            │
└─────────────────────────────────────────┘
```



---

## 🏢 Business Admin Flow

### 1. Menu Management

```
┌─────────────────┐
│ Business Admin  │
│  (Authenticated)│
└────────┬────────┘
         │
         ▼
┌─────────────────────────────────────────┐
│  Authentication & Authorization         │
│  - JWT Token validation                 │
│  - Role check: BUSINESS_SUPER_ADMIN     │
│  - Extract businessId from token        │
└────────┬────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────┐
│         MENU OPERATIONS                 │
└─────────────────────────────────────────┘
         │
         ├──────────────────┬──────────────────┬──────────────────┐
         │                  │                  │                  │
         ▼                  ▼                  ▼                  ▼
┌──────────────┐   ┌──────────────┐   ┌──────────────┐   ┌──────────────┐
│ POST /menu   │   │ PATCH /menu  │   │ DELETE /menu │   │ PATCH /menu/ │
│              │   │    /:id      │   │    /:id      │   │toggle-       │
│ Create Menu  │   │              │   │              │   │signature/:id │
│              │   │ Update Menu  │   │ Soft Delete  │   │              │
│ Input:       │   │              │   │              │   │ Mark as      │
│ - name       │   │ Input:       │   │ Validates:   │   │ signature    │
│ - desc       │   │ - name       │   │ - ownership  │   │ dish         │
│ - images[]   │   │ - price      │   │ - businessId │   │              │
│ - price      │   │ - discount   │   │              │   │ Input:       │
│ - discount   │   │ - available  │   │ Sets:        │   │ - isSignature│
│ - categoryId │   │ - services[] │   │ - deletedAt  │   │   (boolean)  │
│ - services[] │   │              │   │              │   │              │
│ - isBarItem  │   │ Validates:   │   │              │   │ Validates:   │
│ - allowAddOns│   │ - ownership  │   │              │   │ - ownership  │
│              │   │ - businessId │   │              │   │ - businessId │
└──────────────┘   └──────────────┘   └──────────────┘   └──────────────┘
         │
         ▼
┌─────────────────────────────────────────┐
│  PATCH /menu/update-addons/:id          │
│  Manage add-ons for menu item           │
│                                         │
│  Input:                                 │
│  - addOnIds[] (array of addon IDs)      │
│                                         │
│  Process:                               │
│  1. Validate menu ownership             │
│  2. Validate all add-ons exist          │
│  3. Update many-to-many relationship    │
│  4. Return updated menu with add-ons    │
└─────────────────────────────────────────┘
```



### 2. Category Management

```
┌─────────────────┐
│ Business Admin  │
└────────┬────────┘
         │
         ▼
┌─────────────────────────────────────────┐
│      CATEGORY OPERATIONS                │
└─────────────────────────────────────────┘
         │
         ├──────────────────┬──────────────────┬──────────────────┐
         │                  │                  │                  │
         ▼                  ▼                  ▼                  ▼
┌──────────────┐   ┌──────────────┐   ┌──────────────┐   ┌──────────────┐
│ POST         │   │ PATCH        │   │ DELETE       │   │ GET          │
│ /categories  │   │ /categories  │   │ /categories  │   │ /categories  │
│              │   │    /:id      │   │    /:id      │   │  :businessId │
│ Create       │   │              │   │              │   │              │
│ Category     │   │ Update       │   │ Soft Delete  │   │ List all     │
│              │   │ Category     │   │              │   │ categories   │
│ Input:       │   │              │   │ Validates:   │   │              │
│ - name       │   │ Input:       │   │ - ownership  │   │ Response:    │
│ - desc       │   │ - name       │   │ - businessId │   │ - Categories │
│ - icon       │   │ - desc       │   │              │   │   with       │
│ - isActive   │   │ - icon       │   │ Checks:      │   │   hierarchy  │
│ - position   │   │ - isActive   │   │ - No menus   │   │ - Parent-    │
│ - parentId   │   │ - position   │   │   attached   │   │   child      │
│ - businessId │   │              │   │              │   │   relations  │
│              │   │ Validates:   │   │              │   │              │
│ Supports:    │   │ - ownership  │   │              │   │              │
│ - Hierarchy  │   │ - businessId │   │              │   │              │
│ - Nesting    │   │              │   │              │   │              │
└──────────────┘   └──────────────┘   └──────────────┘   └──────────────┘
```

### 3. Add-ons Management

```
┌─────────────────┐
│ Business Admin  │
└────────┬────────┘
         │
         ▼
┌─────────────────────────────────────────┐
│       ADD-ONS OPERATIONS                │
└─────────────────────────────────────────┘
         │
         ├──────────────────┬──────────────────┬──────────────────┐
         │                  │                  │                  │
         ▼                  ▼                  ▼                  ▼
┌──────────────┐   ┌──────────────┐   ┌──────────────┐   ┌──────────────┐
│ POST /addons │   │ PATCH /addons│   │ DELETE       │   │ GET /addons  │
│              │   │    /:id      │   │ /addons/:id  │   │              │
│ Create       │   │              │   │              │   │ List all     │
│ Add-on       │   │ Update       │   │ Soft Delete  │   │ add-ons      │
│              │   │ Add-on       │   │              │   │              │
│ Input:       │   │              │   │              │   │ Response:    │
│ - name       │   │ Input:       │   │              │   │ - All add-ons│
│ - price      │   │ - name       │   │              │   │ - Available  │
│ - desc       │   │ - price      │   │              │   │   for        │
│ - coverImg   │   │ - desc       │   │              │   │   assignment │
│              │   │ - coverImg   │   │              │   │              │
└──────────────┘   └──────────────┘   └──────────────┘   └──────────────┘
```



### 4. Order Management (Business View)

```
┌─────────────────┐
│ Business Admin  │
└────────┬────────┘
         │
         ▼
┌─────────────────────────────────────────┐
│  GET /order/business-man-vs/:businessId │
│  View all orders for the business       │
│                                         │
│  Query Parameters:                      │
│  - status (filter by order status)      │
│  - dateFrom                             │
│  - dateTo                               │
│  - page                                 │
│  - limit                                │
└────────┬────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────┐
│  Response:                              │
│  - Orders[] with:                       │
│    - Order details                      │
│    - Customer info (userId)             │
│    - Order items                        │
│    - Add-ons                            │
│    - Status history                     │
│    - Total amount                       │
│    - Timestamps                         │
│  - Pagination metadata                  │
└────────┬────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────┐
│  POST /order/:orderId/change-status     │
│  Update order status                    │
│                                         │
│  Input:                                 │
│  - status (PENDING/CONFIRMED/           │
│            PREPARING/READY/             │
│            DELIVERED/CANCELLED)         │
│  - remarks (optional)                   │
│                                         │
│  Process:                               │
│  1. Validate order exists               │
│  2. Create new OrderStatus entry        │
│  3. Record updatedBy (admin userId)     │
│  4. Add timestamp                       │
│  5. Maintain status history             │
└─────────────────────────────────────────┘
```



---

## 📦 Order Processing Flow (Complete Lifecycle)

```
┌─────────────────────────────────────────────────────────────────┐
│                   ORDER LIFECYCLE                               │
└─────────────────────────────────────────────────────────────────┘

    Customer                    System                    Business
       │                          │                          │
       │  1. POST /order          │                          │
       ├─────────────────────────►│                          │
       │                          │                          │
       │                          │  Create Order            │
       │                          │  - Validate items        │
       │                          │  - Calculate total       │
       │                          │  - Snapshot prices       │
       │                          │  - Create entities       │
       │                          │  - Set status: PENDING   │
       │                          │                          │
       │  Order Created           │                          │
       │◄─────────────────────────┤                          │
       │  (orderId, status)       │                          │
       │                          │                          │
       │                          │  Notify Business         │
       │                          ├─────────────────────────►│
       │                          │                          │
       │                          │                          │  2. View Order
       │                          │                          │  GET /order/
       │                          │                          │  business-man-vs
       │                          │                          │
       │                          │  Order Details           │
       │                          │◄─────────────────────────┤
       │                          │                          │
       │                          │                          │  3. Confirm
       │                          │  POST /order/:id/        │
       │                          │  change-status           │
       │                          │◄─────────────────────────┤
       │                          │  status: CONFIRMED       │
       │                          │                          │
       │  Status Update           │                          │
       │◄─────────────────────────┤                          │
       │  (CONFIRMED)             │                          │
       │                          │                          │
       │                          │                          │  4. Preparing
       │                          │  POST /order/:id/        │
       │                          │  change-status           │
       │                          │◄─────────────────────────┤
       │                          │  status: PREPARING       │
       │                          │                          │
       │  Status Update           │                          │
       │◄─────────────────────────┤                          │
       │  (PREPARING)             │                          │
       │                          │                          │
       │                          │                          │  5. Ready
       │                          │  POST /order/:id/        │
       │                          │  change-status           │
       │                          │◄─────────────────────────┤
       │                          │  status: READY           │
       │                          │                          │
       │  Status Update           │                          │
       │◄─────────────────────────┤                          │
       │  (READY)                 │                          │
       │                          │                          │
       │  6. Pickup/Delivery      │                          │
       │                          │                          │
       │                          │  POST /order/:id/        │
       │                          │  change-status           │
       │                          │◄─────────────────────────┤
       │                          │  status: DELIVERED       │
       │                          │                          │
       │  Status Update           │                          │
       │◄─────────────────────────┤                          │
       │  (DELIVERED)             │                          │
       │                          │                          │
       │  7. Rate Menu Items      │                          │
       │  POST /menu-rating       │                          │
       ├─────────────────────────►│                          │
       │                          │                          │
       │  Rating Saved            │                          │
       │◄─────────────────────────┤                          │
       │                          │                          │

Alternative Flow: Cancellation
       │                          │                          │
       │  POST /order/:id/        │                          │
       │  change-status           │                          │
       ├─────────────────────────►│                          │
       │  status: CANCELLED       │                          │
       │                          │                          │
       │  Order Cancelled         │  Notify Business         │
       │◄─────────────────────────┼─────────────────────────►│
       │                          │                          │
```



---

## 🗄️ Database Architecture

### Entity Relationship Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                    DATABASE SCHEMA                              │
└─────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────┐
│                     MENU CATALOG                                 │
└──────────────────────────────────────────────────────────────────┘

    ┌─────────────┐
    │  Category   │
    │─────────────│
    │ id          │◄──────┐
    │ name        │       │
    │ description │       │ parent_id
    │ icon        │       │ (self-reference)
    │ isActive    │       │
    │ position    │       │
    │ businessId  │       │
    │ parentId    ├───────┘
    │ createdAt   │
    │ updatedAt   │
    │ deletedAt   │
    └──────┬──────┘
           │
           │ 1:N
           │
           ▼
    ┌─────────────┐         N:M         ┌─────────────┐
    │    Menu     │◄───────────────────►│   AddOn     │
    │─────────────│                     │─────────────│
    │ id          │                     │ id          │
    │ name        │                     │ name        │
    │ description │                     │ price       │
    │ images[]    │                     │ description │
    │ price       │                     │ coverImg    │
    │ discountPrice│                    │ createdAt   │
    │ isAvailable │                     │ updatedAt   │
    │ isBarItem   │                     │ deletedAt   │
    │ isSignature │                     └─────────────┘
    │ allowAddOns │
    │ services[]  │
    │ businessId  │
    │ categoryId  │
    │ createdAt   │
    │ updatedAt   │
    │ deletedAt   │
    └──────┬──────┘
           │
           │ 1:N
           │
           ▼
    ┌─────────────┐
    │ MenuRating  │
    │─────────────│
    │ id          │
    │ rating      │
    │ comments    │
    │ ratedBy     │
    │ businessId  │
    │ menuId      │
    │ createdAt   │
    │ updatedAt   │
    │ deletedAt   │
    └─────────────┘

┌──────────────────────────────────────────────────────────────────┐
│                     SHOPPING CART                                │
└──────────────────────────────────────────────────────────────────┘

    ┌─────────────┐
    │    Cart     │
    │─────────────│
    │ id          │
    │ userId      │
    │ createdAt   │
    │ updatedAt   │
    │ deletedAt   │
    └──────┬──────┘
           │
           │ 1:N
           │
           ▼
    ┌─────────────┐         N:1         ┌─────────────┐
    │  CartItem   │────────────────────►│    Menu     │
    │─────────────│                     └─────────────┘
    │ id          │
    │ quantity    │
    │ cartId      │
    │ menuId      │
    │ createdAt   │
    │ updatedAt   │
    │ deletedAt   │
    └──────┬──────┘
           │
           │ 1:N
           │
           ▼
    ┌──────────────────┐    N:1    ┌─────────────┐
    │ CartItemAddOns   │───────────►│   AddOn     │
    │──────────────────│            └─────────────┘
    │ id               │
    │ quantity         │
    │ cartItemId       │
    │ menuAddOnId      │
    │ createdAt        │
    │ updatedAt        │
    │ deletedAt        │
    └──────────────────┘

┌──────────────────────────────────────────────────────────────────┐
│                     ORDER MANAGEMENT                             │
└──────────────────────────────────────────────────────────────────┘

    ┌─────────────┐
    │    Order    │
    │─────────────│
    │ id          │
    │ userId      │
    │ businessId  │
    │ totalAmount │
    │ remarks     │
    │ createdAt   │
    │ updatedAt   │
    │ deletedAt   │
    └──────┬──────┘
           │
           ├──────────────────┐
           │                  │
           │ 1:N              │ 1:N
           │                  │
           ▼                  ▼
    ┌─────────────┐    ┌──────────────┐
    │ OrderItem   │    │ OrderStatus  │
    │─────────────│    │──────────────│
    │ id          │    │ id           │
    │ quantity    │    │ status       │
    │ price       │    │ updatedBy    │
    │ orderId     │    │ remarks      │
    │ menuId      │    │ orderId      │
    │ createdAt   │    │ createdAt    │
    │ updatedAt   │    │ updatedAt    │
    │ deletedAt   │    │ deletedAt    │
    └──────┬──────┘    └──────────────┘
           │
           │ 1:N
           │
           ▼
    ┌──────────────────┐    N:1    ┌─────────────┐
    │ OrderItemAddon   │───────────►│   AddOn     │
    │──────────────────│            └─────────────┘
    │ id               │
    │ quantity         │
    │ price            │
    │ orderItemId      │
    │ addonId          │
    │ createdAt        │
    │ updatedAt        │
    │ deletedAt        │
    └──────────────────┘
```



### Key Database Design Patterns

#### 1. Soft Delete Pattern
```
All entities inherit from BaseEntity:
- id (UUID)
- createdAt (timestamp)
- updatedAt (timestamp)
- deletedAt (timestamp) ← Soft delete marker

Benefits:
✓ Data recovery possible
✓ Audit trail maintained
✓ Historical data preserved
✓ Referential integrity maintained
```

#### 2. Price Snapshot Pattern
```
Cart Phase:
- CartItem → references Menu (live price)
- CartItemAddOns → references AddOn (live price)

Order Phase:
- OrderItem → stores price (snapshot)
- OrderItemAddon → stores price (snapshot)

Why?
✓ Historical accuracy
✓ Price changes don't affect past orders
✓ Financial audit compliance
✓ Customer trust
```

#### 3. Status History Pattern
```
OrderStatus is a separate entity (not just a field):
- Multiple status records per order
- Tracks who changed status (updatedBy)
- Tracks when status changed (createdAt)
- Allows remarks per status change

Benefits:
✓ Complete audit trail
✓ Status change history
✓ Accountability
✓ Dispute resolution
```

#### 4. Multi-Tenancy Pattern
```
businessId field in:
- Menu
- Category
- Order
- MenuRating

Ensures:
✓ Data isolation between restaurants
✓ Scalable SaaS architecture
✓ Single database, multiple tenants
✓ Row-level security
```



---

## 🔐 Authentication & Authorization Flow

```
┌─────────────────────────────────────────────────────────────────┐
│              AUTHENTICATION FLOW                                │
└─────────────────────────────────────────────────────────────────┘

    User/Admin                  Auth Service              Database
       │                             │                        │
       │  1. Login Request           │                        │
       │  POST /auth/login           │                        │
       ├────────────────────────────►│                        │
       │  { email, password }        │                        │
       │                             │                        │
       │                             │  2. Validate User      │
       │                             ├───────────────────────►│
       │                             │                        │
       │                             │  User Data             │
       │                             │◄───────────────────────┤
       │                             │  { id, email, role,    │
       │                             │    businessId }        │
       │                             │                        │
       │                             │  3. Generate JWT       │
       │                             │  Payload:              │
       │                             │  - userId              │
       │                             │  - email               │
       │                             │  - role                │
       │                             │  - businessId          │
       │                             │  - exp (expiry)        │
       │                             │                        │
       │  JWT Token                  │                        │
       │◄────────────────────────────┤                        │
       │  { accessToken, user }      │                        │
       │                             │                        │

┌─────────────────────────────────────────────────────────────────┐
│              AUTHORIZATION FLOW                                 │
└─────────────────────────────────────────────────────────────────┘

    Client                    Middleware                  Controller
       │                          │                            │
       │  API Request             │                            │
       │  + Bearer Token          │                            │
       ├─────────────────────────►│                            │
       │                          │                            │
       │                          │  1. JwtAuthGuard           │
       │                          │  - Extract token           │
       │                          │  - Verify signature        │
       │                          │  - Check expiry            │
       │                          │  - Decode payload          │
       │                          │                            │
       │                          │  2. Attach user to req     │
       │                          │  req.user = {              │
       │                          │    id, email, role,        │
       │                          │    businessId              │
       │                          │  }                         │
       │                          │                            │
       │                          │  3. RolesGuard (if needed) │
       │                          │  - Check req.user.role     │
       │                          │  - Compare with @Roles()   │
       │                          │  - Allow/Deny access       │
       │                          │                            │
       │                          │  Request + User Context    │
       │                          ├───────────────────────────►│
       │                          │                            │
       │                          │                            │  4. Business Logic
       │                          │                            │  - Access req.user
       │                          │                            │  - Validate ownership
       │                          │                            │  - Process request
       │                          │                            │
       │                          │  Response                  │
       │◄─────────────────────────┴────────────────────────────┤
       │                          │                            │

┌─────────────────────────────────────────────────────────────────┐
│              GUARD HIERARCHY                                    │
└─────────────────────────────────────────────────────────────────┘

Public Endpoints (No Guards)
├─ GET /menu/:businessId
├─ GET /categories/:businessId
└─ GET /menu/:id

Authenticated Endpoints (@UseGuards(JwtAuthGuard))
├─ POST /cart
├─ POST /cart/item
├─ GET /cart
├─ POST /order
├─ GET /order/user
└─ POST /menu-rating

Admin Endpoints (@UseGuards(JwtAuthGuard, RolesGuard) + @Roles())
├─ POST /menu                    [BUSINESS_SUPER_ADMIN]
├─ PATCH /menu/:id               [BUSINESS_SUPER_ADMIN]
├─ DELETE /menu/:id              [BUSINESS_SUPER_ADMIN]
├─ POST /categories              [BUSINESS_SUPER_ADMIN]
├─ PATCH /categories/:id         [BUSINESS_SUPER_ADMIN]
├─ DELETE /categories/:id        [BUSINESS_SUPER_ADMIN]
└─ GET /order/business-man-vs    [BUSINESS_SUPER_ADMIN]
```



---

## 🏢 Multi-Tenancy Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│              MULTI-TENANT ISOLATION                             │
└─────────────────────────────────────────────────────────────────┘

                    ┌──────────────────┐
                    │  Single Database │
                    └────────┬─────────┘
                             │
        ┌────────────────────┼────────────────────┐
        │                    │                    │
        ▼                    ▼                    ▼
┌───────────────┐    ┌───────────────┐    ┌───────────────┐
│ Restaurant A  │    │ Restaurant B  │    │ Restaurant C  │
│ businessId: 1 │    │ businessId: 2 │    │ businessId: 3 │
└───────────────┘    └───────────────┘    └───────────────┘
        │                    │                    │
        ├─ Categories        ├─ Categories        ├─ Categories
        ├─ Menus            ├─ Menus            ├─ Menus
        ├─ Orders           ├─ Orders           ├─ Orders
        └─ Ratings          └─ Ratings          └─ Ratings

┌─────────────────────────────────────────────────────────────────┐
│              DATA ISOLATION STRATEGY                            │
└─────────────────────────────────────────────────────────────────┘

1. Row-Level Security
   ┌────────────────────────────────────────┐
   │ Every query includes businessId filter │
   │                                        │
   │ Example:                               │
   │ SELECT * FROM menu                     │
   │ WHERE businessId = :businessId         │
   │ AND deletedAt IS NULL                  │
   └────────────────────────────────────────┘

2. JWT Token Contains businessId
   ┌────────────────────────────────────────┐
   │ Token Payload:                         │
   │ {                                      │
   │   userId: "uuid",                      │
   │   email: "admin@restaurant-a.com",     │
   │   role: "BUSINESS_SUPER_ADMIN",        │
   │   businessId: "restaurant-a-uuid"      │
   │ }                                      │
   └────────────────────────────────────────┘

3. Automatic Filtering in Services
   ┌────────────────────────────────────────┐
   │ Service Layer:                         │
   │                                        │
   │ async findAllMenu(businessId, query) { │
   │   return this.menuRepo.find({          │
   │     where: {                           │
   │       businessId,  ← Always filtered   │
   │       ...query                         │
   │     }                                  │
   │   });                                  │
   │ }                                      │
   └────────────────────────────────────────┘

4. Ownership Validation
   ┌────────────────────────────────────────┐
   │ Before Update/Delete:                  │
   │                                        │
   │ const menu = await findOne({           │
   │   id: menuId,                          │
   │   businessId: req.user.businessId      │
   │ });                                    │
   │                                        │
   │ if (!menu) {                           │
   │   throw new NotFoundException();       │
   │ }                                      │
   └────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│              TENANT ISOLATION FLOW                              │
└─────────────────────────────────────────────────────────────────┘

Restaurant A Admin                          Restaurant B Admin
       │                                           │
       │  POST /menu                               │  POST /menu
       │  Token: { businessId: "A" }               │  Token: { businessId: "B" }
       │                                           │
       ▼                                           ▼
┌──────────────────┐                      ┌──────────────────┐
│  Menu Created    │                      │  Menu Created    │
│  businessId: "A" │                      │  businessId: "B" │
└──────────────────┘                      └──────────────────┘
       │                                           │
       │  GET /menu/A                              │  GET /menu/B
       │                                           │
       ▼                                           ▼
┌──────────────────┐                      ┌──────────────────┐
│  Returns only    │                      │  Returns only    │
│  Restaurant A    │                      │  Restaurant B    │
│  menus           │                      │  menus           │
└──────────────────┘                      └──────────────────┘
       │                                           │
       │  PATCH /menu/:id                          │  PATCH /menu/:id
       │  (Restaurant B's menu ID)                 │  (Restaurant A's menu ID)
       │                                           │
       ▼                                           ▼
┌──────────────────┐                      ┌──────────────────┐
│  404 Not Found   │                      │  404 Not Found   │
│  (Ownership      │                      │  (Ownership      │
│   validation     │                      │   validation     │
│   failed)        │                      │   failed)        │
└──────────────────┘                      └──────────────────┘
```



---

## 🔄 Data Flow Patterns

### 1. Menu Item with Add-ons Flow

```
┌─────────────────────────────────────────────────────────────────┐
│         MENU ITEM WITH ADD-ONS CREATION                         │
└─────────────────────────────────────────────────────────────────┘

Step 1: Create Add-ons
┌──────────────┐
│ POST /addons │
└──────┬───────┘
       │
       ▼
┌─────────────────┐
│ AddOn 1         │  id: "addon-1"
│ - Extra Cheese  │  price: 2.00
└─────────────────┘

┌─────────────────┐
│ AddOn 2         │  id: "addon-2"
│ - Bacon         │  price: 3.00
└─────────────────┘

Step 2: Create Menu Item
┌──────────────┐
│ POST /menu   │
└──────┬───────┘
       │
       ▼
┌─────────────────┐
│ Menu Item       │  id: "menu-1"
│ - Burger        │  price: 10.00
│ - allowAddOns   │  allowAddOns: true
└─────────────────┘

Step 3: Link Add-ons to Menu
┌────────────────────────┐
│ PATCH /menu/           │
│ update-addons/menu-1   │
└──────┬─────────────────┘
       │
       ▼
┌─────────────────────────────────┐
│ Menu-AddOn Relationship         │
│ (Many-to-Many)                  │
│                                 │
│ menu-1 ←→ addon-1               │
│ menu-1 ←→ addon-2               │
└─────────────────────────────────┘

Step 4: Customer Views Menu
┌──────────────────┐
│ GET /menu/menu-1 │
└──────┬───────────┘
       │
       ▼
┌─────────────────────────────────┐
│ Response:                       │
│ {                               │
│   id: "menu-1",                 │
│   name: "Burger",               │
│   price: 10.00,                 │
│   allowAddOns: true,            │
│   addOns: [                     │
│     {                           │
│       id: "addon-1",            │
│       name: "Extra Cheese",     │
│       price: 2.00               │
│     },                          │
│     {                           │
│       id: "addon-2",            │
│       name: "Bacon",            │
│       price: 3.00               │
│     }                           │
│   ]                             │
│ }                               │
└─────────────────────────────────┘
```



### 2. Cart to Order Conversion Flow

```
┌─────────────────────────────────────────────────────────────────┐
│         CART TO ORDER CONVERSION                                │
└─────────────────────────────────────────────────────────────────┘

CART STATE (Before Order)
┌─────────────────────────────────────────────────────────────────┐
│ Cart (userId: "user-1")                                         │
│ ├─ CartItem 1                                                   │
│ │  ├─ Menu: Burger (menuId: "menu-1")                          │
│ │  ├─ Quantity: 2                                               │
│ │  └─ CartItemAddOns:                                           │
│ │     ├─ Extra Cheese (addonId: "addon-1", qty: 2)             │
│ │     └─ Bacon (addonId: "addon-2", qty: 1)                    │
│ │                                                               │
│ └─ CartItem 2                                                   │
│    ├─ Menu: Fries (menuId: "menu-2")                           │
│    ├─ Quantity: 1                                               │
│    └─ CartItemAddOns: (none)                                    │
└─────────────────────────────────────────────────────────────────┘

                         │
                         │ POST /order
                         ▼

TRANSFORMATION PROCESS
┌─────────────────────────────────────────────────────────────────┐
│ 1. Fetch current prices from Menu & AddOn tables               │
│    - Burger: $10.00                                             │
│    - Extra Cheese: $2.00                                        │
│    - Bacon: $3.00                                               │
│    - Fries: $4.00                                               │
│                                                                 │
│ 2. Calculate totals                                             │
│    Item 1: (10.00 * 2) + (2.00 * 2) + (3.00 * 1) = $27.00     │
│    Item 2: (4.00 * 1) = $4.00                                  │
│    Total: $31.00                                                │
│                                                                 │
│ 3. Create Order entity                                          │
│    - orderId: "order-1"                                         │
│    - userId: "user-1"                                           │
│    - businessId: "business-1"                                   │
│    - totalAmount: 31.00                                         │
│                                                                 │
│ 4. Create OrderItem entities (snapshot prices)                 │
│    - OrderItem 1: menuId="menu-1", qty=2, price=10.00          │
│    - OrderItem 2: menuId="menu-2", qty=1, price=4.00           │
│                                                                 │
│ 5. Create OrderItemAddon entities (snapshot prices)            │
│    - OrderItemAddon 1: addonId="addon-1", qty=2, price=2.00    │
│    - OrderItemAddon 2: addonId="addon-2", qty=1, price=3.00    │
│                                                                 │
│ 6. Create OrderStatus entity                                    │
│    - status: PENDING                                            │
│    - updatedBy: "user-1"                                        │
│                                                                 │
│ 7. Clear cart (soft delete CartItems)                          │
└─────────────────────────────────────────────────────────────────┘

                         │
                         ▼

ORDER STATE (After Conversion)
┌─────────────────────────────────────────────────────────────────┐
│ Order (orderId: "order-1")                                      │
│ ├─ userId: "user-1"                                             │
│ ├─ businessId: "business-1"                                     │
│ ├─ totalAmount: 31.00                                           │
│ ├─ OrderItems:                                                  │
│ │  ├─ OrderItem 1                                               │
│ │  │  ├─ Menu: Burger (reference)                              │
│ │  │  ├─ Quantity: 2                                            │
│ │  │  ├─ Price: 10.00 (snapshot)                               │
│ │  │  └─ OrderItemAddons:                                       │
│ │  │     ├─ Extra Cheese (qty: 2, price: 2.00)                 │
│ │  │     └─ Bacon (qty: 1, price: 3.00)                        │
│ │  │                                                            │
│ │  └─ OrderItem 2                                               │
│ │     ├─ Menu: Fries (reference)                               │
│ │     ├─ Quantity: 1                                            │
│ │     └─ Price: 4.00 (snapshot)                                │
│ │                                                               │
│ └─ OrderStatus:                                                 │
│    └─ Status: PENDING                                           │
│       updatedBy: "user-1"                                       │
│       createdAt: 2024-01-15 10:30:00                           │
└─────────────────────────────────────────────────────────────────┘

KEY DIFFERENCES:
┌─────────────────────────────────────────────────────────────────┐
│ Cart                          │  Order                          │
│───────────────────────────────┼─────────────────────────────────│
│ References live prices        │  Stores snapshot prices         │
│ Can be modified               │  Immutable (historical record)  │
│ Temporary                     │  Permanent                      │
│ No price fields               │  Price fields in items/addons   │
│ Single user scope             │  Business + User scope          │
└─────────────────────────────────────────────────────────────────┘
```



---

## 📊 System Architecture Layers

```
┌─────────────────────────────────────────────────────────────────┐
│                    LAYERED ARCHITECTURE                         │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                    PRESENTATION LAYER                           │
│                      (Controllers)                              │
├─────────────────────────────────────────────────────────────────┤
│  - HTTP Request/Response handling                               │
│  - Route definitions                                            │
│  - Request validation (DTOs)                                    │
│  - Response formatting                                          │
│  - Swagger/OpenAPI documentation                                │
│                                                                 │
│  Controllers:                                                   │
│  ├─ MenuController                                              │
│  ├─ CategoryController                                          │
│  ├─ CartController                                              │
│  ├─ OrderController                                             │
│  ├─ AddonsController                                            │
│  └─ MenuRatingController                                        │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    SECURITY LAYER                               │
│                  (Guards & Strategies)                          │
├─────────────────────────────────────────────────────────────────┤
│  - Authentication (JWT)                                         │
│  - Authorization (Roles)                                        │
│  - Token validation                                             │
│  - User context injection                                       │
│                                                                 │
│  Components:                                                    │
│  ├─ JwtAuthGuard                                                │
│  ├─ RolesGuard                                                  │
│  ├─ JwtStrategy                                                 │
│  └─ @Roles() Decorator                                          │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    BUSINESS LOGIC LAYER                         │
│                       (Services)                                │
├─────────────────────────────────────────────────────────────────┤
│  - Business rules implementation                                │
│  - Data transformation                                          │
│  - Complex calculations                                         │
│  - Orchestration logic                                          │
│  - External service communication                               │
│                                                                 │
│  Services:                                                      │
│  ├─ MenuService                                                 │
│  ├─ CategoryService                                             │
│  ├─ CartService                                                 │
│  ├─ OrderService                                                │
│  ├─ AddonsService                                               │
│  ├─ MenuRatingService                                           │
│  └─ ServiceCommunicationService                                 │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    DATA ACCESS LAYER                            │
│                     (Repositories)                              │
├─────────────────────────────────────────────────────────────────┤
│  - Database queries                                             │
│  - CRUD operations                                              │
│  - Query optimization                                           │
│  - Transaction management                                       │
│                                                                 │
│  Repositories:                                                  │
│  ├─ MenuRepository                                              │
│  ├─ CategoryRepository                                          │
│  ├─ CartRepository                                              │
│  ├─ CartItemRepository                                          │
│  ├─ CartItemAddonsRepository                                    │
│  ├─ OrderRepository                                             │
│  ├─ OrderItemRepository                                         │
│  ├─ OrderItemAddonsRepository                                   │
│  ├─ OrderStatusRepository                                       │
│  ├─ AddonsRepository                                            │
│  └─ MenuRatingRepository                                        │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    PERSISTENCE LAYER                            │
│                    (Database - TypeORM)                         │
├─────────────────────────────────────────────────────────────────┤
│  - PostgreSQL Database                                          │
│  - Entity definitions                                           │
│  - Migrations                                                   │
│  - Relationships                                                │
│  - Indexes                                                      │
│                                                                 │
│  Entities:                                                      │
│  ├─ BaseEntity (abstract)                                       │
│  ├─ MenuEntity                                                  │
│  ├─ CategoryEntity                                              │
│  ├─ CartEntity                                                  │
│  ├─ CartItemEntity                                              │
│  ├─ CartItemAddOnsEntity                                        │
│  ├─ OrderEntity                                                 │
│  ├─ OrderItemEntity                                             │
│  ├─ OrderItemAddonEntity                                        │
│  ├─ OrderStatusEntity                                           │
│  ├─ AddOnEntity                                                 │
│  └─ MenuRatingEntity                                            │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    CROSS-CUTTING CONCERNS                       │
├─────────────────────────────────────────────────────────────────┤
│  - Configuration Management                                     │
│  - Logging                                                      │
│  - Error Handling                                               │
│  - Validation (class-validator)                                 │
│  - Transformation (class-transformer)                           │
│  - Common DTOs & Responses                                      │
│  - Enums & Constants                                            │
│  - Decorators                                                   │
└─────────────────────────────────────────────────────────────────┘
```



---

## 🔧 Technical Stack & Dependencies

```
┌─────────────────────────────────────────────────────────────────┐
│                    TECHNOLOGY STACK                             │
└─────────────────────────────────────────────────────────────────┘

Backend Framework
├─ NestJS (Node.js framework)
│  ├─ Modular architecture
│  ├─ Dependency injection
│  ├─ Decorator-based
│  └─ TypeScript support

Database
├─ PostgreSQL
│  ├─ Relational database
│  ├─ JSONB support
│  ├─ Array types
│  └─ Full ACID compliance

ORM
├─ TypeORM
│  ├─ Entity management
│  ├─ Query builder
│  ├─ Migrations
│  └─ Relationships

Authentication
├─ JWT (JSON Web Tokens)
│  ├─ Passport.js
│  ├─ @nestjs/jwt
│  └─ @nestjs/passport

Validation
├─ class-validator
│  ├─ DTO validation
│  ├─ Decorator-based rules
│  └─ Custom validators

Transformation
├─ class-transformer
│  ├─ Object serialization
│  ├─ Response formatting
│  └─ Data mapping

Documentation
├─ Swagger/OpenAPI
│  ├─ @nestjs/swagger
│  ├─ API documentation
│  └─ Interactive testing

Containerization
├─ Docker
│  ├─ Dockerfile
│  ├─ docker-compose.yml
│  └─ PostgreSQL container
```



---

## 🚀 API Endpoints Summary

### Public Endpoints (No Authentication)

```
┌─────────────────────────────────────────────────────────────────┐
│ METHOD │ ENDPOINT                    │ DESCRIPTION              │
├────────┼─────────────────────────────┼──────────────────────────┤
│ GET    │ /menu/:businessId           │ Browse menu items        │
│ GET    │ /menu/:id                   │ View menu item details   │
│ GET    │ /categories/:businessId     │ List categories          │
│ GET    │ /categories/:id             │ View category details    │
│ GET    │ /addons                     │ List all add-ons         │
│ GET    │ /addons/:id                 │ View add-on details      │
└─────────────────────────────────────────────────────────────────┘
```

### Customer Endpoints (JWT Required)

```
┌─────────────────────────────────────────────────────────────────┐
│ METHOD │ ENDPOINT                    │ DESCRIPTION              │
├────────┼─────────────────────────────┼──────────────────────────┤
│ POST   │ /cart                       │ Create cart              │
│ POST   │ /cart/item                  │ Add item to cart         │
│ GET    │ /cart                       │ View cart                │
│ PATCH  │ /cart/:itemId               │ Update cart item         │
│ DELETE │ /cart/:id                   │ Remove from cart         │
│        │                             │                          │
│ POST   │ /order                      │ Place order              │
│ GET    │ /order/user                 │ List user orders         │
│ GET    │ /order/:id                  │ View order details       │
│ POST   │ /order/:orderId/            │ Update order status      │
│        │ change-status               │                          │
│        │                             │                          │
│ POST   │ /menu-rating                │ Rate menu item           │
│ GET    │ /menu-rating                │ View ratings             │
│ PATCH  │ /menu-rating/:id            │ Update rating            │
│ DELETE │ /menu-rating/:id            │ Delete rating            │
└─────────────────────────────────────────────────────────────────┘
```

### Business Admin Endpoints (JWT + BUSINESS_SUPER_ADMIN Role)

```
┌─────────────────────────────────────────────────────────────────┐
│ METHOD │ ENDPOINT                    │ DESCRIPTION              │
├────────┼─────────────────────────────┼──────────────────────────┤
│ POST   │ /menu                       │ Create menu item         │
│ PATCH  │ /menu/:id                   │ Update menu item         │
│ PATCH  │ /menu/update-addons/:id     │ Update menu add-ons      │
│ PATCH  │ /menu/toggle-signature/:id  │ Toggle signature dish    │
│ DELETE │ /menu/:id                   │ Delete menu item         │
│        │                             │                          │
│ POST   │ /categories                 │ Create category          │
│ PATCH  │ /categories/:id             │ Update category          │
│ DELETE │ /categories/:id             │ Delete category          │
│        │                             │                          │
│ POST   │ /addons                     │ Create add-on            │
│ PATCH  │ /addons/:id                 │ Update add-on            │
│ DELETE │ /addons/:id                 │ Delete add-on            │
│        │                             │                          │
│ GET    │ /order/business-man-vs/     │ View business orders     │
│        │ :businessId                 │                          │
└─────────────────────────────────────────────────────────────────┘
```



---

## 📈 Scalability Considerations

```
┌─────────────────────────────────────────────────────────────────┐
│                    SCALABILITY PATTERNS                         │
└─────────────────────────────────────────────────────────────────┘

1. Horizontal Scaling
   ┌────────────────────────────────────────┐
   │  Load Balancer                         │
   └────────┬───────────┬───────────┬───────┘
            │           │           │
            ▼           ▼           ▼
   ┌─────────────┐ ┌─────────────┐ ┌─────────────┐
   │  NestJS     │ │  NestJS     │ │  NestJS     │
   │  Instance 1 │ │  Instance 2 │ │  Instance 3 │
   └──────┬──────┘ └──────┬──────┘ └──────┬──────┘
          │               │               │
          └───────────────┼───────────────┘
                          │
                          ▼
                 ┌─────────────────┐
                 │   PostgreSQL    │
                 │   (Primary)     │
                 └─────────────────┘

2. Database Optimization
   ┌────────────────────────────────────────┐
   │ - Indexes on businessId columns        │
   │ - Indexes on foreign keys              │
   │ - Query optimization                   │
   │ - Connection pooling                   │
   │ - Read replicas for reporting          │
   └────────────────────────────────────────┘

3. Caching Strategy
   ┌────────────────────────────────────────┐
   │ Redis Cache                            │
   │ ├─ Menu items (frequently accessed)    │
   │ ├─ Categories                          │
   │ ├─ Business configurations             │
   │ └─ Session data                        │
   └────────────────────────────────────────┘

4. Microservices Potential
   ┌────────────────────────────────────────┐
   │ Current: Monolithic                    │
   │                                        │
   │ Future Split:                          │
   │ ├─ Menu Service                        │
   │ ├─ Order Service                       │
   │ ├─ Cart Service                        │
   │ ├─ User Service                        │
   │ └─ Notification Service                │
   └────────────────────────────────────────┘

5. Multi-Tenant Optimization
   ┌────────────────────────────────────────┐
   │ - Tenant-specific database schemas     │
   │ - Tenant-based sharding                │
   │ - Isolated data per business           │
   │ - Resource quotas per tenant           │
   └────────────────────────────────────────┘
```



---

## 🔒 Security Best Practices

```
┌─────────────────────────────────────────────────────────────────┐
│                    SECURITY MEASURES                            │
└─────────────────────────────────────────────────────────────────┘

1. Authentication Security
   ┌────────────────────────────────────────┐
   │ ✓ JWT token-based authentication       │
   │ ✓ Token expiration                     │
   │ ✓ Secure token storage                 │
   │ ✓ Password hashing (bcrypt)            │
   │ ✓ Refresh token rotation               │
   └────────────────────────────────────────┘

2. Authorization Security
   ┌────────────────────────────────────────┐
   │ ✓ Role-based access control (RBAC)     │
   │ ✓ Resource ownership validation        │
   │ ✓ businessId isolation                 │
   │ ✓ Guard-based protection               │
   └────────────────────────────────────────┘

3. Data Security
   ┌────────────────────────────────────────┐
   │ ✓ Soft deletes (data recovery)         │
   │ ✓ Input validation (DTOs)              │
   │ ✓ SQL injection prevention (TypeORM)   │
   │ ✓ XSS protection                       │
   │ ✓ CSRF protection                      │
   └────────────────────────────────────────┘

4. API Security
   ┌────────────────────────────────────────┐
   │ ✓ Rate limiting                        │
   │ ✓ CORS configuration                   │
   │ ✓ Helmet.js (security headers)         │
   │ ✓ Request size limits                  │
   │ ✓ API versioning                       │
   └────────────────────────────────────────┘

5. Environment Security
   ┌────────────────────────────────────────┐
   │ ✓ Environment variables (.env)         │
   │ ✓ Secrets management                   │
   │ ✓ Database credentials protection      │
   │ ✓ JWT secret rotation                  │
   └────────────────────────────────────────┘

6. Audit & Monitoring
   ┌────────────────────────────────────────┐
   │ ✓ Timestamps (createdAt, updatedAt)    │
   │ ✓ Status change tracking (updatedBy)   │
   │ ✓ Soft delete tracking (deletedAt)     │
   │ ✓ Order history preservation           │
   │ ✓ Logging & monitoring                 │
   └────────────────────────────────────────┘
```



---

## 🎯 Key Features Summary

```
┌─────────────────────────────────────────────────────────────────┐
│                    PLATFORM FEATURES                            │
└─────────────────────────────────────────────────────────────────┘

For Customers:
├─ Browse menu items by category
├─ Filter by service type (dine-in, takeaway, delivery)
├─ View signature dishes
├─ Add items to cart with customizable add-ons
├─ Modify cart quantities
├─ Place orders with remarks
├─ Track order status in real-time
├─ View order history
├─ Rate and review menu items
└─ Multi-restaurant support

For Business Admins:
├─ Manage menu items (CRUD)
├─ Create hierarchical categories
├─ Configure add-ons for menu items
├─ Mark signature dishes
├─ Set availability and pricing
├─ Manage discounted prices
├─ View all business orders
├─ Update order status
├─ Track order history
├─ Multi-service type support
└─ Bar item management

Platform Features:
├─ Multi-tenant architecture
├─ Role-based access control
├─ JWT authentication
├─ Soft delete for data recovery
├─ Price snapshot for orders
├─ Status history tracking
├─ Audit trail
├─ RESTful API
├─ Swagger documentation
└─ Docker containerization

Data Integrity:
├─ Referential integrity
├─ Transaction support
├─ Validation at multiple layers
├─ Business rule enforcement
├─ Historical data preservation
└─ Ownership validation
```



---

## 🔄 Future Enhancements

```
┌─────────────────────────────────────────────────────────────────┐
│                    POTENTIAL IMPROVEMENTS                       │
└─────────────────────────────────────────────────────────────────┘

1. Payment Integration
   ├─ Payment gateway integration
   ├─ Multiple payment methods
   ├─ Payment status tracking
   ├─ Refund management
   └─ Invoice generation

2. Notification System
   ├─ Real-time order updates (WebSocket)
   ├─ Email notifications
   ├─ SMS notifications
   ├─ Push notifications
   └─ In-app notifications

3. Advanced Features
   ├─ Loyalty program
   ├─ Coupon/discount system
   ├─ Table reservation
   ├─ Delivery tracking
   ├─ Kitchen display system
   └─ Inventory management

4. Analytics & Reporting
   ├─ Sales reports
   ├─ Popular items analysis
   ├─ Customer behavior tracking
   ├─ Revenue analytics
   └─ Business intelligence dashboard

5. User Management
   ├─ Customer profiles
   ├─ Address management
   ├─ Order preferences
   ├─ Favorite items
   └─ Social login

6. Performance Optimization
   ├─ Redis caching
   ├─ CDN for images
   ├─ Database query optimization
   ├─ API response compression
   └─ Lazy loading

7. Mobile Support
   ├─ Mobile-optimized API
   ├─ QR code ordering
   ├─ Mobile app integration
   └─ Progressive Web App (PWA)

8. Multi-Language Support
   ├─ i18n implementation
   ├─ Multi-currency support
   ├─ Localized content
   └─ Regional settings
```

---

## 📝 Conclusion

This restaurant e-commerce platform is built with a **modern, scalable architecture** that supports:

- **Multi-tenancy** for multiple restaurants
- **Role-based access control** for different user types
- **Complete order lifecycle** from browsing to delivery
- **Data integrity** with soft deletes and audit trails
- **Flexible pricing** with add-ons and discounts
- **Security best practices** at every layer

The architecture is designed to be **extensible** and can easily accommodate future enhancements like payment integration, real-time notifications, and advanced analytics.

---

**Document Version:** 1.0  
**Last Updated:** 2024  
**Architecture Type:** Monolithic with Multi-Tenant Support  
**Framework:** NestJS + TypeORM + PostgreSQL
