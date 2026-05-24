# 🧪 Mock Authentication Guide

## Overview

This guide explains how to use **mock authentication** for development and testing without calling the external KAHA Main V3 API.

---

## 🎯 Why Mock Auth?

### Problems with Real Auth in Development:
- ❌ Requires external KAHA Main V3 API to be running
- ❌ Network dependency (fails if API is down)
- ❌ Slower tests (HTTP calls add latency)
- ❌ Harder to test edge cases (need real users/businesses)
- ❌ Can't work offline

### Benefits of Mock Auth:
- ✅ **No external dependencies** - Works offline
- ✅ **Fast** - No HTTP calls, instant responses
- ✅ **Reliable** - No network failures
- ✅ **Easy testing** - Predefined users and roles
- ✅ **Development friendly** - No need for production credentials

---

## 🔧 Setup

### Step 1: Enable Mock Auth

Edit your `.env` file:

```env
# Set to true for development/testing
USE_MOCK_AUTH=true

# Set to false for production
# USE_MOCK_AUTH=false
```

### Step 2: Restart Your Server

```bash
npm run start:dev
```

You should see this log message:
```
🧪 MOCK AUTH ENABLED - Using mock data instead of KAHA Main V3 API
```

---

## 👥 Mock Users

### Available Mock Users:

| User ID | Role | Business ID | Email | Use Case |
|---------|------|-------------|-------|----------|
| `user-mock-001` | `user` | `biz-mock-001` | user@test.com | Regular customer |
| `admin-mock-001` | `business_super_admin` | `biz-mock-001` | admin@test.com | Business admin |
| `owner-mock-001` | `business_super_admin` | `biz-mock-001` | owner@test.com | Business owner |

### Mock Business:

| Business ID | Name | Description |
|-------------|------|-------------|
| `biz-mock-001` | Test Restaurant | Mock restaurant for testing |

---

## 🔑 Mock JWT Tokens

### Pre-generated Tokens (Valid for 30 days):

#### Regular User Token:
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6InVzZXItbW9jay0wMDEiLCJrYWhhSWQiOiJrYWhhLW1vY2stMDAxIiwiYnVzaW5lc3NJZCI6ImJpei1tb2NrLTAwMSIsImVtYWlsIjoidXNlckB0ZXN0LmNvbSIsInJvbGUiOiJVU0VSIiwiaWF0IjoxNzc5MjQzNTU5LCJleHAiOjE3ODE4MzU1NTl9.bPgJV73sIYKBXCep5nd_ANx2HPU5L_0vo0yWirSbz1s
```

#### Admin Token:
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImFkbWluLW1vY2stMDAxIiwia2FoYUlkIjoia2FoYS1hZG1pbi0wMDEiLCJidXNpbmVzc0lkIjoiYml6LW1vY2stMDAxIiwiZW1haWwiOiJhZG1pbkB0ZXN0LmNvbSIsInJvbGUiOiJCVVNJTkVTU19TVVBFUl9BRE1JTiIsImlhdCI6MTc3OTI0MzU1OSwiZXhwIjoxNzgxODM1NTU5fQ.bgpNW3hddZ86L41Yyam_JrbupoCjkKn7CclEUFgvPaY
```

#### Owner Token:
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6Im93bmVyLW1vY2stMDAxIiwia2FoYUlkIjoia2FoYS1vd25lci0wMDEiLCJidXNpbmVzc0lkIjoiYml6LW1vY2stMDAxIiwiZW1haWwiOiJvd25lckB0ZXN0LmNvbSIsInJvbGUiOiJCVVNJTkVTU19PV05FUiIsImlhdCI6MTc3OTI0MzU1OSwiZXhwIjoxNzgxODM1NTU5fQ._eOxUtrqWRe7M7jwhZRu2myJrx3Cm6e-cBedMDrCmo8
```

### Generate New Tokens:

If you need fresh tokens:

```bash
node scripts/generate-mock-tokens.js
```

---

## 📮 Using Mock Auth in Postman

### Option 1: Use Pre-configured Environment (Recommended)

1. **Import Environment:**
   - File: `postman/Kaha-Restaurant-Environment.postman_environment.json`
   - Already contains mock tokens!

2. **Select Environment:**
   - In Postman, select "Kaha Restaurant - Production Credentials"

3. **Test:**
   - The `authToken` variable is already set to admin token
   - Just send requests - no login needed!

### Option 2: Manual Setup

1. **Set Variables:**
   ```
   authToken = <copy admin token from above>
   userId = admin-mock-001
   businessId = biz-mock-001
   ```

2. **Use in Requests:**
   - Authorization: Bearer Token
   - Token: `{{authToken}}`

---

## 🧪 Testing Different Roles

### Test as Regular User:

```bash
# In Postman, set:
authToken = {{regularUserToken}}
```

**Expected behavior:**
- ✅ Can view menu, categories
- ✅ Can add to cart, place orders
- ❌ Cannot create/update menu items
- ❌ Cannot manage categories

### Test as Admin:

```bash
# In Postman, set:
authToken = {{adminToken}}
```

**Expected behavior:**
- ✅ Can do everything regular user can
- ✅ Can create/update/delete menu items
- ✅ Can manage categories, addons
- ✅ Full business management access

---

## 🔄 How Mock Auth Works

### Request Flow with Mock Auth:

```
1. Request arrives with JWT token
   ↓
2. JwtAuthGuard validates token signature ✅
   (Uses JWT_SECRET_TOKEN from .env)
   ↓
3. Token decoded: { id: "admin-mock-001", businessId: "biz-mock-001" }
   ↓
4. RolesGuard checks permissions
   ↓
5. ServiceCommunicationService.getBusinessUserRoles()
   ↓
6. 🧪 MOCK MODE ENABLED
   ↓
7. Returns mock data from memory (no HTTP call!)
   {
     userId: "admin-mock-001",
     businessId: "biz-mock-001",
     role: "business_super_admin"
   }
   ↓
8. Request authorized ✅
```

### Code Location:

**File:** `src/modules/service-communication/service-communication.service.ts`

```typescript
async getBusinessUserRoles(businessId: string, userId: string) {
  // Check if mock mode is enabled
  if (this.useMockAuth) {
    // Return mock data from memory
    const mockUser = this.mockUsers[userId];
    return {
      userId: mockUser.id,
      businessId: businessId,
      role: mockUser.role
    };
  }
  
  // Otherwise, call real KAHA Main V3 API
  const response = await this.httpService.get(url);
  return response.data;
}
```

---

## 🎯 Testing Scenarios

### Scenario 1: Create a Category (Admin Required)

```bash
POST http://localhost:3001/api/v1/categories
Authorization: Bearer {{adminToken}}

Body:
{
  "name": "Appetizers",
  "description": "Starter dishes",
  "businessId": "biz-mock-001"
}
```

**Expected:** ✅ 201 Created

### Scenario 2: Create a Category (Regular User)

```bash
POST http://localhost:3001/api/v1/categories
Authorization: Bearer {{regularUserToken}}

Body:
{
  "name": "Appetizers",
  "description": "Starter dishes",
  "businessId": "biz-mock-001"
}
```

**Expected:** ❌ 403 Forbidden

### Scenario 3: View Categories (Public)

```bash
GET http://localhost:3001/api/v1/categories/biz-mock-001
# No authorization needed
```

**Expected:** ✅ 200 OK

---

## 🐛 Troubleshooting

### Issue 1: "Unauthorized" Error

**Symptoms:**
```json
{
  "statusCode": 401,
  "message": "Unauthorized"
}
```

**Causes:**
1. Token is missing
2. Token is invalid/expired
3. JWT_SECRET_TOKEN mismatch

**Solutions:**
```bash
# 1. Check token is set in Postman
authToken = <your-token>

# 2. Generate new token
node scripts/generate-mock-tokens.js

# 3. Verify JWT_SECRET_TOKEN in .env
JWT_SECRET_TOKEN=secret
```

### Issue 2: "Forbidden" Error

**Symptoms:**
```json
{
  "statusCode": 403,
  "message": "Forbidden resource"
}
```

**Cause:** User doesn't have required role

**Solution:**
```bash
# Use admin token for admin operations
authToken = {{adminToken}}

# Use regular user token for user operations
authToken = {{regularUserToken}}
```

### Issue 3: Mock Auth Not Working

**Symptoms:**
- Still getting "Failed to fetch business user role"
- Logs don't show "🧪 MOCK AUTH ENABLED"

**Solutions:**
```bash
# 1. Check .env file
USE_MOCK_AUTH=true

# 2. Restart server
npm run start:dev

# 3. Check logs for:
🧪 MOCK AUTH ENABLED - Using mock data instead of KAHA Main V3 API
```

### Issue 4: Wrong Business ID

**Symptoms:**
- Can't find categories/menu items
- Empty responses

**Solution:**
```bash
# Use the correct mock business ID
businessId = biz-mock-001

# Check database has data for this business
SELECT * FROM category WHERE "businessId" = 'biz-mock-001';
```

---

## 🔄 Switching Between Mock and Real Auth

### Development (Mock Auth):

```env
# .env
USE_MOCK_AUTH=true
```

```bash
npm run start:dev
```

### Production (Real Auth):

```env
# .env
USE_MOCK_AUTH=false
KAH_API_V3_BASE_URL=https://api.kaha.com.np
```

```bash
npm run start:prod
```

---

## 📝 Adding New Mock Users

### Step 1: Update ServiceCommunicationService

**File:** `src/modules/service-communication/service-communication.service.ts`

```typescript
private readonly mockUsers = {
  // Existing users...
  
  // Add new user
  'manager-mock-001': {
    id: 'manager-mock-001',
    kahaId: 'kaha-manager-001',
    email: 'manager@test.com',
    role: 'admin',
    businessId: 'biz-mock-001'
  }
};
```

### Step 2: Generate Token

**File:** `scripts/generate-mock-tokens.js`

```javascript
const mockUsers = {
  // Existing users...
  
  // Add new user
  manager: {
    id: 'manager-mock-001',
    kahaId: 'kaha-manager-001',
    businessId: 'biz-mock-001',
    email: 'manager@test.com',
    role: 'ADMIN'
  }
};
```

### Step 3: Generate and Use

```bash
node scripts/generate-mock-tokens.js
# Copy the new token to Postman
```

---

## ✅ Best Practices

1. **Always use mock auth in development**
   - Faster development cycle
   - No external dependencies

2. **Use admin token for testing CRUD operations**
   - Most operations require admin role
   - Saves time switching tokens

3. **Test with different roles**
   - Verify authorization works correctly
   - Test both success and failure cases

4. **Keep mock data aligned with database**
   - Use `biz-mock-001` consistently
   - Ensure database has matching data

5. **Disable mock auth in production**
   - Set `USE_MOCK_AUTH=false`
   - Use real KAHA Main V3 API

---

## 📚 Related Documentation

- [Complete Testing Guide](./COMPLETE_TESTING_GUIDE.md)
- [Authentication Flow](../api/AUTHENTICATION_FLOW_EXPLAINED.md)
- [Postman Setup](./POSTMAN_TESTS_INDEX.md)
- [API Endpoints](../api/API_ENDPOINTS.md)

---

## 🎉 Quick Start Checklist

- [ ] Set `USE_MOCK_AUTH=true` in `.env`
- [ ] Restart server (`npm run start:dev`)
- [ ] Import Postman environment
- [ ] Verify `authToken` is set to admin token
- [ ] Test a protected endpoint (e.g., create category)
- [ ] See "🧪 Mock:" logs in console

**You're ready to test!** 🚀
