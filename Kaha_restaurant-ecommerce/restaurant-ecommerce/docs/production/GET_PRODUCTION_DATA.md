# 🔍 Getting Production Data for Testing

## Overview

To test with production Kaha Main V3, you need **real user and business IDs** that exist in the production database.

---

## 📋 What You Need

### Required Information
1. **User ID** - A real user ID from production
2. **Business ID** - A real business ID from production
3. **Admin User ID** - A user with `BUSINESS_SUPER_ADMIN` role
4. **JWT Tokens** - Valid tokens for these users

---

## 🔍 Method 1: Get Data from Production API (Recommended)

### Step 1: Get a Valid JWT Token

You need to login to production to get a real token:

```bash
# Login to production authentication service
curl -X POST https://api.kaha.com/v3/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "your-email@example.com",
    "password": "your-password"
  }'
```

**Response:**
```json
{
  "accessToken": "eyJhbGc...",
  "user": {
    "id": "real-user-id-123",
    "email": "your-email@example.com",
    "businessId": "real-business-id-456"
  }
}
```

**Save these values:**
- `user.id` → This is your **userId**
- `user.businessId` → This is your **businessId**
- `accessToken` → This is your **authToken**

### Step 2: Get User Details

```bash
# Get user details
curl -X GET https://api.kaha.com/v3/users/real-user-id-123 \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

**Response:**
```json
{
  "id": "real-user-id-123",
  "email": "your-email@example.com",
  "role": "USER",
  "businessId": "real-business-id-456"
}
```

### Step 3: Get Business Details

```bash
# Get business details
curl -X GET https://api.kaha.com/v3/businesses/real-business-id-456 \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

**Response:**
```json
{
  "id": "real-business-id-456",
  "name": "My Restaurant",
  "email": "restaurant@example.com"
}
```

### Step 4: Get Admin User (if needed)

If you need to test admin endpoints, you need a user with `BUSINESS_SUPER_ADMIN` role:

```bash
# Get business users
curl -X GET https://api.kaha.com/v3/business-users/real-business-id-456/real-user-id-123 \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

**Response:**
```json
{
  "userId": "real-user-id-123",
  "businessId": "real-business-id-456",
  "role": "BUSINESS_SUPER_ADMIN"
}
```

---

## 🔍 Method 2: Get Data from Production Database

If you have access to the production database:

```sql
-- Get a user
SELECT id, email, role FROM users LIMIT 1;

-- Get a business
SELECT id, name, email FROM businesses LIMIT 1;

-- Get a business admin
SELECT u.id, u.email, bu.role 
FROM users u
JOIN business_users bu ON u.id = bu.user_id
WHERE bu.role = 'BUSINESS_SUPER_ADMIN'
LIMIT 1;
```

---

## 🔍 Method 3: Use Postman to Get Data

### Step 1: Create a Temporary Collection

1. Open Postman
2. Create new request: **Login to Production**
   - Method: `POST`
   - URL: `https://api.kaha.com/v3/auth/login`
   - Body:
     ```json
     {
       "email": "your-email@example.com",
       "password": "your-password"
     }
     ```

3. Send request and copy the response:
   - `user.id` → userId
   - `user.businessId` → businessId
   - `accessToken` → authToken

### Step 2: Get User Details

1. Create new request: **Get User**
   - Method: `GET`
   - URL: `https://api.kaha.com/v3/users/{userId}`
   - Headers: `Authorization: Bearer {accessToken}`

2. Send and verify user exists

### Step 3: Get Business Details

1. Create new request: **Get Business**
   - Method: `GET`
   - URL: `https://api.kaha.com/v3/businesses/{businessId}`
   - Headers: `Authorization: Bearer {accessToken}`

2. Send and verify business exists

---

## 📝 Update Postman Variables

Once you have the production data, update your Postman collection variables:

### Current (Mock Data)
```
userId: user-mock-001
businessId: biz-mock-001
authToken: eyJhbGc... (mock token)
adminToken: eyJhbGc... (mock token)
```

### New (Production Data)
```
userId: real-user-id-123
businessId: real-business-id-456
authToken: eyJhbGc... (real token from login)
adminToken: eyJhbGc... (real admin token from login)
```

### How to Update in Postman

1. Open your collection in Postman
2. Click on collection name
3. Go to **Variables** tab
4. Update **CURRENT VALUE** for:
   - `userId`
   - `businessId`
   - `authToken`
   - `adminToken`
5. Click **Save**

---

## 🤖 Automated Script

I'll create a script to help you fetch and update production data automatically.

### Prerequisites
```bash
# Install required packages
pip install requests python-dotenv
```

### Usage
```bash
# Run the script
python3 postman/get_production_data.py

# Follow the prompts:
# 1. Enter your production email
# 2. Enter your production password
# 3. Script will fetch user/business data
# 4. Script will update Postman collections
```

---

## ⚠️ Important Notes

### 1. Token Expiration
- Production tokens expire (usually 15 minutes for access token)
- You'll need to re-login periodically
- Use refresh token to get new access token

### 2. Admin Access
- Not all users have `BUSINESS_SUPER_ADMIN` role
- Admin endpoints will fail if user doesn't have admin role
- You may need a separate admin account

### 3. Business Association
- User must be associated with the business
- Check `business_users` table for user-business relationship
- User's `businessId` in JWT must match the business being tested

### 4. Data Consistency
- Use the same userId/businessId across all tests
- Don't mix mock and real data
- Update all Postman collections with same values

---

## 🔄 Workflow Summary

```
1. Login to Production
   ↓
2. Get Access Token
   ↓
3. Extract userId & businessId from response
   ↓
4. Verify user exists (GET /users/{userId})
   ↓
5. Verify business exists (GET /businesses/{businessId})
   ↓
6. Update Postman variables
   ↓
7. Run tests
```

---

## 📚 Next Steps

1. ✅ Get production credentials (email/password)
2. ✅ Login to production and get token
3. ✅ Extract userId and businessId
4. ✅ Update Postman variables
5. ✅ Run tests with production data

---

## 🐛 Troubleshooting

### "Invalid credentials"
- Check email/password are correct
- Ensure account exists in production

### "User not found"
- User ID doesn't exist in production
- Try logging in again to get valid user ID

### "Business not found"
- Business ID doesn't exist in production
- Check user's businessId from login response

### "Insufficient permissions"
- User doesn't have admin role
- Need to login with admin account for admin endpoints

---

**Ready to get production data? Run the script or follow the manual steps above!**
