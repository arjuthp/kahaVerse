# 🔍 Authentication & API Integration Debug Report

## Problem Summary
You're experiencing authentication failures when trying to integrate the restaurant e-commerce backend with Kaha Main V3 for external user/business role verification.

---

## 🚨 Issues Found

### 1. **Mock Auth is Enabled (Should be Disabled for Production)**
**Location:** `.env` file
```env
USE_MOCK_AUTH=true  # ❌ This bypasses external API verification
```

**Impact:** When `USE_MOCK_AUTH=true`, the system uses JWT payload for role verification instead of calling Kaha Main V3 API.

---

### 2. **Incorrect Kaha Main V3 Base URL**
**Location:** `.env` file
```env
KAH_API_V3_BASE_URL=https://api.kaha.com.np  # ❌ Missing API path
```

**Should be:**
```env
KAH_API_V3_BASE_URL=https://api.kaha.com.np/main/api/v3
```

**Impact:** API calls fail because the endpoint path is incomplete.

---

### 3. **JWT Payload Missing Role Field**
**Location:** `src/common/interfaces/payload.interface.ts`

**Current:**
```typescript
export interface PayloadInterface {
  id: string;
  kahaId: string;
  businessId?: string;
  // ❌ Missing: role field
}
```

**Impact:** When mock auth is enabled, the guard looks for `req.user.role` but it doesn't exist in the JWT payload structure.

---

### 4. **JWT Strategy Not Extracting Role**
**Location:** `src/modules/auth/strategy/jwt.strategy.ts`

**Current:**
```typescript
async validate(payload: PayloadInterface) {
  const { id, kahaId, businessId } = payload;
  return { id, kahaId, businessId };  // ❌ Not extracting role
}
```

---

### 5. **Service Communication API Endpoints**
**Location:** `src/modules/service-communication/service-communication.service.ts`

The service correctly constructs URLs like:
- `${baseUrl}/business-users/${businessId}/${userId}`
- `${baseUrl}/users/${userId}`
- `${baseUrl}/businesses/${businessId}`

But if `baseUrl` is wrong, all calls fail.

---

## ✅ Solutions

### Solution 1: Update `.env` for Production Mode

**File:** `/home/kali/Documents/KAHA_Verse/Kaha_restaurant-ecommerce/restaurant-ecommerce/.env`

```env
APP_PORT=3001

# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=kaha_restaurant_db
DB_USER_NAME=postgres
DB_PASSWORD=postgres

# JWT_SECRET_TOKENS — must match Kaha Main V3 JWT secret
JWT_SECRET_TOKEN=secret

# ✅ DISABLE Mock Auth for Production
USE_MOCK_AUTH=false

# ✅ Correct Kaha Main V3 API Base URL
KAHA_API_LINK=https://api.kaha.com.np
KAH_API_V3_BASE_URL=https://api.kaha.com.np/main/api/v3
```

---

### Solution 2: Update JWT Payload Interface

**File:** `src/common/interfaces/payload.interface.ts`

```typescript
export interface PayloadInterface {
  id: string;
  kahaId: string;
  businessId?: string;
  role?: string;  // ✅ Add role field for mock auth support
}
```

---

### Solution 3: Update JWT Strategy to Extract Role

**File:** `src/modules/auth/strategy/jwt.strategy.ts`

```typescript
async validate(payload: PayloadInterface) {
  const { id, kahaId, businessId, role } = payload;
  return { id, kahaId, businessId, role };  // ✅ Include role
}
```

---

## 🧪 Testing the Fix

### Step 1: Verify Environment Variables
```bash
cd /home/kali/Documents/KAHA_Verse/Kaha_restaurant-ecommerce/restaurant-ecommerce
cat .env | grep -E "USE_MOCK_AUTH|KAH_API_V3_BASE_URL"
```

**Expected Output:**
```
USE_MOCK_AUTH=false
KAH_API_V3_BASE_URL=https://api.kaha.com.np/main/api/v3
```

---

### Step 2: Restart Backend
```bash
cd /home/kali/Documents/KAHA_Verse/Kaha_restaurant-ecommerce/restaurant-ecommerce
npm run dev
```

**Look for log:**
```
🔒 Production Mode: Role verification will use external Kaha Main V3 API
```

---

### Step 3: Test Authentication Flow

#### A. Get JWT Token from Kaha Main V3
```bash
curl -X POST https://api.kaha.com.np/main/api/v3/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@kahastays.com",
    "password": "password123"
  }'
```

**Save the `access_token` from response.**

---

#### B. Test Protected Endpoint (Create Menu - Admin Only)
```bash
curl -X POST http://localhost:3001/api/v1/menu \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE" \
  -d '{
    "name": "Test Burger",
    "description": "Test item",
    "price": 500,
    "categoryId": "CATEGORY_UUID_HERE"
  }'
```

---

### Step 4: Check Backend Logs

**Look for these debug logs:**
```
[RolesGuard] Required roles: ["business_super_admin"]
[RolesGuard] User ID: xxx, Business ID: yyy
[RolesGuard] Business user role: {...}
[RolesGuard] Comparing: business_super_admin with ["business_super_admin"]
[RolesGuard] Has required role: true
```

---

## 🔑 Understanding the Authentication Flow

### Production Mode (`USE_MOCK_AUTH=false`)

```
1. User logs in to Kaha Main V3
   ↓
2. Receives JWT token with payload: { id, kahaId, businessId }
   ↓
3. User makes request to Restaurant API with JWT
   ↓
4. JwtAuthGuard validates JWT signature
   ↓
5. RolesGuard calls Kaha Main V3 API:
   GET /business-users/{businessId}/{userId}
   ↓
6. Kaha Main V3 returns: { role: { name: "business_super_admin" } }
   ↓
7. RolesGuard compares role with required roles
   ↓
8. Access granted/denied
```

---

### Mock Mode (`USE_MOCK_AUTH=true`)

```
1. User has JWT with payload: { id, kahaId, businessId, role }
   ↓
2. User makes request to Restaurant API with JWT
   ↓
3. JwtAuthGuard validates JWT signature
   ↓
4. RolesGuard reads role from req.user.role (no external API call)
   ↓
5. RolesGuard compares role with required roles
   ↓
6. Access granted/denied
```

---

## 🎯 Role Mapping

### Kaha Main V3 Roles → Restaurant E-Commerce Roles

| Kaha Main V3 | Restaurant E-Commerce | Access Level |
|--------------|----------------------|--------------|
| `admin` | `ADMIN` | System-wide admin |
| `business_super_admin` | `BUSINESS_SUPER_ADMIN` | Business owner/manager |
| `user` | `USER` | Customer |

---

## 🔧 Common Issues & Solutions

### Issue: "Failed to fetch business user role"
**Cause:** Incorrect `KAH_API_V3_BASE_URL` or network issue
**Solution:** Verify URL includes `/main/api/v3` path

---

### Issue: "Has required role: false"
**Cause:** Role mismatch between Kaha Main V3 and Restaurant API
**Solution:** Check role name in Kaha Main V3 response matches enum values

---

### Issue: "No role found in JWT payload" (Mock Mode)
**Cause:** JWT doesn't include role field
**Solution:** Either disable mock mode or ensure JWT includes role

---

### Issue: 401 Unauthorized
**Cause:** JWT token expired or invalid
**Solution:** Get fresh token from Kaha Main V3 login endpoint

---

## 📝 API Endpoints Reference

### Kaha Main V3 Endpoints Used

1. **Login** (to get JWT)
   ```
   POST https://api.kaha.com.np/main/api/v3/auth/login
   ```

2. **Get Business User Role**
   ```
   GET https://api.kaha.com.np/main/api/v3/business-users/{businessId}/{userId}
   Headers: Authorization: Bearer {token}
   ```

3. **Get User Info**
   ```
   GET https://api.kaha.com.np/main/api/v3/users/{userId}
   Headers: Authorization: Bearer {token}
   ```

4. **Get Business Info**
   ```
   GET https://api.kaha.com.np/main/api/v3/businesses/{businessId}
   Headers: Authorization: Bearer {token}
   ```

---

## 🚀 Next Steps

1. ✅ Update `.env` file with correct settings
2. ✅ Update `PayloadInterface` to include role field
3. ✅ Update `jwt.strategy.ts` to extract role
4. ✅ Restart backend server
5. ✅ Test with production Kaha Main V3 credentials
6. ✅ Monitor logs for successful role verification

---

## 📞 Support

If issues persist:
1. Check backend logs: `npm run dev` output
2. Verify Kaha Main V3 API is accessible: `curl https://api.kaha.com.np/main/api/v3/health`
3. Confirm JWT token is valid: Decode at jwt.io
4. Check database connection: Ensure PostgreSQL is running

---

**Generated:** $(date)
**Status:** Ready for implementation
