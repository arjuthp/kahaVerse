# Swagger Authorization Guide

## 🔐 How to Authorize in Swagger UI

## Quick Start (Testing Mode)

**JWT Secret:** `secret` (configured in `.env` as `JWT_SECRET_TOKEN=secret`)

### ⚡ Ready-to-Use Token

Copy this token and paste it into Swagger's "Authorize" dialog:

```
Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjEyMzQ1Njc4LTkwYWItY2RlZi0xMjM0LTU2Nzg5MGFiY2RlZiIsImthaGFJZCI6ImthaGEtMTIzNDU2NzgtOTBhYi1jZGVmLTEyMzQtNTY3ODkwYWJjZGVmIiwiYnVzaW5lc3NJZCI6ImFiY2RlZjEyLTM0NTYtNzg5MC1hYmNkLWVmMTIzNDU2Nzg5MCIsImlhdCI6MTc3OTMzNjM1NiwiZXhwIjoxODEwODcyMzU2fQ.ilimSTU06an8xoTFHmblTa-P3PM8pWj_tTj_7oHPkRc
```

**Valid for:** 1 year  
**User ID:** 12345678-90ab-cdef-1234-567890abcdef  
**Business ID:** abcdef12-3456-7890-abcd-ef1234567890

---

## 📍 Step 1: Access Swagger UI

Open your browser and navigate to:
```
http://localhost:3001/api/v1/docs
```

---

## 🔑 Step 2: Get Your JWT Token

Since **Mock Auth is enabled**, the JWT token is **automatically generated** and validated internally. You need to use a properly formatted JWT token.

### Option A: Use Pre-Generated Token (Recommended) ✅

Use this ready-to-use JWT token for testing:

```
Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjEyMzQ1Njc4LTkwYWItY2RlZi0xMjM0LTU2Nzg5MGFiY2RlZiIsImthaGFJZCI6ImthaGEtMTIzNDU2NzgtOTBhYi1jZGVmLTEyMzQtNTY3ODkwYWJjZGVmIiwiYnVzaW5lc3NJZCI6ImFiY2RlZjEyLTM0NTYtNzg5MC1hYmNkLWVmMTIzNDU2Nzg5MCIsImlhdCI6MTc3OTMzNjM1NiwiZXhwIjoxODEwODcyMzU2fQ.ilimSTU06an8xoTFHmblTa-P3PM8pWj_tTj_7oHPkRc
```

**This token is valid for 1 year and includes:**
- User ID: `12345678-90ab-cdef-1234-567890abcdef`
- Kaha ID: `kaha-12345678-90ab-cdef-1234-567890abcdef`
- Business ID: `abcdef12-3456-7890-abcd-ef1234567890`

### Option B: Generate Your Own Token

If you need a custom token, use [jwt.io](https://jwt.io) with these details:

**Header:**
```json
{
  "alg": "HS256",
  "typ": "JWT"
}
```

**Payload (customize as needed):**
```json
{
  "id": "12345678-90ab-cdef-1234-567890abcdef",
  "kahaId": "kaha-12345678-90ab-cdef-1234-567890abcdef",
  "businessId": "abcdef12-3456-7890-abcd-ef1234567890"
}
```

**Required Fields:**
- `id` - User UUID (required)
- `kahaId` - Kaha system user ID (required, usually prefixed with "kaha-")
- `businessId` - Business UUID (optional, required for business operations)

**Secret (from your .env):**
```
secret
```

**Note:** The JWT secret must match the one in your `.env` file (`JWT_SECRET_TOKEN=secret`)

---

## 🔓 Step 3: Authorize in Swagger

1. **Click the "Authorize" button** (🔒 lock icon) at the top right of Swagger UI
2. **Enter the token** in the "Value" field:
   ```
   Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjEyMzQ1Njc4LTkwYWItY2RlZi0xMjM0LTU2Nzg5MGFiY2RlZiIsImthaGFJZCI6ImthaGEtMTIzNDU2NzgtOTBhYi1jZGVmLTEyMzQtNTY3ODkwYWJjZGVmIiwiYnVzaW5lc3NJZCI6ImFiY2RlZjEyLTM0NTYtNzg5MC1hYmNkLWVmMTIzNDU2Nzg5MCIsImlhdCI6MTc3OTMzNjM1NiwiZXhwIjoxODEwODcyMzU2fQ.ilimSTU06an8xoTFHmblTa-P3PM8pWj_tTj_7oHPkRc
   ```
3. **Click "Authorize"**
4. **Click "Close"**

✅ You're now authenticated! The lock icons (🔒) will turn closed on protected endpoints.

---

## 🧪 Step 4: Test an Endpoint

### Example: Create a Category

1. **Expand** `POST /api/v1/categories`
2. **Click** "Try it out"
3. **See the pre-filled example data:**
   ```json
   {
     "name": "Appetizers",
     "description": "Delicious starters to begin your meal",
     "businessId": "123e4567-e89b-12d3-a456-426614174000",
     "displayOrder": 1,
     "isActive": true
   }
   ```
4. **Modify** the `businessId` to match your token's businessId (or use as-is for testing)
5. **Click** "Execute"
6. **View** the response below

---

## 🎭 Understanding User Context

The JWT token contains user identification that the API uses to:
- Identify the user making the request (`id` and `kahaId`)
- Associate operations with a specific business (`businessId`)
- Validate permissions and access control

### Token Fields Explained:

**`id`** - User's unique identifier (UUID format)
- Used to track which user performed an action
- Required for all authenticated requests

**`kahaId`** - Kaha system user identifier
- Links to the main Kaha authentication system
- Usually prefixed with "kaha-"
- Required for all authenticated requests

**`businessId`** - Business identifier (UUID format)
- Associates the user with a specific business
- Required for business-specific operations (menu management, orders, etc.)
- Optional for customer-only operations

### Example Token Payloads:

**Business Owner/Admin:**
```json
{
  "id": "admin-uuid-here",
  "kahaId": "kaha-admin-uuid-here",
  "businessId": "business-uuid-here"
}
```

**Customer:**
```json
{
  "id": "customer-uuid-here",
  "kahaId": "kaha-customer-uuid-here"
}
```

Generate tokens at [jwt.io](https://jwt.io) using the secret `secret` from your `.env` file.

---

## 🔄 Using Real Authentication (Production)

When integrating with the **Kaha Main V3 API** (running on port 4000), you get real JWT tokens:

### 1. Login to Get Token

**Endpoint:** `POST http://localhost:4000/api/v1/auth/login`

**Request:**
```json
{
  "email": "user@example.com",
  "password": "yourpassword"
}
```

**Response:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid",
    "kahaId": "kaha-uuid",
    "email": "user@example.com",
    "businessId": "business-uuid"
  }
}
```

### 2. Use the Token

Copy the `access_token` and use it in Swagger:
```
Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Important:** The JWT secret must match between both services (`JWT_SECRET_TOKEN=secret` in both `.env` files)

---

## 🛡️ Protected Endpoints & Access Control

The API uses the JWT token to identify users and control access. Access is determined by:
- Whether the user has a valid `businessId` in their token
- The specific business they're trying to access
- The resource ownership

### Business Operations (Requires businessId)
- ✅ Create/update/delete categories for your business
- ✅ Create/update/delete menu items for your business
- ✅ Manage variants and addons for your menu
- ✅ View orders for your business
- ✅ Update order status for your business orders
- ✅ Manage addon groups for your business

### Customer Operations
- ✅ Browse menu items from any business
- ✅ Manage their own cart
- ✅ Create orders
- ✅ View their own orders
- ✅ Create ratings/reviews for menu items

### Public Operations (No Auth Required)
- ✅ View menu items
- ✅ View categories
- ✅ View public ratings/reviews

---

## 🐛 Troubleshooting

### "Unauthorized" Error (401)
- ✅ Check that you included "Bearer " prefix (capital B, space after)
- ✅ Verify the token is not expired
- ✅ Ensure the JWT secret matches (`JWT_SECRET_TOKEN=secret` in `.env`)
- ✅ Verify token has required fields: `id`, `kahaId`
- ✅ Restart the server after changing `.env`

### "Forbidden" Error (403)
- ✅ Your token doesn't have access to this resource
- ✅ Check if `businessId` in token matches the resource's business
- ✅ Ensure you're accessing your own business resources

### Token Format
```
✅ Correct: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
❌ Wrong:   eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
❌ Wrong:   bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Token Payload Issues
```json
✅ Correct: { "id": "uuid", "kahaId": "kaha-uuid", "businessId": "uuid" }
❌ Wrong:  { "userId": "uuid", "role": "ADMIN" }
❌ Wrong:  { "id": "uuid" }  // Missing kahaId
```

---

## 📚 Additional Resources

- **Frontend Developer Guide:** `FRONTEND_DEVELOPER_GUIDE.md`
- **Mock Auth Quick Start:** `MOCK_AUTH_QUICK_START.md`
- **Postman Collection:** `KAHA_Restaurant_Complete_Tests.postman_collection.json`

---

## 🎯 Quick Test Checklist

- [ ] Server running on port 3001
- [ ] Swagger UI accessible at http://localhost:3001/api/v1/docs
- [ ] Mock auth enabled in `.env`
- [ ] JWT token copied
- [ ] Clicked "Authorize" button in Swagger
- [ ] Pasted token with "Bearer " prefix
- [ ] Clicked "Authorize" and "Close"
- [ ] Lock icons show as closed (🔒)
- [ ] Tested a POST endpoint with pre-filled data
- [ ] Received successful response

---

**Happy Testing! 🚀**
