# 🔄 Kaha Sync Implementation Guide

## Overview

This document describes the **Kaha → Restaurant E-commerce sync mechanism** that allows user and restaurant business details to be synced from the external Kaha Main API v3 server (`https://dev.kaha.com.np/main/api/v3`).

## 📊 Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    KAHA ECOSYSTEM                            │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────────┐         ┌──────────────────┐         │
│  │  Kaha Main API   │────────▶│  Restaurant      │         │
│  │  (main-api-v3)   │  Sync   │  E-commerce      │         │
│  │                  │  Users  │  Backend         │         │
│  │  - User mgmt     │  Biz    │                  │         │
│  │  - Business mgmt │         │  - Menu mgmt     │         │
│  │  - Payments      │         │  - Orders        │         │
│  └──────────────────┘         │  - Cart          │         │
│                                └──────────────────┘         │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

## 🔐 Authentication Flow

### Step 1: Create Service Account

Restaurant E-commerce admin creates a service account for Kaha:

```bash
POST /admin/service-accounts
Content-Type: application/json

{
  "name": "Kaha Integration",
  "description": "Service account for Kaha main-api-v3 integration",
  "validityDays": 365
}
```

**Response:**
```json
{
  "id": "fba9f2e5-...",
  "name": "Kaha Integration",
  "description": "Service account for Kaha main-api-v3 integration",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiresAt": "2027-03-30T08:23:09Z",
  "message": "Service account created successfully. Store this token securely - it will not be shown again."
}
```

⚠️ **Important:** Store the token securely. It will not be shown again!

### Step 2: Kaha Uses Token to Sync Data

Kaha Main API calls the Restaurant E-commerce backend with the service account token:

```bash
POST /kaha-sync/user-restaurant
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "user": {
    "externalUserId": "kaha-user-12345",
    "phone": "9801234567",
    "firstName": "John",
    "lastName": "Doe",
    "email": "john.doe@example.com"
  },
  "restaurant": {
    "externalRestaurantId": "kaha-business-67890",
    "name": "Mountain View Restaurant",
    "description": "A beautiful restaurant serving authentic Nepali cuisine",
    "address": {
      "country": "Nepal",
      "state": "Bagmati",
      "city": "Kathmandu",
      "streetAddress": "Thamel Street, Ward 26",
      "postalCode": "44600",
      "landmark": "Near Garden of Dreams"
    },
    "contact": {
      "phones": ["+977-1-4567890", "9801234567"],
      "email": "info@mountainview.com",
      "website": "https://mountainview.com"
    },
    "coordinates": {
      "latitude": 27.7172,
      "longitude": 85.3240
    },
    "logoUrl": "https://cdn.kaha.com.np/logos/restaurant-logo.jpg",
    "bannerUrl": "https://cdn.kaha.com.np/banners/restaurant-banner.jpg",
    "rating": 4.5,
    "businessHours": {
      "monday": { "open": "09:00", "close": "22:00", "isOpen": true },
      "tuesday": { "open": "09:00", "close": "22:00", "isOpen": true },
      "wednesday": { "open": "09:00", "close": "22:00", "isOpen": true },
      "thursday": { "open": "09:00", "close": "22:00", "isOpen": true },
      "friday": { "open": "09:00", "close": "22:00", "isOpen": true },
      "saturday": { "open": "09:00", "close": "22:00", "isOpen": true },
      "sunday": { "open": "10:00", "close": "21:00", "isOpen": true }
    },
    "metadata": {
      "cuisine": ["Nepali", "Indian", "Chinese"],
      "features": ["Outdoor Seating", "WiFi", "Parking"]
    }
  }
}
```

**Response:**
```json
{
  "userId": "uuid-user-id",
  "restaurantId": "uuid-restaurant-id",
  "isNewUser": false,
  "isNewRestaurant": true,
  "message": "User and restaurant synced successfully"
}
```

## 💾 Database Schema

### User Entity

```typescript
@Entity('user')
export class User {
  id: string;                    // UUID (internal)
  phone: string;                 // Unique
  firstName?: string;
  lastName?: string;
  email?: string;                // Unique
  password?: string;             // Nullable for Kaha users
  userType: UserType;            // customer | restaurant_owner | admin | service_account
  authProvider: AuthProvider;    // local | google | facebook | kaha
  isActive: boolean;
  isEmailVerified: boolean;
  isPhoneVerified: boolean;
  
  // Kaha Integration Fields
  externalId?: string;           // Kaha user ID (unique)
  source?: string;               // 'kaha' | 'local'
  metadata?: Record<string, any>;
  
  // Service Account Fields
  serviceAccountName?: string;
  tokenExpiresAt?: Date;
  
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}
```

### Restaurant Entity

```typescript
@Entity('restaurant')
export class Restaurant {
  id: string;                    // UUID (internal)
  restaurantCode: string;        // Unique code (e.g., MOUNTAIN-VIEW-KTM-1234)
  name: string;
  description?: string;
  logoUrl?: string;
  bannerUrl?: string;
  
  // Address
  address?: {
    country?: string;
    state?: string;
    city?: string;
    streetAddress?: string;
    postalCode?: string;
    landmark?: string;
  };
  
  // Contact
  contact?: {
    phones?: string[];
    email?: string;
    website?: string;
  };
  
  // Location
  coordinates?: {
    latitude: number;
    longitude: number;
  };
  
  // Business Hours
  businessHours?: {
    [day: string]: {
      open: string;
      close: string;
      isOpen: boolean;
    };
  };
  
  // Rating
  rating: number;
  totalRatings: number;
  
  // Status
  status: RestaurantStatus;              // active | inactive | trial | suspended
  subscriptionStatus: SubscriptionStatus; // trial | active | expired | cancelled
  subscriptionExpiresAt?: Date;
  
  // Kaha Integration Fields
  externalId?: string;           // Kaha business ID (unique)
  source?: string;               // 'kaha' | 'local'
  metadata?: Record<string, any>;
  
  // Relations
  owner: User;
  ownerId: string;
  menus: Menu[];
  categories: Category[];
  
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}
```

## 🔄 Sync Logic

### User Sync (Create or Update)

```typescript
async syncUser(userDto) {
  // 1. Find user by externalId (Kaha ID)
  let user = await findByExternalId(userDto.externalUserId);
  
  if (user) {
    // User exists → UPDATE
    user.firstName = userDto.firstName;
    user.lastName = userDto.lastName;
    user.email = userDto.email;
    user.phone = userDto.phone;
    user.source = 'kaha';
    user.authProvider = 'kaha';
    return save(user);
  }
  
  // User doesn't exist → CREATE
  user = create({
    externalId: userDto.externalUserId,
    source: 'kaha',
    phone: userDto.phone,
    firstName: userDto.firstName,
    lastName: userDto.lastName,
    email: userDto.email,
    userType: 'restaurant_owner',
    authProvider: 'kaha',
    isActive: true,
    isPhoneVerified: true,
    isEmailVerified: !!userDto.email
  });
  
  return save(user);
}
```

### Restaurant Sync (Create or Update)

```typescript
async syncRestaurant(restaurantDto, owner) {
  // 1. Find restaurant by externalId (Kaha business ID)
  let restaurant = await findByExternalId(restaurantDto.externalRestaurantId);
  
  if (restaurant) {
    // Restaurant exists → UPDATE
    restaurant.name = restaurantDto.name;
    restaurant.description = restaurantDto.description;
    restaurant.address = restaurantDto.address;
    restaurant.contact = restaurantDto.contact;
    restaurant.coordinates = restaurantDto.coordinates;
    restaurant.logoUrl = restaurantDto.logoUrl;
    restaurant.bannerUrl = restaurantDto.bannerUrl;
    restaurant.businessHours = restaurantDto.businessHours;
    restaurant.rating = restaurantDto.rating;
    restaurant.metadata = restaurantDto.metadata;
    restaurant.source = 'kaha';
    restaurant.ownerId = owner.id;
    return save(restaurant);
  }
  
  // Restaurant doesn't exist → CREATE
  const restaurantCode = await generateUniqueCode(restaurantDto.name);
  
  restaurant = create({
    externalId: restaurantDto.externalRestaurantId,
    source: 'kaha',
    restaurantCode,
    name: restaurantDto.name,
    description: restaurantDto.description,
    address: restaurantDto.address,
    contact: restaurantDto.contact,
    coordinates: restaurantDto.coordinates,
    logoUrl: restaurantDto.logoUrl,
    bannerUrl: restaurantDto.bannerUrl,
    businessHours: restaurantDto.businessHours,
    rating: restaurantDto.rating || 0,
    totalRatings: 0,
    status: 'trial',
    subscriptionStatus: 'trial',
    metadata: restaurantDto.metadata,
    ownerId: owner.id,
    owner
  });
  
  return save(restaurant);
}
```

## 📁 File Structure

```
src/
├── entities/
│   ├── user.entity.ts                    ✅ NEW
│   ├── restaurant.entity.ts              ✅ NEW
│   └── index.ts                          ✅ UPDATED
├── repositories/
│   ├── user.repository.ts                ✅ NEW
│   ├── restaurant.repository.ts          ✅ NEW
│   ├── repository.module.ts              ✅ UPDATED
│   └── index.ts                          ✅ UPDATED
├── modules/
│   ├── kaha-sync/                        ✅ NEW MODULE
│   │   ├── dto/
│   │   │   └── sync-user-restaurant.dto.ts
│   │   ├── guards/
│   │   │   └── service-account.guard.ts
│   │   ├── kaha-sync.controller.ts
│   │   ├── kaha-sync.service.ts
│   │   └── kaha-sync.module.ts
│   └── admin/                            ✅ NEW MODULE
│       ├── dto/
│       │   └── create-service-account.dto.ts
│       ├── admin.controller.ts
│       ├── admin.service.ts
│       └── admin.module.ts
└── app.module.ts                         ✅ UPDATED
```

## 🚀 Setup Instructions

### 1. Run Database Migrations

```bash
# Generate migration
npm run migration:generate -- -n AddUserAndRestaurantEntities

# Run migration
npm run migration:run
```

### 2. Create Service Account

```bash
curl -X POST http://localhost:3000/admin/service-accounts \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Kaha Integration",
    "description": "Service account for Kaha main-api-v3",
    "validityDays": 365
  }'
```

**Save the returned token!**

### 3. Configure Kaha Main API

In Kaha Main API v3, configure the Restaurant E-commerce integration:

```typescript
// kaha-main-api-v3 config
const RESTAURANT_ECOMMERCE_CONFIG = {
  baseUrl: 'http://localhost:3000', // or production URL
  serviceAccountToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  syncEndpoint: '/kaha-sync/user-restaurant'
};
```

### 4. Test the Sync

```bash
curl -X POST http://localhost:3000/kaha-sync/user-restaurant \
  -H "Authorization: Bearer YOUR_SERVICE_ACCOUNT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "user": {
      "externalUserId": "kaha-user-test-001",
      "phone": "9801234567",
      "firstName": "Test",
      "lastName": "User",
      "email": "test@example.com"
    },
    "restaurant": {
      "externalRestaurantId": "kaha-business-test-001",
      "name": "Test Restaurant",
      "description": "A test restaurant",
      "address": {
        "country": "Nepal",
        "city": "Kathmandu"
      },
      "contact": {
        "phones": ["9801234567"],
        "email": "test@restaurant.com"
      }
    }
  }'
```

## 🔍 API Endpoints

### Admin Endpoints

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/admin/service-accounts` | Create service account | Admin |
| GET | `/admin/service-accounts` | List service accounts | Admin |
| PATCH | `/admin/service-accounts/:id/deactivate` | Deactivate service account | Admin |

### Kaha Sync Endpoints

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/kaha-sync/user-restaurant` | Sync user and restaurant | Service Account |

## 🔒 Security Considerations

1. **Service Account Tokens**
   - Long-lived (default 365 days)
   - Store securely in Kaha Main API environment variables
   - Rotate periodically
   - Deactivate immediately if compromised

2. **Token Validation**
   - JWT signature verification
   - Token expiration check
   - Service account active status check
   - Type validation (must be 'service_account')

3. **Data Validation**
   - All sync data is validated using DTOs
   - Phone and email uniqueness enforced
   - Prevents duplicate users/restaurants

4. **Audit Trail**
   - All sync operations are logged
   - `source` field tracks data origin ('kaha' vs 'local')
   - `externalId` maintains link to Kaha entities

## 📊 Data Flow Summary

```
┌──────────────────────────────────────────────────────────────┐
│                    DATA FLOW DIRECTION                        │
├──────────────────────────────────────────────────────────────┤
│                                                               │
│  Kaha Main API ────────────▶ Restaurant E-commerce           │
│  (Source of Truth)           (Receives Synced Data)          │
│                                                               │
│  - User management           - Menu management               │
│  - Business management       - Order management              │
│  - Payments                  - Cart management               │
│  - Authentication            - Ratings & Reviews             │
│                                                               │
└──────────────────────────────────────────────────────────────┘
```

## ✅ Implementation Checklist

- [x] User entity with Kaha integration fields
- [x] Restaurant entity with Kaha integration fields
- [x] User repository with externalId lookup
- [x] Restaurant repository with externalId lookup
- [x] Service account authentication system
- [x] Kaha sync service (create/update logic)
- [x] Kaha sync controller with guards
- [x] Admin service for service account management
- [x] Admin controller for service account CRUD
- [x] DTOs for sync requests
- [x] Service account guard for authentication
- [x] Module integration in app.module.ts
- [ ] Database migrations
- [ ] Integration tests
- [ ] Postman collection for testing
- [ ] Kaha Main API integration code

## 🎯 Next Steps

1. **Create Database Migrations**
   ```bash
   npm run migration:generate -- -n AddUserAndRestaurantEntities
   npm run migration:run
   ```

2. **Add Admin Authentication**
   - Implement AdminGuard for service account management endpoints
   - Add role-based access control

3. **Testing**
   - Write unit tests for sync service
   - Write integration tests for sync flow
   - Create Postman collection

4. **Kaha Main API Integration**
   - Add Restaurant E-commerce sync trigger in Kaha
   - Configure service account token
   - Test end-to-end flow

5. **Monitoring & Logging**
   - Add detailed logging for sync operations
   - Set up alerts for sync failures
   - Create dashboard for sync metrics

## 📞 Support

For questions or issues, contact the development team or refer to:
- Kaha Main API v3 documentation
- Restaurant E-commerce API documentation
- HMS Backend implementation (reference architecture)
