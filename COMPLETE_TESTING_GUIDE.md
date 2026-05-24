# 🧪 Complete Testing Guide: Kaha ↔ Restaurant E-commerce

## Overview

This guide walks you through the complete testing process from seeding restaurants in Kaha to verifying the sync in Restaurant E-commerce.

## 📋 Prerequisites

- [x] Kaha Main API v3 running
- [x] Restaurant E-commerce backend running
- [x] PostgreSQL databases for both systems
- [x] Service account token created

## 🚀 Step-by-Step Testing Process

### Step 1: Setup Restaurant E-commerce (5 minutes)

```bash
# Terminal 1: Start Restaurant E-commerce
cd /home/kali/Documents/KAHA_Verse/Kaha_restaurant-ecommerce/restaurant-ecommerce
npm run start:dev
```

**Expected output:**
```
[Nest] 12345  - 05/24/2026, 2:00:00 PM     LOG [NestApplication] Nest application successfully started
[Nest] 12345  - 05/24/2026, 2:00:00 PM     LOG Application is running on: http://localhost:3000
```

### Step 2: Run Database Migration

```bash
# Terminal 2: Run migration
cd /home/kali/Documents/KAHA_Verse/Kaha_restaurant-ecommerce/restaurant-ecommerce

# Check your database connection
psql -U your_user -d your_database -c "SELECT version();"

# Run migration
psql -U your_user -d your_database -f migrations/AddUserAndRestaurantEntities.sql
```

**Expected output:**
```
CREATE TYPE
CREATE TYPE
CREATE TABLE
CREATE INDEX
CREATE INDEX
...
COMMENT
```

### Step 3: Create Service Account

```bash
# Terminal 3: Create service account
curl -X POST http://localhost:3000/admin/service-accounts \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Kaha Main API Integration",
    "description": "Service account for Kaha main-api-v3",
    "validityDays": 365
  }'
```

**Expected response:**
```json
{
  "id": "abc-123-def-456",
  "name": "Kaha Main API Integration",
  "description": "Service account for Kaha main-api-v3",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJhYmMtMTIzLWRlZi00NTYiLCJ0eXBlIjoic2VydmljZV9hY2NvdW50IiwibmFtZSI6IkthaGEgTWFpbiBBUEkgSW50ZWdyYXRpb24iLCJpYXQiOjE3NDgwOTI4MDAsImV4cCI6MTc3OTYyODgwMH0.xyz...",
  "expiresAt": "2027-05-24T14:00:00.000Z",
  "message": "Service account created successfully. Store this token securely - it will not be shown again."
}
```

⚠️ **IMPORTANT:** Copy and save the token! You'll need it in the next step.

### Step 4: Configure Kaha Main API

```bash
cd /home/kali/Documents/KAHA_Verse/kaha-main-api-v3

# Add environment variables
echo "" >> .env
echo "# Restaurant E-commerce Integration" >> .env
echo "RESTAURANT_ECOMMERCE_URL=http://localhost:3000" >> .env
echo "RESTAURANT_ECOMMERCE_TOKEN=YOUR_TOKEN_FROM_STEP_3" >> .env

# Replace YOUR_TOKEN_FROM_STEP_3 with the actual token
nano .env  # or use your preferred editor
```

**Your .env should now include:**
```env
RESTAURANT_ECOMMERCE_URL=http://localhost:3000
RESTAURANT_ECOMMERCE_TOKEN=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Step 5: Start Kaha Main API

```bash
# Terminal 4: Start Kaha
cd /home/kali/Documents/KAHA_Verse/kaha-main-api-v3
npm run start:dev
```

**Expected output:**
```
[Nest] 12346  - 05/24/2026, 2:05:00 PM     LOG [NestApplication] Nest application successfully started
[Nest] 12346  - 05/24/2026, 2:05:00 PM     LOG Application is running on: http://localhost:3001
```

### Step 6: Seed Restaurant Businesses

```bash
# Terminal 5: Run seed script
cd /home/kali/Documents/KAHA_Verse/kaha-main-api-v3
node seed-restaurants.js
```

**Expected output:**
```
🌱 Starting restaurant seeding...

📍 Kaha API URL: http://localhost:3001

============================================================
Processing: Mountain View Restaurant
============================================================
✅ User registered: Ramesh Sharma (9801234567)
✅ Business created: Mountain View Restaurant
✅ Successfully processed: Mountain View Restaurant

============================================================
Processing: Himalayan Delights
============================================================
✅ User registered: Sita Thapa (9809876543)
✅ Business created: Himalayan Delights
✅ Successfully processed: Himalayan Delights

============================================================
Processing: Nepali Kitchen
============================================================
✅ User registered: Krishna Gurung (9801111111)
✅ Business created: Nepali Kitchen
✅ Successfully processed: Nepali Kitchen


============================================================
📊 SEEDING SUMMARY
============================================================

1. Mountain View Restaurant
   User ID: abc-123-def-456
   Phone: 9801234567
   Business ID: business-uuid-1
   Tag: mountain-view-restaurant
   Token: eyJhbGciOiJIUzI1Ni...

2. Himalayan Delights
   User ID: def-456-ghi-789
   Phone: 9809876543
   Business ID: business-uuid-2
   Tag: himalayan-delights
   Token: eyJhbGciOiJIUzI1Ni...

3. Nepali Kitchen
   User ID: ghi-789-jkl-012
   Phone: 9801111111
   Business ID: business-uuid-3
   Tag: nepali-kitchen
   Token: eyJhbGciOiJIUzI1Ni...
```

⚠️ **IMPORTANT:** Copy the Business ID and Token for the next step!

### Step 7: Enable Restaurant Features (Trigger Sync)

```bash
# Use the Business ID and Token from Step 6
export BUSINESS_ID="business-uuid-1"  # Replace with actual ID
export USER_TOKEN="eyJhbGciOiJIUzI1Ni..."  # Replace with actual token

curl -X POST "http://localhost:3001/businesses/${BUSINESS_ID}/enable-restaurant" \
  -H "Authorization: Bearer ${USER_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "enableRestaurant": true,
    "syncNow": true
  }'
```

**Expected response:**
```json
{
  "statusCode": 200,
  "message": "Restaurant features enabled successfully",
  "data": {
    "business": {
      "id": "business-uuid-1",
      "name": "Mountain View Restaurant",
      "metadata": {
        "restaurantEnabled": true,
        "restaurantSyncedAt": "2026-05-24T14:10:00.000Z",
        "restaurantId": "restaurant-uuid-from-ecommerce"
      }
    },
    "sync": {
      "userId": "user-uuid-in-restaurant-ecommerce",
      "restaurantId": "restaurant-uuid-in-restaurant-ecommerce",
      "isNewUser": true,
      "isNewRestaurant": true,
      "message": "User and restaurant synced successfully"
    }
  }
}
```

### Step 8: Verify Data in Restaurant E-commerce

```bash
# Terminal 6: Check database
psql -U your_user -d your_restaurant_ecommerce_db

-- Check synced user
SELECT 
  id,
  phone,
  "firstName",
  "lastName",
  email,
  "externalId",
  source,
  "userType",
  "authProvider"
FROM "user"
WHERE source = 'kaha';

-- Check synced restaurant
SELECT 
  id,
  name,
  "restaurantCode",
  "externalId",
  source,
  status,
  "subscriptionStatus",
  "ownerId"
FROM restaurant
WHERE source = 'kaha';

-- Check the relationship
SELECT 
  u.phone as owner_phone,
  u."firstName" || ' ' || u."lastName" as owner_name,
  u."externalId" as kaha_user_id,
  r.name as restaurant_name,
  r."restaurantCode",
  r."externalId" as kaha_business_id,
  r.status,
  r."subscriptionStatus"
FROM "user" u
JOIN restaurant r ON r."ownerId" = u.id
WHERE u.source = 'kaha' AND r.source = 'kaha';
```

**Expected output:**
```
 owner_phone |   owner_name   |    kaha_user_id     |     restaurant_name      | restaurantCode  |  kaha_business_id   | status | subscriptionStatus
-------------+----------------+---------------------+--------------------------+-----------------+---------------------+--------+--------------------
 9801234567  | Ramesh Sharma  | abc-123-def-456     | Mountain View Restaurant | MOUNTAIN-VIEW-1 | business-uuid-1     | trial  | trial
```

### Step 9: Test with All Restaurants

Repeat Step 7 for the other two restaurants:

```bash
# Himalayan Delights
export BUSINESS_ID="business-uuid-2"
export USER_TOKEN="token-for-user-2"
curl -X POST "http://localhost:3001/businesses/${BUSINESS_ID}/enable-restaurant" \
  -H "Authorization: Bearer ${USER_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{"enableRestaurant":true,"syncNow":true}'

# Nepali Kitchen
export BUSINESS_ID="business-uuid-3"
export USER_TOKEN="token-for-user-3"
curl -X POST "http://localhost:3001/businesses/${BUSINESS_ID}/enable-restaurant" \
  -H "Authorization: Bearer ${USER_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{"enableRestaurant":true,"syncNow":true}'
```

### Step 10: Test Update Sync (Idempotency)

```bash
# Update business in Kaha (e.g., change name or description)
curl -X PATCH "http://localhost:3001/businesses/${BUSINESS_ID}" \
  -H "Authorization: Bearer ${USER_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "description": "Updated description - Now serving international cuisine"
  }'

# Trigger sync again
curl -X POST "http://localhost:3001/businesses/${BUSINESS_ID}/enable-restaurant" \
  -H "Authorization: Bearer ${USER_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{"enableRestaurant":true,"syncNow":true}'
```

**Expected:** Same IDs returned, `isNewUser: false`, `isNewRestaurant: false`

## ✅ Success Criteria

- [x] Service account created with token
- [x] 3 restaurant businesses seeded in Kaha
- [x] Restaurant features enabled for all 3 businesses
- [x] 3 users synced to Restaurant E-commerce
- [x] 3 restaurants synced to Restaurant E-commerce
- [x] All records have `source: 'kaha'`
- [x] All records have correct `externalId`
- [x] User-Restaurant relationships correct
- [x] Update sync works (idempotent)

## 🐛 Troubleshooting

### Issue: "RESTAURANT_ECOMMERCE_TOKEN not configured"
**Solution:** Check `.env` file in Kaha Main API, ensure token is set

### Issue: "Failed to connect to Restaurant E-commerce service"
**Solution:** 
```bash
# Check if Restaurant E-commerce is running
curl http://localhost:3000/health

# Check logs
tail -f /path/to/restaurant-ecommerce/server.log
```

### Issue: "Service account token required"
**Solution:** Verify the token in Kaha `.env` matches the one from Step 3

### Issue: "User with phone already exists"
**Solution:** This is expected if running seed script multiple times. The sync will update existing users.

### Issue: Seed script fails with "Cannot find module 'axios'"
**Solution:**
```bash
cd /home/kali/Documents/KAHA_Verse/kaha-main-api-v3
npm install axios
```

## 📊 Verification Queries

### Check Sync Status in Kaha
```sql
SELECT 
  id,
  name,
  tag,
  contact,
  email,
  metadata->>'restaurantEnabled' as restaurant_enabled,
  metadata->>'restaurantId' as restaurant_id,
  metadata->>'restaurantSyncedAt' as synced_at
FROM business_entity
WHERE metadata->>'restaurantEnabled' = 'true';
```

### Check Sync Status in Restaurant E-commerce
```sql
SELECT 
  COUNT(*) as total_users,
  COUNT(*) FILTER (WHERE source = 'kaha') as kaha_users,
  COUNT(*) FILTER (WHERE source = 'local') as local_users
FROM "user";

SELECT 
  COUNT(*) as total_restaurants,
  COUNT(*) FILTER (WHERE source = 'kaha') as kaha_restaurants,
  COUNT(*) FILTER (WHERE source = 'local') as local_restaurants
FROM restaurant;
```

## 🎯 Next Steps

1. **Test Menu Management:** Add menus to synced restaurants
2. **Test Order Flow:** Create orders for synced restaurants
3. **Test Frontend:** Build UI to display synced restaurants
4. **Test Webhooks:** Implement bi-directional sync
5. **Production Deployment:** Deploy both systems

## 📞 Need Help?

- Check logs: `tail -f server.log | grep -i "restaurant\|kaha\|sync"`
- Review documentation: `KAHA_RESTAURANT_INTEGRATION_GUIDE.md`
- Test with Postman: Import `Kaha_Sync_Tests.postman_collection.json`

---

**Status:** Ready for testing! 🚀
