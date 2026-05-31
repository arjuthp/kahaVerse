# Restaurant E-Commerce Complete Flow

**Current Date:** May 27, 2026  
**API Base URL:** `https://api.kaha.com.np/main/api/v3`  
**Frontend:** `kaha_Restarant_Eecommerce_Frontend/`  
**Backend:** `Kaha_restaurant-ecommerce/restaurant-ecommerce/`

---

## Table of Contents
1. [System Overview](#system-overview)
2. [Authentication Flow](#authentication-flow)
3. [User Management & Roles](#user-management--roles)
4. [Business (Restaurant) Management](#business-restaurant-management)
5. [Menu Management](#menu-management)
6. [Shopping Cart & Checkout](#shopping-cart--checkout)
7. [Order Management](#order-management)
8. [Data Models](#data-models)
9. [API Integration Points](#api-integration-points)
10. [Known Issues & Fixes](#known-issues--fixes)

---

## System Overview

The Kaha Restaurant E-Commerce system is a full-stack application that enables restaurants to manage menus, accept orders, and process payments through integration with the **Kaha Main API v3**.

### Architecture

```
Frontend (React/TypeScript)
    ↓
Backend (NestJS)
    ↓
Kaha Main API v3 (External Service)
```

### Key Services

- **Service Communication Service** (`src/modules/service-communication/service-communication.service.ts`)  
  Handles all external API calls to Kaha Main API v3
- **Configuration Service** (`src/configuration/configuration.service.ts`)  
  Manages environment variables and typed configuration access
- **Authentication Module**  
  Handles JWT token validation and bearer token forwarding

---

## Authentication Flow

### 1. Obtaining a JWT Token

**Endpoint:** `POST /auth/login`

```bash
curl -X POST https://api.kaha.com.np/main/api/v3/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "contactNumber": "9813870231",
    "password": "ishwor19944"
  }'
```

**Response (201 Created):**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "role": "admin"
}
```

### 2. Using the Token

All subsequent API calls require the Authorization header:

```
Authorization: Bearer <accessToken>
```

### 3. Test Credentials

| Field | Value |
|-------|-------|
| **contactNumber** | `9813870231` |
| **password** | `ishwor19944` |
| **email** | `replyishwor@gmail.comz` |
| **kahaId** | `U-8C695E` |
| **userId** | `afc70db3-6f43-4882-92fd-4715f25ffc95` |

### 4. Token Storage & Forwarding

The backend:
- ✅ Properly forwards the token to Kaha Main API v3 on all external calls
- ✅ Implements `createHeaders(authToken)` method for consistent Authorization header injection
- ✅ Handles token as parameter for flexibility in different auth scenarios
- ✅ Includes comprehensive error handling and logging

✅ **ISSUE #1 - FIXED:** Authorization headers are properly injected on all API calls to Kaha Main API v3.

**Implementation:** All methods use the `createHeaders(authToken)` utility method to ensure Bearer token headers are consistently applied.

---

## User Management & Roles

### Route #1: Get User Profile

**Endpoint:** `GET /users/{id}`  
**Used by:** [`getUser()`](../src/modules/service-communication/service-communication.service.ts#L42)  
**Requires:** `Authorization: Bearer <JWT>`

```bash
curl -X GET https://api.kaha.com.np/main/api/v3/users/afc70db3-6f43-4882-92fd-4715f25ffc95 \
  -H "Authorization: Bearer <accessToken>"
```

**Response (200 OK):**
```json
{
  "id": "afc70db3-6f43-4882-92fd-4715f25ffc95",
  "fullName": "ishwor gautam",
  "email": "replyishwor@gmail.comz",
  "contactNumber": "9813870231",
  "status": "verified",
  "avatar": "https://...",
  "kahaId": "U-8C695E",
  "role": "admin",
  "firstName": null,
  "lastName": null,
  "dateOfBirth": null,
  "gender": null,
  "createdAt": "2023-06-18T07:58:24.413Z",
  "hasPassword": true
}
```

✅ **ISSUE #2 - FIXED:** Both `getUserRoles()` and `getUser()` methods exist and work correctly. `getUserRoles()` returns basic user data (not business-specific roles). For business-specific roles, use `getBusinessUserRoles()` instead (Route #3).

### Route #3: Get User Roles in Business

**Endpoint:** `GET /business-users/{businessId}/{userId}`  
**Used by:** [`getBusinessUserRoles()`](../src/modules/service-communication/service-communication.service.ts#L11)  
**Requires:** `Authorization: Bearer <JWT>`

```bash
curl -X GET https://api.kaha.com.np/main/api/v3/business-users/7476ee15-1407-41fa-9a49-89e0caaf945d/afc70db3-6f43-4882-92fd-4715f25ffc95 \
  -H "Authorization: Bearer <accessToken>"
```

**Response (200 OK):**
```json
{
  "id": "7bb484c3-...",
  "createdAt": "2025-11-18T07:49:04.239Z",
  "updatedAt": "2025-11-26T05:03:24.486Z",
  "availability": null,
  "role": {
    "id": "c954dc77-...",
    "name": "Student",
    "label": null,
    "description": "Student"
  },
  "user": {
    "id": "afc70db3-6f43-4882-92fd-4715f25ffc95",
    "fullName": "ishwor gautam",
    "kahaId": "U-8C695E",
    "contactNumber": "9813870231",
    "email": "replyishwor@gmail.comz",
    "avatar": "https://...",
    "role": "admin",
    "status": "verified",
    "password": "$2b$10$A7bHm6DO..."
  }
}
```

✅ **ISSUE #3 - FIXED:** The `getBusinessUserRoles()` method correctly handles the singular `role` object (not an array).

✅ **ISSUE #4 - FIXED:** Password hashes are automatically stripped from responses before returning to avoid security leaks.

---

## Business (Restaurant) Management

### Route #2: Get Business Details

**Endpoint:** `GET /businesses/{id}`  
**Used by:** [`getBusiness()`](../src/modules/service-communication/service-communication.service.ts#L55)  
**Requires:** `Authorization: Bearer <JWT>`  
**Optional Query:** `latitude`, `longitude`, `userId`

```bash
curl -X GET https://api.kaha.com.np/main/api/v3/businesses/7476ee15-1407-41fa-9a49-89e0caaf945d \
  -H "Authorization: Bearer <accessToken>"
```

**Response (200 OK):**
```json
{
  "id": "7476ee15-1407-41fa-9a49-89e0caaf945d",
  "name": "IshworHostel",
  "kahaId": "B-06CF03",
  "tag": "ISHWORHOSTEL",
  "entity": "Business",
  "contact": "9868348282",
  "category": {
    "id": "...",
    "name": "Boys Hostel",
    "parentCategoryName": "Business"
  },
  "avatar": "https://...",
  "coverImageUrl": "https://...",
  "available": false,
  "delivery": false,
  "pickup": false,
  "isVisible": true,
  "isOfficial": false,
  "hasOwnershipClaim": false,
  "workingDaysAndHours": {
    "monday": "9:0-17:0",
    "tuesday": "9:0-17:0"
  },
  "location": {
    "type": "Point",
    "coordinates": [27.699, 85.328]
  },
  "mapAddress": {
    "street": "...",
    "province": "3",
    "district": "28",
    "municipality": "54",
    "wardNo": "1",
    "country": "Nepal",
    "googlePlacesData": {}
  },
  "status": {
    "value": "verified"
  },
  "owner": {
    "id": "740716db-...",
    "fullName": "Sabin Ghimire"
  },
  "address": "...",
  "geohash": "tuuttdw1y2cj",
  "businessTypes": [],
  "additionalInfo": [],
  "createdAt": "2025-10-10T07:23:35.017Z"
}
```

### Test Business

| Field | Value |
|-------|-------|
| **businessId** | `7476ee15-1407-41fa-9a49-89e0caaf945d` |
| **name** | `IshworHostel` |
| **kahaId** | `B-06CF03` |
| **contact** | `9868348282` |

---

## Menu Management

### Retrieve Menu Items

While not explicitly listed in the external API reference, the system should fetch restaurant menu items.

**Recommended Pattern:**
```
GET /businesses/{businessId}/menus
GET /businesses/{businessId}/menu-items
```

### Menu Item Structure (Expected)

```json
{
  "id": "menu-item-uuid",
  "name": "Chicken Momo",
  "description": "Steamed dumplings with chicken filling",
  "price": 150,
  "currency": "NPR",
  "image": "https://...",
  "category": "appetizers",
  "available": true,
  "preparationTime": 15,
  "spicyLevel": 2,
  "ingredients": ["chicken", "flour", "onion"]
}
```

---

## Shopping Cart & Checkout

### Cart State Management (Frontend)

```typescript
interface CartItem {
  menuItemId: string;
  name: string;
  price: number;
  quantity: number;
  specialInstructions?: string;
}

interface Cart {
  businessId: string;
  items: CartItem[];
  subtotal: number;
  deliveryFee: number;
  taxRate: number;
  total: number;
}
```

### Checkout Flow

1. **User selects items** → Add to cart
2. **Apply coupon/promo** (optional)
3. **Confirm delivery address** → Use `mapAddress` from business
4. **Select payment method** → Khalti, eSewa, or cash on delivery
5. **Create order** → `POST /orders` → Backend calls external API
6. **Receive order confirmation** → Return `orderId`

---

## Order Management

### Create Order

**Endpoint:** `POST /orders` (local backend)

```json
{
  "businessId": "7476ee15-1407-41fa-9a49-89e0caaf945d",
  "userId": "afc70db3-6f43-4882-92fd-4715f25ffc95",
  "items": [
    {
      "menuItemId": "menu-item-id",
      "quantity": 2,
      "price": 150,
      "specialInstructions": "No onion"
    }
  ],
  "deliveryAddress": {
    "street": "Thamel, Kathmandu",
    "province": "3",
    "district": "28",
    "municipality": "54"
  },
  "paymentMethod": "khalti",
  "deliveryType": "delivery",
  "notes": "Please ring the doorbell twice"
}
```

### Order Status Flow

```
pending → confirmed → preparing → out_for_delivery → delivered
                          ↓
                      cancelled
```

### Get Order History

**Endpoint:** `GET /orders?businessId=...&userId=...`

---

## Data Models

### User Model

```typescript
interface User {
  id: string;
  fullName: string;
  email: string;
  contactNumber: string;
  kahaId: string;
  avatar: string;
  role: 'admin' | 'staff' | 'customer';
  status: 'verified' | 'unverified' | 'suspended';
  hasPassword: boolean;
  createdAt: Date;
}
```

### Business Model

```typescript
interface Business {
  id: string;
  name: string;
  kahaId: string;
  contact: string;
  avatar: string;
  category: {
    name: string;
    parentCategoryName: string;
  };
  workingDaysAndHours: Record<string, string>;
  location: {
    type: 'Point';
    coordinates: [number, number];
  };
  mapAddress: {
    street: string;
    province: string;
    district: string;
    municipality: string;
    wardNo: string;
    country: string;
  };
  available: boolean;
  delivery: boolean;
  pickup: boolean;
  createdAt: Date;
}
```

### BusinessUserRole Model

```typescript
interface BusinessUserRole {
  id: string;
  businessId: string;
  userId: string;
  role: {
    id: string;
    name: string;
    description: string;
  };
  user: User & {
    password?: string; // ⚠️ Should be stripped
  };
  createdAt: Date;
  updatedAt: Date;
}
```

---

## API Integration Points

### Service Communication Service Location

[`src/modules/service-communication/service-communication.service.ts`](../src/modules/service-communication/service-communication.service.ts)

### Methods (Current)

| # | Method | Endpoint | Status | Features |
|---|--------|----------|--------|----------|
| 1 | `getBusinessUserRoles()` | `GET /business-users/{businessId}/{userId}` | ✅ Working | Auth header, password stripping, proper error handling |
| 2 | `getUserRoles()` | `GET /users/{id}` | ✅ Working | Auth header, comprehensive JSDoc, alias for getUser() |
| 3 | `getUser()` | `GET /users/{id}` | ✅ Working | Auth header, alias method available |
| 4 | `getBusiness()` | `GET /businesses/{id}` | ✅ Working | Auth header, supports query parameters |

### Configuration Service Location

[`src/configuration/configuration.service.ts`](../src/configuration/configuration.service.ts)

**Typed Getter (properly injected and used):**
```typescript
get kahaMainV3BaseURL(): string {
  return this.configService.get<string>("kahaMainV3BaseURL.url");
}
```

✅ **ISSUE #5 - FIXED:** ConfigurationService is properly injected into ServiceCommunicationService and used in all methods.

---

## Known Issues & Fixes

| # | Issue | Status | Implementation | Location |
|---|-------|--------|-----------------|----------|
| **1** | ✅ Authorization headers on all API calls | FIXED | `createHeaders(authToken)` method used in all endpoints | service-communication.service.ts:23-35 |
| **2** | ✅ User/Role endpoint handling | FIXED | Both `getUserRoles()` and `getUser()` methods available | service-communication.service.ts:129-179 |
| **3** | ✅ Business user role response handling | FIXED | Correctly handles singular `role` object | service-communication.service.ts:67-105 |
| **4** | ✅ Password security | FIXED | Automatically strips `user.password` before return | service-communication.service.ts:85-89 |
| **5** | ✅ Configuration injection | FIXED | ConfigurationService properly injected and used | service-communication.service.ts:18, throughout methods |

---

## Useful Sibling Endpoints (Not Yet Used)

```
GET    /users/me                                  ← current user from JWT
GET    /users/filter-user-by-ids?ids=…            ← batch lookup
GET    /users/find-or-create/{contactNumber}
POST   /businesses/bulk                           ← multiple businesses by IDs
GET    /businesses/v2                             ← minimal optimized list
GET    /businesses/owner?businessId=…             ← owner by businessId
GET    /business-users                            ← list memberships
POST   /business-users                            ← create membership
PATCH  /business-users/{id}
DELETE /business-users/{id}
```

Full API spec (376 endpoints, 55 tags):
```
GET /main/api/v3/docs-json
```

Tags include: Auth, Addresses, Banners, Chats, Favourites, Role, Settings, Uploads, …

---

## Environment Variables

Required in `.env`:

```bash
# Kaha Main API v3
KAH_API_V3_BASE_URL=https://api.kaha.com.np/main/api/v3

# Authentication (if using service-to-service)
KAH_API_V3_CLIENT_ID=<your-client-id>
KAH_API_V3_CLIENT_SECRET=<your-client-secret>

# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/kaha_restaurant

# Redis (for session/cache)
REDIS_URL=redis://localhost:6379

# Frontend URL (CORS)
FRONTEND_URL=http://localhost:5173
```

---

## Deployment Checklist

- [x] All 4 methods in service-communication.service.ts include `Authorization: Bearer <token>`
- [x] `getBusinessUserRoles()` handles singular `role` object
- [x] Password hash stripped from user responses
- [x] ConfigurationService injected instead of `process.env` direct access
- [x] Error handling for 401/403 responses with logging
- [x] Token passed as parameter for flexibility
- [x] CORS headers configured correctly
- [x] Request/response logging in place with Logger
- [x] Comprehensive JSDoc documentation
- [x] Production-ready error handling

---

## Quick Reference

**Test Flow:**
1. Login: `POST /auth/login` → Get JWT
2. Get User: `GET /users/{userId}` with Bearer token
3. Get Business: `GET /businesses/{businessId}` with Bearer token
4. Get User Roles: `GET /business-users/{businessId}/{userId}` with Bearer token
5. Create Order: `POST /orders` (local backend)
6. Track Order: `GET /orders/{orderId}`

**Base URL:** `https://api.kaha.com.np/main/api/v3`  
**Docs:** `https://api.kaha.com.np/main/api/v3/docs`  
**Postman Collection:** See `Kaha_Main_V3_Tests.postman_collection.json`

---

**Last Updated:** May 28, 2026  
**Status:** ✅ PRODUCTION READY - All backend critical issues resolved and tested
