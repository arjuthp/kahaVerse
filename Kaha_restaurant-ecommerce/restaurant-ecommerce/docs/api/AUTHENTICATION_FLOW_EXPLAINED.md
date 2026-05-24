# Authentication Flow - Complete Explanation

## 🔐 How Authentication Works in This System

### Architecture Overview

This **Restaurant E-commerce microservice** does **NOT handle user login/registration**. Instead, it relies on an **external authentication service** (Kaha Main V3 API).

```
┌─────────────────────────────────────────────────────────────┐
│                    AUTHENTICATION FLOW                       │
└─────────────────────────────────────────────────────────────┘

1. User Login (External)
   ↓
   [Kaha Main V3 API]
   https://restaurant.kaha.com.np/api/auth/login
   ↓
   Returns: JWT Token + User Info
   ↓
2. User Makes Request to Restaurant API
   ↓
   [Restaurant E-commerce API]
   http://localhost:3001/api/v1/categories
   Headers: Authorization: Bearer <JWT_TOKEN>
   ↓
3. JWT Validation (Internal)
   ↓
   [JwtStrategy validates token using JWT_SECRET]
   ↓
4. Role/Permission Check (External)
   ↓
   [Service Communication calls Kaha Main V3]
   https://restaurant.kaha.com.np/api/users/{userId}
   https://restaurant.kaha.com.np/api/business-users/{businessId}/{userId}
   ↓
5. Request Processed
```

---

## 📍 API Endpoints Being Hit

### 1. **Login Endpoint (Postman Collection)**
**URL**: `https://restaurant.kaha.com.np/api/auth/login`
**Method**: POST
**Purpose**: Get JWT token for authentication
**Request Body**:
```json
{
  "email": "owner@kahastays.com",
  "password": "password123"
}
```
**Response**:
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "00000000-0000-4000-a000-000000000010",
    "email": "owner@kahastays.com",
    "role": "OWNER"
  }
}
```

**This endpoint is in**: Kaha Main V3 API (External service)
**Not in this codebase**: This restaurant service doesn't have login endpoints

---

### 2. **Restaurant API Endpoints (This Codebase)**
**Base URL**: `http://localhost:3001/api/v1` (Local development)
**Production URL**: Would be deployed separately

**Example Endpoints**:
- `GET /api/v1/categories/{businessId}` - Get categories
- `POST /api/v1/categories` - Create category (requires auth)
- `GET /api/v1/menu` - Get menu items
- `POST /api/v1/cart` - Add to cart

**Authentication**: All protected endpoints require:
```
Authorization: Bearer <JWT_TOKEN_FROM_KAHA_MAIN>
```

---

### 3. **User/Business Verification Endpoints (External)**
**Base URL**: `https://restaurant.kaha.com.np/api` (from `KAH_API_V3_BASE_URL`)

The restaurant service calls these endpoints to verify users/permissions:

#### a) Get User Info
**URL**: `https://restaurant.kaha.com.np/api/users/{userId}`
**Method**: GET
**Called by**: `ServiceCommunicationService.getUser()`
**Purpose**: Verify user exists and get user details

#### b) Get User Roles
**URL**: `https://restaurant.kaha.com.np/api/users/{userId}`
**Method**: GET
**Called by**: `ServiceCommunicationService.getUserRoles()`
**Purpose**: Check user's global role (CUSTOMER, STAFF, ADMIN)

#### c) Get Business User Roles
**URL**: `https://restaurant.kaha.com.np/api/business-users/{businessId}/{userId}`
**Method**: GET
**Called by**: `ServiceCommunicationService.getBusinessUserRoles()`
**Purpose**: Check user's role within a specific business (STAFF, MANAGER, ADMIN)

#### d) Get Business Info
**URL**: `https://restaurant.kaha.com.np/api/businesses/{businessId}`
**Method**: GET
**Called by**: `ServiceCommunicationService.getBusiness()`
**Purpose**: Verify business exists and get business details

---

## 🔑 JWT Token Flow

### Token Generation (External - Kaha Main V3)
```typescript
// User logs in at Kaha Main V3
POST https://restaurant.kaha.com.np/api/auth/login
{
  "email": "owner@kahastays.com",
  "password": "password123"
}

// Kaha Main V3 generates JWT with payload:
{
  "id": "00000000-0000-4000-a000-000000000010",
  "kahaId": "KAHA123",
  "businessId": "00000000-0000-4000-a000-000000000100",
  "iat": 1234567890,
  "exp": 1234567890
}

// Signed with JWT_SECRET (must match in both services)
```

### Token Validation (This Service)
```typescript
// File: src/modules/auth/strategy/jwt.strategy.ts

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly configService: ConfigurationService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.jwtSecret, // Must match Kaha Main V3
    });
  }

  async validate(payload: PayloadInterface) {
    const { id, kahaId, businessId } = payload;
    return { id, kahaId, businessId };
  }
}
```

**Critical**: The `JWT_SECRET_TOKEN` in `.env` must match the secret used by Kaha Main V3 to sign tokens.

---

## 🔄 Complete Request Flow Example

### Scenario: Owner Creates a Category

```
STEP 1: Login (Postman → Kaha Main V3)
┌─────────────────────────────────────────────────────────┐
│ POST https://restaurant.kaha.com.np/api/auth/login     │
│ Body: { email: "owner@kahastays.com", password: "..." }│
└─────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────┐
│ Response: { token: "eyJhbG...", user: {...} }          │
│ Postman saves token to environment variable: authToken │
└─────────────────────────────────────────────────────────┘

STEP 2: Create Category (Postman → Restaurant API)
┌─────────────────────────────────────────────────────────┐
│ POST http://localhost:3001/api/v1/categories           │
│ Headers: Authorization: Bearer {{authToken}}           │
│ Body: { name: "Burgers", businessId: "...", ... }     │
└─────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────┐
│ Restaurant API receives request                         │
│ → JwtStrategy extracts token from Authorization header │
│ → Validates token using JWT_SECRET                     │
│ → Extracts payload: { id, kahaId, businessId }        │
└─────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────┐
│ Category Controller checks permissions                  │
│ → Calls ServiceCommunicationService                    │
│ → GET https://restaurant.kaha.com.np/api/              │
│   business-users/{businessId}/{userId}                 │
│ → Verifies user has OWNER/ADMIN role                   │
└─────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────┐
│ If authorized:                                          │
│ → Creates category in local database                   │
│ → Returns 201 Created                                  │
└─────────────────────────────────────────────────────────┘
```

---

## 🌐 Production vs Development URLs

### Development (Local)
```env
# Restaurant API runs locally
APP_PORT=3001
baseUrl=http://localhost:3001/api/v1

# Kaha Main V3 API (Production)
KAHA_API_LINK=https://restaurant.kaha.com.np/api
KAH_API_V3_BASE_URL=https://restaurant.kaha.com.np/api
```

### Production (Deployed)
```env
# Restaurant API would be deployed to:
# https://restaurant-api.kaha.com.np/api/v1 (example)

# Kaha Main V3 API (Same)
KAHA_API_LINK=https://restaurant.kaha.com.np/api
KAH_API_V3_BASE_URL=https://restaurant.kaha.com.np/api
```

---

## 🔧 Configuration Files

### 1. `.env` (Backend Configuration)
```env
# This service's port
APP_PORT=3001

# JWT Secret (MUST match Kaha Main V3)
JWT_SECRET_TOKEN=secret

# External Auth Service URLs
KAHA_API_LINK=https://restaurant.kaha.com.np/api
KAH_API_V3_BASE_URL=https://restaurant.kaha.com.np/api
```

### 2. Postman Environment
```json
{
  "baseUrl": "http://localhost:3001/api/v1",  // Restaurant API (local)
  "kahaMainV3Url": "https://restaurant.kaha.com.np/api",  // Auth API (production)
  "authToken": "GET_FROM_KAHA_MAIN_V3_LOGIN",
  "ownerEmail": "owner@kahastays.com",
  "ownerPassword": "password123"
}
```

### 3. Postman Collection Login Requests
```json
{
  "name": "LOGIN - Owner",
  "request": {
    "method": "POST",
    "url": "https://restaurant.kaha.com.np/api/auth/login",
    "body": {
      "email": "{{ownerEmail}}",
      "password": "{{ownerPassword}}"
    }
  }
}
```

---

## ❓ Common Issues & Solutions

### Issue 1: "ENOTFOUND api.kaha.com"
**Cause**: Old URL `https://api.kaha.com/v3` doesn't exist
**Solution**: ✅ Fixed - Updated to `https://restaurant.kaha.com.np/api`

### Issue 2: "Unauthorized" or "Invalid Token"
**Possible Causes**:
1. JWT_SECRET mismatch between services
2. Token expired
3. Wrong credentials used for login

**Solution**:
```bash
# Check JWT_SECRET in .env matches Kaha Main V3
JWT_SECRET_TOKEN=secret

# Re-login to get fresh token
POST https://restaurant.kaha.com.np/api/auth/login
```

### Issue 3: "User not found" or "Business not found"
**Cause**: ServiceCommunicationService can't reach Kaha Main V3 API
**Solution**:
```bash
# Verify URLs in .env
KAHA_API_LINK=https://restaurant.kaha.com.np/api
KAH_API_V3_BASE_URL=https://restaurant.kaha.com.np/api

# Test connectivity
curl https://restaurant.kaha.com.np/api/health
```

### Issue 4: "Forbidden" - User has valid token but can't perform action
**Cause**: User doesn't have required role/permissions
**Solution**:
- Check user's role in Kaha Main V3 database
- Verify business_user relationship exists
- Ensure user is assigned to the correct business

---

## 📝 Summary

### What This Service Does:
✅ Validates JWT tokens (using shared secret)
✅ Manages restaurant-specific data (categories, menu, orders)
✅ Calls Kaha Main V3 API to verify user/business info

### What This Service Does NOT Do:
❌ User registration
❌ User login
❌ Password management
❌ Token generation

### Key URLs:
- **Login**: `https://restaurant.kaha.com.np/api/auth/login` (Kaha Main V3)
- **Restaurant API**: `http://localhost:3001/api/v1/*` (This service)
- **User Verification**: `https://restaurant.kaha.com.np/api/users/*` (Kaha Main V3)
- **Business Verification**: `https://restaurant.kaha.com.np/api/business-users/*` (Kaha Main V3)

### Critical Configuration:
1. `JWT_SECRET_TOKEN` must match between services
2. `KAH_API_V3_BASE_URL` must point to Kaha Main V3 API
3. Postman login requests must use `kahaMainV3Url`
4. Postman CRUD requests must use `baseUrl` (local restaurant API)
