# 🔑 All Credentials & Test Data

## 🎯 Quick Reference

### For Testing Authentication (Kaha Main V3)
- **Admin:** `admin@kahastays.com` / `password123`
- **Owner:** `owner@kahastays.com` / `password123`

### For Testing Restaurant System
- **Business ID:** `biz-mock-001` (local test data)
- **Business ID (Production):** `00000000-0000-4000-a000-000000000100` (Hotel Yak & Yeti)

---

## 🔐 Kaha Main V3 Credentials (Production API)

These credentials work with the **production** Kaha Main V3 API at:
`https://api.kaha.com.np/main/api/v3`

### 1. Admin User
```
Email:    admin@kahastays.com
Password: password123
User ID:  00000000-0000-4000-a000-000000000011
Role:     admin
Access:   Full system permissions
```

**Use for:**
- Admin panel login
- Creating/editing/deleting menu items
- Managing categories
- Full CRUD operations

---

### 2. Property Owner
```
Email:    owner@kahastays.com
Password: password123
User ID:  00000000-0000-4000-a000-000000000010
Role:     property_owner (business_super_admin)
Access:   Business-specific management
```

**Use for:**
- Business owner login
- Managing restaurant for specific property
- Business-level operations

---

## 🏨 Business/Property IDs

### Hotel Yak & Yeti (Primary)
```
Property ID:  00000000-0000-4000-a000-000000000100
Code:         PROP-001
External ID:  KS-001
Type:         hotel
Star Rating:  5
Location:     Durbar Marg, Kathmandu, Nepal
Phone:        +977-1-4248999
Email:        info@yakandyeti.com
Website:      https://yakandyeti.com
```

**Use this Business ID for production testing!**

---

### Temple Tree Resort & Spa
```
Property ID:  00000000-0000-4000-a000-000000000101
Code:         PROP-002
Location:     Lakeside, Pokhara, Nepal
```

### Barahi Jungle Lodge
```
Property ID:  00000000-0000-4000-a000-000000000102
Code:         PROP-003
Location:     Meghauli, Chitwan, Nepal
```

### Club Himalaya
```
Property ID:  00000000-0000-4000-a000-000000000103
Code:         PROP-004
Location:     Nagarkot, Nepal
```

---

## 🍽️ Restaurant Database Test Data

Your local restaurant database (`kaha_restaurant_db`) has seeded test data:

### Categories Available
```
✅ Food
✅ Drinks
✅ Desserts
✅ Burgers
✅ Pizza
✅ Pasta
✅ Coffee
✅ Juices
```

**Business ID for local data:** `biz-mock-001`

---

### Sample Menu Items
```
✅ Classic Beef Burger      - ₹450
✅ Crispy Chicken Burger    - ₹420
✅ Veggie Delight Burger    - ₹380
✅ Margherita Pizza         - ₹650
✅ BBQ Chicken Pizza        - ₹750
✅ Cappuccino               - ₹220
✅ Espresso                 - ₹180
✅ New York Cheesecake      - ₹320
```

---

## 🧪 How to Use These Credentials

### Test 1: Admin Login (Frontend)

1. **Open:** http://localhost:5174/admin/login (or 5173)
2. **Enter:**
   ```
   Email:    admin@kahastays.com
   Password: password123
   ```
3. **Click:** Sign In
4. **Expected:** Redirect to admin dashboard

---

### Test 2: Admin Login (API - Direct)

```bash
# Login to Kaha Main V3
curl -X POST https://api.kaha.com.np/main/api/v3/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@kahastays.com",
    "password": "password123"
  }'
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

**Save the `access_token` for API testing!**

---

### Test 3: Create Menu Item (Admin Only)

```bash
# Use token from Test 2
TOKEN="YOUR_ACCESS_TOKEN_HERE"

# Get a category ID first
CATEGORY_ID=$(curl -s http://localhost:3001/api/v1/categories/business/biz-mock-001 | jq -r '.[0].id')

# Create menu item
curl -X POST http://localhost:3001/api/v1/menu \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Burger",
    "description": "Testing authentication",
    "price": 500,
    "categoryId": "'$CATEGORY_ID'",
    "isAvailable": true,
    "allowAddOns": true
  }'
```

**Expected:** Success message

---

### Test 4: View Menu (Public - No Auth)

```bash
# Anyone can view menu
curl http://localhost:3001/api/v1/menu/biz-mock-001 | jq
```

**Expected:** List of menu items

---

## 📊 Database Connection Info

### Restaurant E-Commerce Database
```
Database:  kaha_restaurant_db
Host:      localhost
Port:      5432
Username:  postgres
Password:  postgres
```

**Connect:**
```bash
PGPASSWORD=postgres psql -U postgres -h localhost -d kaha_restaurant_db
```

---

### Kaha Main V3 Database (if running locally)
```
Database:  kaha-main-v3
Host:      localhost
Port:      5432
Username:  kiran
Password:  kiran
```

**Connect:**
```bash
PGPASSWORD=kiran psql -U kiran -h localhost -d kaha-main-v3
```

---

## 🔍 Useful Database Queries

### Check Categories
```sql
SELECT id, name, "businessId" 
FROM category 
WHERE "businessId" = 'biz-mock-001';
```

### Check Menu Items
```sql
SELECT id, name, price, "businessId" 
FROM menu_entity 
WHERE "businessId" = 'biz-mock-001'
LIMIT 10;
```

### Check Addons
```sql
SELECT id, name, price 
FROM add_on_entity 
LIMIT 10;
```

### Check Addon Groups
```sql
SELECT id, name, "isRequired", "businessId"
FROM addon_group_entity
WHERE "businessId" = 'biz-mock-001';
```

### Check Orders
```sql
SELECT id, "userId", "businessId", "totalAmount", status, "createdAt"
FROM order_entity
ORDER BY "createdAt" DESC
LIMIT 10;
```

---

## 🎭 Creating Test Customer Accounts

### Option 1: Register via Frontend
1. Go to http://localhost:5174/register
2. Fill in:
   ```
   Name:     Test Customer
   Email:    customer@test.com
   Password: password123
   ```
3. Click "Create Account"

---

### Option 2: Register via API (if Kaha Main V3 supports it)
```bash
curl -X POST https://api.kaha.com.np/main/api/v3/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "fullName": "Test Customer",
    "email": "customer@test.com",
    "password": "password123",
    "contactNumber": "+977-9841234567"
  }'
```

**Note:** Registration endpoint may not be available in Kaha Main V3. Check API docs.

---

## 🔑 JWT Token Structure

When you login, you get a JWT token. Here's what's inside:

### Decoded Token Payload:
```json
{
  "id": "00000000-0000-4000-a000-000000000011",
  "kahaId": "KAHA-12345",
  "businessId": "00000000-0000-4000-a000-000000000100",
  "role": "admin",
  "iat": 1234567890,
  "exp": 1234567890
}
```

**Decode your token at:** https://jwt.io

---

## 🧪 Complete Testing Workflow

### Step 1: Login as Admin
```bash
# Get token
TOKEN=$(curl -s -X POST https://api.kaha.com.np/main/api/v3/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@kahastays.com","password":"password123"}' \
  | jq -r '.access_token')

echo "Token: $TOKEN"
```

---

### Step 2: Get Categories
```bash
# Get all categories
curl -s http://localhost:3001/api/v1/categories/business/biz-mock-001 | jq

# Save first category ID
CATEGORY_ID=$(curl -s http://localhost:3001/api/v1/categories/business/biz-mock-001 | jq -r '.[0].id')
echo "Category ID: $CATEGORY_ID"
```

---

### Step 3: Create Menu Item
```bash
curl -X POST http://localhost:3001/api/v1/menu \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Deluxe Burger",
    "description": "Premium beef burger with special sauce",
    "price": 599,
    "categoryId": "'$CATEGORY_ID'",
    "isAvailable": true,
    "allowAddOns": true,
    "isSignature": false
  }' | jq
```

---

### Step 4: View All Menu Items
```bash
curl -s http://localhost:3001/api/v1/menu/biz-mock-001 | jq
```

---

### Step 5: Update Menu Item
```bash
# Get menu item ID
MENU_ID=$(curl -s http://localhost:3001/api/v1/menu/biz-mock-001 | jq -r '.data[0].id')

# Update it
curl -X PATCH http://localhost:3001/api/v1/menu/$MENU_ID \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Updated Deluxe Burger",
    "price": 649
  }' | jq
```

---

### Step 6: Delete Menu Item
```bash
curl -X DELETE http://localhost:3001/api/v1/menu/$MENU_ID \
  -H "Authorization: Bearer $TOKEN" | jq
```

---

## 📝 Quick Copy-Paste Credentials

### For Frontend Login Forms:

**Admin:**
```
admin@kahastays.com
password123
```

**Owner:**
```
owner@kahastays.com
password123
```

**Customer (create new):**
```
customer@test.com
password123
```

---

## 🎯 Business IDs Quick Reference

**Local Testing:**
```
biz-mock-001
```

**Production (Kaha Main V3):**
```
00000000-0000-4000-a000-000000000100
```

---

## 🔍 Verify Credentials Work

### Quick Test Script:
```bash
#!/bin/bash

echo "Testing Kaha Main V3 Login..."
curl -X POST https://api.kaha.com.np/main/api/v3/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@kahastays.com",
    "password": "password123"
  }' | jq

echo ""
echo "If you see an access_token above, credentials are working!"
```

---

## 📊 Summary Table

| Credential Type | Email | Password | Role | Use For |
|----------------|-------|----------|------|---------|
| **Admin** | admin@kahastays.com | password123 | admin | Full access, CRUD operations |
| **Owner** | owner@kahastays.com | password123 | business_super_admin | Business management |
| **Customer** | (create new) | (your choice) | user | View menu, place orders |

| Business | ID | Use For |
|----------|----|----|
| **Local Test** | biz-mock-001 | Local development |
| **Hotel Yak & Yeti** | 00000000-0000-4000-a000-000000000100 | Production testing |

---

## 🎉 You're All Set!

You now have:
- ✅ Admin credentials for full access
- ✅ Owner credentials for business management
- ✅ Business IDs for testing
- ✅ Seeded menu data in database
- ✅ API testing examples
- ✅ Database connection info

**Start testing:** http://localhost:5174/admin/login

---

**Last Updated:** $(date)
**Status:** ✅ All credentials verified and working
