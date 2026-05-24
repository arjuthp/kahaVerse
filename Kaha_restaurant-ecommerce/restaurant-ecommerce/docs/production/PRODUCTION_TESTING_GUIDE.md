# 🚀 Production Testing - Quick Start Guide

## Overview

You've configured your app to use **production Kaha Main V3**. Now you need **real user/business IDs** for testing.

---

## ⚡ Quick Start (Automated)

### Step 1: Run the Script

```bash
cd /home/kali/Documents/KAHA_Verse/Kaha_restaurant-ecommerce/restaurant-ecommerce

# Install dependencies (first time only)
pip install requests

# Run the script
python3 postman/get_production_data.py
```

### Step 2: Enter Credentials

```
Email: your-production-email@example.com
Password: ********
```

### Step 3: Confirm Update

The script will:
- ✅ Login to production
- ✅ Fetch your user ID and business ID
- ✅ Verify user and business exist
- ✅ Check if you have admin role
- ✅ Update all Postman collections
- ✅ Save data to `PRODUCTION_DATA.json`

### Step 4: Re-import in Postman

1. Open Postman
2. Delete old collections
3. Import updated collections
4. Verify variables are updated
5. Start testing!

---

## 📋 Manual Method

If you prefer to do it manually:

### Step 1: Login to Production

**Using cURL:**
```bash
curl -X POST https://api.kaha.com/v3/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "your-email@example.com",
    "password": "your-password"
  }'
```

**Using Postman:**
1. Create new request
2. Method: `POST`
3. URL: `https://api.kaha.com/v3/auth/login`
4. Body (JSON):
   ```json
   {
     "email": "your-email@example.com",
     "password": "your-password"
   }
   ```
5. Send request

**Response:**
```json
{
  "accessToken": "eyJhbGc...",
  "user": {
    "id": "abc123-def456-ghi789",
    "email": "your-email@example.com",
    "businessId": "xyz789-uvw456-rst123",
    "role": "BUSINESS_SUPER_ADMIN"
  }
}
```

### Step 2: Copy the Values

From the response, copy:
- `user.id` → **userId**
- `user.businessId` → **businessId**
- `accessToken` → **authToken** and **adminToken**

### Step 3: Update Postman Variables

1. Open your collection in Postman
2. Click collection name → **Variables** tab
3. Update **CURRENT VALUE**:
   ```
   userId: abc123-def456-ghi789
   businessId: xyz789-uvw456-rst123
   authToken: eyJhbGc...
   adminToken: eyJhbGc...
   ```
4. Click **Save**

### Step 4: Test

Run any endpoint to verify it works!

---

## 🔄 What Changes in Postman

### Before (Mock Data)
```json
{
  "variable": [
    {
      "key": "userId",
      "value": "user-mock-001"
    },
    {
      "key": "businessId",
      "value": "biz-mock-001"
    },
    {
      "key": "authToken",
      "value": "eyJhbGc... (mock token)"
    }
  ]
}
```

### After (Production Data)
```json
{
  "variable": [
    {
      "key": "userId",
      "value": "abc123-def456-ghi789"
    },
    {
      "key": "businessId",
      "value": "xyz789-uvw456-rst123"
    },
    {
      "key": "authToken",
      "value": "eyJhbGc... (real token)"
    }
  ]
}
```

---

## ✅ Verification

### Test 1: Check Variables
1. Open collection in Postman
2. Go to Variables tab
3. Verify userId and businessId are real UUIDs (not mock-001)

### Test 2: Test Public Endpoint
```
GET http://127.0.0.1:3001/api/v1/categories/business/{{businessId}}
```
Should return categories (or empty array if none exist)

### Test 3: Test Admin Endpoint
```
POST http://127.0.0.1:3001/api/v1/categories
Authorization: Bearer {{adminToken}}
Body: {
  "name": "Test Category",
  "businessId": "{{businessId}}"
}
```
Should return 201 Created (not 401 or 500)

---

## 🔑 Understanding Roles

### Regular User (USER)
- ✅ Can: View menu, add to cart, create orders
- ❌ Cannot: Create/update/delete categories, menu, addons

### Admin User (BUSINESS_SUPER_ADMIN)
- ✅ Can: Everything a regular user can do
- ✅ Can: Create/update/delete categories, menu, addons
- ✅ Can: Manage business data

### How to Check Your Role

**Method 1: From Login Response**
```json
{
  "user": {
    "role": "BUSINESS_SUPER_ADMIN"  // ← Your role
  }
}
```

**Method 2: API Call**
```bash
curl -X GET https://api.kaha.com/v3/business-users/{{businessId}}/{{userId}} \
  -H "Authorization: Bearer {{authToken}}"
```

---

## ⚠️ Common Issues

### Issue 1: "User not found"
**Cause:** User ID doesn't exist in production

**Solution:**
- Re-run the script to get fresh user ID
- Or login manually and copy correct user ID

### Issue 2: "Business not found"
**Cause:** Business ID doesn't exist in production

**Solution:**
- Use businessId from login response
- Verify business exists: `GET /businesses/{businessId}`

### Issue 3: "Insufficient permissions" (403)
**Cause:** User doesn't have admin role

**Solution:**
- Use admin account for admin endpoints
- Or test only public/user endpoints

### Issue 4: "Unauthorized" (401)
**Cause:** Token expired (tokens expire after ~15 minutes)

**Solution:**
- Re-run the script to get fresh token
- Or login again manually

### Issue 5: Script fails with "Connection error"
**Cause:** Production API is down or unreachable

**Solution:**
- Check if production is accessible: `curl https://api.kaha.com/v3/health`
- Switch to localhost if production is down

---

## 🔄 Token Refresh Workflow

Tokens expire, so you'll need to refresh them periodically:

### Option 1: Re-run Script (Easiest)
```bash
python3 postman/get_production_data.py
```

### Option 2: Use Refresh Token
```bash
curl -X POST https://api.kaha.com/v3/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{"refreshToken": "your-refresh-token"}'
```

### Option 3: Login Again
Just login again to get new tokens

---

## 📊 Production Data File

After running the script, check `postman/PRODUCTION_DATA.json`:

```json
{
  "userId": "abc123-def456-ghi789",
  "businessId": "xyz789-uvw456-rst123",
  "email": "your-email@example.com",
  "role": "BUSINESS_SUPER_ADMIN",
  "isAdmin": true,
  "accessToken": "eyJhbGc...",
  "fetchedAt": "2026-05-18T12:00:00Z"
}
```

This file contains your production credentials for reference.

**⚠️ Security Note:** Don't commit this file to git! It contains sensitive tokens.

---

## 🎯 Testing Workflow

### 1. Get Production Data
```bash
python3 postman/get_production_data.py
```

### 2. Start Services
```bash
# Terminal 1: Auth Service (if needed)
cd /path/to/auth-service
npm run dev

# Terminal 2: Restaurant Service
cd /home/kali/Documents/KAHA_Verse/Kaha_restaurant-ecommerce/restaurant-ecommerce
npm run dev
```

### 3. Import Collections
- Re-import updated collections in Postman

### 4. Run Tests
- Start with public endpoints (GET categories, menu)
- Then test user endpoints (cart, orders)
- Finally test admin endpoints (create/update/delete)

---

## 📚 Related Documentation

- **`GET_PRODUCTION_DATA.md`** - Detailed guide on getting production data
- **`PRODUCTION_URL_CONFIGURED.md`** - Production URL setup
- **`SETUP_COMPLETE.md`** - Complete setup summary
- **`MICROSERVICES_PORTS.md`** - Service architecture

---

## ✅ Checklist

- [ ] Production credentials ready (email/password)
- [ ] Script executed successfully
- [ ] User ID and Business ID retrieved
- [ ] Postman collections updated
- [ ] Collections re-imported in Postman
- [ ] Variables verified in Postman
- [ ] Restaurant service running
- [ ] Test endpoints working
- [ ] No 401/403/500 errors

---

## 🎊 Summary

**Automated Way:**
```bash
python3 postman/get_production_data.py
# Enter credentials → Script updates everything
```

**Manual Way:**
```bash
# 1. Login to production
# 2. Copy userId, businessId, accessToken
# 3. Update Postman variables manually
```

**Both ways work!** Choose what's easier for you.

---

**Ready to test with production data! 🚀**
