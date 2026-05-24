# 🧪 Swagger Testing Guide - Quick Reference

## ✅ Authentication Token (Working!)

**Paste this in Swagger (WITHOUT "Bearer "):**
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjEyMzQ1Njc4LTkwYWItY2RlZi0xMjM0LTU2Nzg5MGFiY2RlZiIsImthaGFJZCI6ImthaGEtMTIzNDU2NzgtOTBhYi1jZGVmLTEyMzQtNTY3ODkwYWJjZGVmIiwiYnVzaW5lc3NJZCI6ImFiY2RlZjEyLTM0NTYtNzg5MC1hYmNkLWVmMTIzNDU2Nzg5MCIsImlhdCI6MTc3OTMzNjM1NiwiZXhwIjoxODEwODcyMzU2fQ.ilimSTU06an8xoTFHmblTa-P3PM8pWj_tTj_7oHPkRc
```

---

## ⚠️ Current Issue

Some POST endpoints are trying to validate business user roles by calling the **Kaha Main V3 API** (port 4000), which may not be running.

**Error you might see:**
```json
{
  "message": "Failed to fetch business user role",
  "error": "Internal Server Error",
  "statusCode": 500
}
```

---

## ✅ Endpoints That Work (No External Service Required)

### 1. GET Endpoints (Public - No Auth Required)

**Get Categories:**
```
GET /api/v1/categories/business/{businessId}
```
Example: `GET /api/v1/categories/business/abcdef12-3456-7890-abcd-ef1234567890`

**Get Menu Items:**
```
GET /api/v1/menu/{businessId}
```
Example: `GET /api/v1/menu/abcdef12-3456-7890-abcd-ef1234567890`

**Get Addons:**
```
GET /api/v1/addons
```

**Get Addon Groups:**
```
GET /api/v1/addon-groups
```

---

### 2. Cart Endpoints (Should Work with Auth)

**Create Cart:**
```
POST /api/v1/cart
```
No body required - creates cart for authenticated user

**Get Cart:**
```
GET /api/v1/cart
```
Returns cart for authenticated user

---

### 3. Order Endpoints (Read-Only)

**Get User Orders:**
```
GET /api/v1/order/user
```

**Get Business Orders (No Auth Required):**
```
GET /api/v1/order/business-man-vs/{businessId}
```

---

## 🔧 Solution Options

### Option 1: Start Kaha Main V3 API (Recommended)

The Kaha Main V3 API needs to be running on port 4000 for full functionality.

**Check if it's running:**
```bash
curl http://localhost:4000/api/v1
```

**If not running, start it:**
```bash
cd /path/to/kaha-main-v3
npm run dev
```

---

### Option 2: Test Read-Only Endpoints

You can test these endpoints without the external service:

1. **GET /api/v1/categories/business/{businessId}** - View categories
2. **GET /api/v1/menu/{businessId}** - View menu items  
3. **GET /api/v1/addons** - View addons
4. **GET /api/v1/addon-groups** - View addon groups
5. **POST /api/v1/cart** - Create cart (with auth token)
6. **GET /api/v1/cart** - Get cart (with auth token)

---

### Option 3: Seed Database Directly

If you have database access, you can insert test data directly:

```sql
-- Insert a category
INSERT INTO categories (id, name, description, business_id, display_order, is_active)
VALUES (
  '550e8400-e29b-41d4-a716-446655440000',
  'Main Dishes',
  'Our signature dishes',
  'abcdef12-3456-7890-abcd-ef1234567890',
  1,
  true
);

-- Insert a menu item
INSERT INTO menu (id, name, description, price, category_id, business_id, is_active)
VALUES (
  '550e8400-e29b-41d4-a716-446655440001',
  'Margherita Pizza',
  'Classic pizza',
  12.99,
  '550e8400-e29b-41d4-a716-446655440000',
  'abcdef12-3456-7890-abcd-ef1234567890',
  true
);
```

---

## 🧪 Quick Test Sequence

### Test 1: Check Server is Running
```bash
curl http://localhost:3001/api/v1
```
**Expected:** `man!`

### Test 2: Get Categories (No Auth)
```bash
curl http://localhost:3001/api/v1/categories/business/abcdef12-3456-7890-abcd-ef1234567890
```
**Expected:** `[]` (empty array if no data)

### Test 3: Create Cart (With Auth)
```bash
curl -X POST http://localhost:3001/api/v1/cart \
  -H 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjEyMzQ1Njc4LTkwYWItY2RlZi0xMjM0LTU2Nzg5MGFiY2RlZiIsImthaGFJZCI6ImthaGEtMTIzNDU2NzgtOTBhYi1jZGVmLTEyMzQtNTY3ODkwYWJjZGVmIiwiYnVzaW5lc3NJZCI6ImFiY2RlZjEyLTM0NTYtNzg5MC1hYmNkLWVmMTIzNDU2Nzg5MCIsImlhdCI6MTc3OTMzNjM1NiwiZXhwIjoxODEwODcyMzU2fQ.ilimSTU06an8xoTFHmblTa-P3PM8pWj_tTj_7oHPkRc'
```
**Expected:** Cart created successfully

### Test 4: Get Cart (With Auth)
```bash
curl http://localhost:3001/api/v1/cart \
  -H 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjEyMzQ1Njc4LTkwYWItY2RlZi0xMjM0LTU2Nzg5MGFiY2RlZiIsImthaGFJZCI6ImthaGEtMTIzNDU2NzgtOTBhYi1jZGVmLTEyMzQtNTY3ODkwYWJjZGVmIiwiYnVzaW5lc3NJZCI6ImFiY2RlZjEyLTM0NTYtNzg5MC1hYmNkLWVmMTIzNDU2Nzg5MCIsImlhdCI6MTc3OTMzNjM1NiwiZXhwIjoxODEwODcyMzU2fQ.ilimSTU06an8xoTFHmblTa-P3PM8pWj_tTj_7oHPkRc'
```
**Expected:** Your cart data

---

## 📋 Summary

**What's Working:**
- ✅ Authentication token is valid
- ✅ Server is running on port 3001
- ✅ Swagger UI is accessible
- ✅ GET endpoints work
- ✅ Cart endpoints work

**What Needs External Service:**
- ❌ POST /api/v1/categories (needs Kaha Main V3)
- ❌ POST /api/v1/menu (needs Kaha Main V3)
- ❌ POST /api/v1/addon-groups (needs Kaha Main V3)
- ❌ Other POST/PATCH/DELETE endpoints that modify business data

**Solution:**
Start the Kaha Main V3 API on port 4000, or test with the working endpoints listed above!

---

## 🔗 URLs

- **Swagger UI:** http://localhost:3001/api/v1/docs
- **API Base:** http://localhost:3001/api/v1
- **Kaha Main V3 (Required):** http://localhost:4000/api/v1

---

**Token Valid Until:** May 21, 2027 🚀
