# 🧪 Authentication & API Integration Testing Guide

## Prerequisites

1. ✅ Backend fixes applied (`.env`, `PayloadInterface`, `jwt.strategy.ts`)
2. ✅ Kaha Main V3 production API accessible at `https://api.kaha.com.np/main/api/v3`
3. ✅ Valid credentials for Kaha Main V3

---

## Step 1: Verify Configuration

### Check Environment Variables
```bash
cd /home/kali/Documents/KAHA_Verse/Kaha_restaurant-ecommerce/restaurant-ecommerce
cat .env | grep -E "USE_MOCK_AUTH|KAH_API_V3_BASE_URL|KAHA_API_LINK"
```

**Expected Output:**
```
USE_MOCK_AUTH=false
KAHA_API_LINK=https://api.kaha.com.np
KAH_API_V3_BASE_URL=https://api.kaha.com.np/main/api/v3
```

---

## Step 2: Test Kaha Main V3 API Connectivity

### Test 1: Health Check (if available)
```bash
curl -v https://api.kaha.com.np/main/api/v3/health
```

### Test 2: Login to Kaha Main V3
```bash
curl -X POST https://api.kaha.com.np/main/api/v3/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@kahastays.com",
    "password": "password123"
  }' | jq
```

**Expected Response:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "00000000-0000-4000-a000-000000000011",
    "email": "admin@kahastays.com",
    "fullName": "Admin User",
    "role": "admin"
  }
}
```

**Save the `access_token` - you'll need it for all subsequent tests!**

---

## Step 3: Decode JWT Token

### Option A: Using jwt.io
1. Go to https://jwt.io
2. Paste your token
3. Check the payload contains: `id`, `kahaId`, `businessId`

### Option B: Using command line
```bash
# Install jq if not available
# Extract payload (middle part of JWT)
TOKEN="YOUR_TOKEN_HERE"
echo $TOKEN | cut -d'.' -f2 | base64 -d | jq
```

**Expected Payload:**
```json
{
  "id": "00000000-0000-4000-a000-000000000011",
  "kahaId": "KAHA-12345",
  "businessId": "00000000-0000-4000-a000-000000000100",
  "iat": 1234567890,
  "exp": 1234567890
}
```

---

## Step 4: Test Kaha Main V3 Role Verification Endpoints

### Test 3: Get User Info
```bash
TOKEN="YOUR_TOKEN_HERE"

curl -X GET "https://api.kaha.com.np/main/api/v3/users/00000000-0000-4000-a000-000000000011" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" | jq
```

**Expected Response:**
```json
{
  "id": "00000000-0000-4000-a000-000000000011",
  "email": "admin@kahastays.com",
  "fullName": "Admin User",
  "role": "admin",
  "status": "active",
  ...
}
```

---

### Test 4: Get Business User Role
```bash
TOKEN="YOUR_TOKEN_HERE"
BUSINESS_ID="00000000-0000-4000-a000-000000000100"
USER_ID="00000000-0000-4000-a000-000000000011"

curl -X GET "https://api.kaha.com.np/main/api/v3/business-users/$BUSINESS_ID/$USER_ID" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" | jq
```

**Expected Response:**
```json
{
  "id": "some-uuid",
  "role": {
    "id": "role-uuid",
    "name": "business_super_admin",
    "label": "Business Super Admin",
    "description": "Full access to business"
  },
  "user": {
    "id": "00000000-0000-4000-a000-000000000011",
    "fullName": "Admin User",
    "email": "admin@kahastays.com"
  },
  "availability": "available",
  "createdAt": "2024-01-01T00:00:00.000Z"
}
```

**⚠️ CRITICAL:** The response must have `role.name` = `"business_super_admin"` for admin operations!

---

## Step 5: Start Restaurant E-Commerce Backend

```bash
cd /home/kali/Documents/KAHA_Verse/Kaha_restaurant-ecommerce/restaurant-ecommerce

# Start in development mode with logs
npm run dev
```

**Look for these startup logs:**
```
🔒 Production Mode: Role verification will use external Kaha Main V3 API
📡 Kaha Main V3 Base URL: https://api.kaha.com.np/main/api/v3
[NestApplication] Nest application successfully started
Application is running on: http://localhost:3001
```

---

## Step 6: Test Restaurant API Endpoints

### Test 5: Public Endpoint (No Auth Required)
```bash
# Get all menu items for a business
curl http://localhost:3001/api/v1/menu/biz-mock-001 | jq
```

**Expected:** Should return menu items (or empty array if no data)

---

### Test 6: Protected Endpoint - Get Categories (Admin Only)

First, get a category ID:
```bash
curl http://localhost:3001/api/v1/categories/business/biz-mock-001 | jq
```

Save a category ID from the response.

---

### Test 7: Create Menu Item (Admin Only - Requires External Verification)

```bash
TOKEN="YOUR_KAHA_MAIN_V3_TOKEN_HERE"
CATEGORY_ID="CATEGORY_UUID_FROM_PREVIOUS_STEP"

curl -X POST http://localhost:3001/api/v1/menu \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "name": "Test Authentication Burger",
    "description": "Testing external role verification",
    "price": 599,
    "categoryId": "'$CATEGORY_ID'",
    "isAvailable": true,
    "allowAddOns": true
  }' | jq
```

**Expected Success Response:**
```json
{
  "message": "Menu created successfully."
}
```

**Expected Error (if auth fails):**
```json
{
  "statusCode": 403,
  "message": "Forbidden resource",
  "error": "Forbidden"
}
```

---

## Step 7: Monitor Backend Logs

While making the request in Test 7, watch the backend terminal for these logs:

### ✅ Successful Authentication Flow:
```
[RolesGuard] Required roles: ["business_super_admin"]
[RolesGuard] User ID: 00000000-0000-4000-a000-000000000011, Business ID: 00000000-0000-4000-a000-000000000100
[RolesGuard] Business user role: {"id":"...","role":{"name":"business_super_admin"},...}
[RolesGuard] Comparing: business_super_admin with ["business_super_admin"]
[RolesGuard] Has required role: true
```

### ❌ Failed Authentication Flow:
```
[RolesGuard] Required roles: ["business_super_admin"]
[RolesGuard] User ID: xxx, Business ID: yyy
[ServiceCommunicationService] Failed to fetch business user role: Request failed with status code 404
[RolesGuard] Has required role: false
```

---

## Step 8: Test Different User Roles

### Test 8A: Customer User (Should Fail for Admin Operations)

1. Create a customer user in Kaha Main V3 (or use existing customer credentials)
2. Login as customer to get JWT token
3. Try to create menu item (should fail with 403 Forbidden)

```bash
# Login as customer
curl -X POST https://api.kaha.com.np/main/api/v3/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "customer@example.com",
    "password": "password123"
  }' | jq

# Try to create menu (should fail)
CUSTOMER_TOKEN="CUSTOMER_TOKEN_HERE"
curl -X POST http://localhost:3001/api/v1/menu \
  -H "Authorization: Bearer $CUSTOMER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","price":100,"categoryId":"xxx"}' | jq
```

**Expected:** 403 Forbidden

---

### Test 8B: Customer Can View Menu (Public Access)

```bash
# No token needed
curl http://localhost:3001/api/v1/menu/biz-mock-001 | jq
```

**Expected:** Success with menu items

---

## Step 9: Test CRUD Operations

### Create (Admin Only) ✅
```bash
TOKEN="YOUR_ADMIN_TOKEN"
curl -X POST http://localhost:3001/api/v1/menu \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "New Item",
    "description": "Test",
    "price": 500,
    "categoryId": "CATEGORY_ID"
  }' | jq
```

---

### Read (Public) ✅
```bash
curl http://localhost:3001/api/v1/menu/biz-mock-001 | jq
```

---

### Update (Admin Only) ✅
```bash
TOKEN="YOUR_ADMIN_TOKEN"
MENU_ID="MENU_UUID"

curl -X PATCH http://localhost:3001/api/v1/menu/$MENU_ID \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Updated Item Name",
    "price": 600
  }' | jq
```

---

### Delete (Admin Only) ✅
```bash
TOKEN="YOUR_ADMIN_TOKEN"
MENU_ID="MENU_UUID"

curl -X DELETE http://localhost:3001/api/v1/menu/$MENU_ID \
  -H "Authorization: Bearer $TOKEN" | jq
```

---

## 🔍 Troubleshooting

### Issue 1: "Failed to fetch business user role"

**Symptoms:**
```
[ServiceCommunicationService] Failed to fetch business user role: Request failed with status code 404
```

**Possible Causes:**
1. Wrong `businessId` in JWT token
2. User not associated with business in Kaha Main V3
3. Wrong API URL

**Solutions:**
```bash
# Verify business exists
curl -X GET "https://api.kaha.com.np/main/api/v3/businesses/BUSINESS_ID" \
  -H "Authorization: Bearer $TOKEN" | jq

# Verify user-business relationship
curl -X GET "https://api.kaha.com.np/main/api/v3/business-users/BUSINESS_ID/USER_ID" \
  -H "Authorization: Bearer $TOKEN" | jq
```

---

### Issue 2: "Has required role: false"

**Symptoms:**
```
[RolesGuard] Comparing: user with ["business_super_admin"]
[RolesGuard] Has required role: false
```

**Cause:** User role doesn't match required role

**Solution:** Verify user has correct role in Kaha Main V3:
```bash
curl -X GET "https://api.kaha.com.np/main/api/v3/business-users/BUSINESS_ID/USER_ID" \
  -H "Authorization: Bearer $TOKEN" | jq '.role.name'
```

Should return: `"business_super_admin"` for admin operations

---

### Issue 3: 401 Unauthorized

**Cause:** JWT token invalid or expired

**Solution:** Get fresh token:
```bash
curl -X POST https://api.kaha.com.np/main/api/v3/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@kahastays.com",
    "password": "password123"
  }' | jq '.access_token'
```

---

### Issue 4: Connection Refused / Network Error

**Symptoms:**
```
[ServiceCommunicationService] Failed to fetch business user role: connect ECONNREFUSED
```

**Possible Causes:**
1. Kaha Main V3 API is down
2. Wrong URL in `.env`
3. Network/firewall issue

**Solutions:**
```bash
# Test connectivity
curl -v https://api.kaha.com.np/main/api/v3/health

# Check .env
cat .env | grep KAH_API_V3_BASE_URL

# Test DNS resolution
nslookup api.kaha.com.np
```

---

### Issue 5: CORS Errors (Frontend)

**Symptoms:** Browser console shows CORS error

**Solution:** Ensure backend has CORS enabled for frontend origin:
```typescript
// In main.ts
app.enableCors({
  origin: 'http://localhost:5173', // Frontend URL
  credentials: true,
});
```

---

## 📊 Test Results Checklist

- [ ] Kaha Main V3 login successful
- [ ] JWT token received and decoded
- [ ] User info endpoint returns data
- [ ] Business user role endpoint returns role
- [ ] Backend starts with "Production Mode" log
- [ ] Public endpoints work without token
- [ ] Admin endpoints work with valid admin token
- [ ] Admin endpoints reject customer tokens
- [ ] Backend logs show successful role verification
- [ ] CRUD operations work for admin
- [ ] CRUD operations blocked for customers

---

## 🎯 Success Criteria

✅ **Authentication Working When:**
1. Admin can create/update/delete menu items
2. Customers can view menu items
3. Customers cannot create/update/delete menu items
4. Backend logs show external API calls to Kaha Main V3
5. Role verification happens via external API (not JWT payload)

---

## 📞 Next Steps

If all tests pass:
1. ✅ Authentication is working correctly
2. ✅ External verification is active
3. ✅ Ready for frontend integration

If tests fail:
1. Check backend logs for specific errors
2. Verify Kaha Main V3 credentials
3. Confirm user-business relationships in Kaha Main V3
4. Review this guide's troubleshooting section

---

**Generated:** $(date)
**Status:** Ready for testing
