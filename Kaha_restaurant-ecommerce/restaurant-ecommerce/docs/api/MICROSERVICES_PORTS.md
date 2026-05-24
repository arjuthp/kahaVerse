# Microservices Architecture - Ports & Services

## 🏗️ Service Architecture

This project uses a **microservices architecture** with 3 separate services:

### 1. 🔐 Authentication Service (Port 5002)
**Base URL:** `http://127.0.0.1:5002/api/v1`

**Endpoints:**
- POST `/auth/register` - Register new customer
- POST `/auth/login` - Login customer
- POST `/auth/refresh` - Refresh token
- POST `/auth/logout` - Logout
- GET `/auth/me` - Get current user

**Purpose:** Handles user authentication, registration, and token management

---

### 2. 👥 Kaha Main V3 (Port 4000 Local / Production)
**Local URL:** `http://127.0.0.1:4000/api/v1`  
**Production URL:** `https://api.kaha.com/v3`

**Endpoints:**
- GET `/users/{userId}` - Get user details
- GET `/businesses/{businessId}` - Get business details
- GET `/business-users/{businessId}/{userId}` - Get user roles in business

**Purpose:** Central user and business management service

**Note:** For testing, you can use the **production URL** instead of running locally.

---

### 3. 🍽️ Restaurant E-commerce (Port 3001)
**Base URL:** `http://127.0.0.1:3001/api/v1`

**Endpoints:**
- Categories, Menu, Addons, Addon Groups
- Cart, Orders
- Menu Ratings

**Purpose:** Restaurant-specific operations (menu, orders, cart)

**Dependencies:** 
- Requires Kaha Main V3 (production or local) for user/business validation
- Uses JWT tokens from Authentication Service (port 5002)

---

## 🔄 Service Dependencies

```
┌─────────────────────┐
│ Authentication      │
│ Service (5002)      │
│ - Register          │
│ - Login             │
│ - Get Tokens        │
└──────────┬──────────┘
           │ JWT Token
           ▼
┌─────────────────────┐      ┌─────────────────────┐
│ Restaurant          │◄─────┤ Kaha Main V3        │
│ E-commerce (3001)   │      │ (4000)              │
│ - Menu              │      │ - User Validation   │
│ - Cart              │      │ - Business Data     │
│ - Orders            │      └─────────────────────┘
└─────────────────────┘
```

---

## 📋 Postman Variables

### For Authentication Service (Port 5002)
```
authBaseUrl: http://127.0.0.1:5002/api/v1
```

### For Restaurant E-commerce (Port 3001)
```
baseUrl: http://127.0.0.1:3001/api/v1
```

### For Kaha Main V3 (Port 4000)
```
kahaMainUrl: http://127.0.0.1:4000/api/v1
```

---

## 🚀 Starting All Services

### Option A: Use Production Kaha Main V3 (Recommended for Testing)

```bash
# Terminal 1: Authentication Service (Port 5002)
cd /path/to/auth-service
npm run dev

# Terminal 2: Restaurant Service (Port 3001)
cd /home/kali/Documents/KAHA_Verse/Kaha_restaurant-ecommerce/restaurant-ecommerce
npm run dev
```

**Note:** With production URL configured in `.env`, you don't need to run Kaha Main V3 locally.

### Option B: Run All Services Locally

```bash
# Terminal 1: Kaha Main V3 (Port 4000)
cd /home/kali/Documents/KAHA_Verse/kaha-main-api-v3
npm run dev

# Terminal 2: Authentication Service (Port 5002)
cd /path/to/auth-service
npm run dev

# Terminal 3: Restaurant Service (Port 3001)
cd /home/kali/Documents/KAHA_Verse/Kaha_restaurant-ecommerce/restaurant-ecommerce
# Update .env to use local URLs first
npm run dev
```

---

## ✅ Testing Workflow

### Step 1: Register/Login (Port 5002)
```
POST http://127.0.0.1:5002/api/v1/auth/register
POST http://127.0.0.1:5002/api/v1/auth/login
```
**Result:** Get JWT token

### Step 2: Use Token for Restaurant Operations (Port 3001)
```
Authorization: Bearer {token from step 1}
POST http://127.0.0.1:3001/api/v1/cart
GET http://127.0.0.1:3001/api/v1/menu
```

### Step 3: Restaurant Service Validates with Kaha Main (Port 4000)
```
(Automatic - Restaurant service calls Kaha Main internally)
GET http://127.0.0.1:4000/api/v1/users/{userId}
```

---

## ⚠️ Common Issues

### Issue: "ECONNREFUSED 127.0.0.1:4000"
**Solution:** 
- **Option 1 (Recommended):** Use production URL in `.env`:
  ```env
  KAH_API_V3_BASE_URL=https://api.kaha.com/v3
  ```
- **Option 2:** Start Kaha Main V3 service locally on port 4000

### Issue: "ECONNREFUSED 127.0.0.1:5002"
**Solution:** Start Authentication service on port 5002

### Issue: "401 Unauthorized"
**Solution:** Get fresh token from Authentication service (port 5002)

---

## 🔑 Mock Data

### Mock User (for testing)
- **User ID:** `user-mock-001`
- **Business ID:** `biz-mock-001`
- **Email:** `user@test.com`

### Mock Admin (for testing)
- **User ID:** `admin-mock-001`
- **Business ID:** `biz-mock-001`
- **Email:** `admin@test.com`
- **Role:** `BUSINESS_SUPER_ADMIN`

---

## 📝 Notes

1. **All 3 services must be running** for full functionality
2. **Authentication service** provides JWT tokens
3. **Kaha Main V3** validates users and businesses
4. **Restaurant E-commerce** handles restaurant operations
5. Use **127.0.0.1** instead of **localhost** in Postman to avoid connection issues
