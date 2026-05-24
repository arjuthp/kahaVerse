# 🔗 Kaha Main API ↔ Restaurant E-commerce Integration Guide

## Overview

This guide explains how to integrate Kaha Main API v3 with the Restaurant E-commerce system, enabling automatic sync of user and business data when restaurant features are enabled.

## 🏗️ Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                    INTEGRATION FLOW                           │
└──────────────────────────────────────────────────────────────┘

User/Business Owner
         │
         │ 1. Enables "Restaurant" feature
         ▼
┌─────────────────────────────────────────────────────────────┐
│  Kaha Main API v3                                            │
│  POST /businesses/:id/enable-restaurant                      │
│                                                              │
│  1. Validate user permissions                                │
│  2. Get business + owner data                                │
│  3. Call RestaurantEcommerceService.syncUserAndRestaurant() │
└─────────────────────────────────────────────────────────────┘
         │
         │ HTTP POST with service account token
         ▼
┌─────────────────────────────────────────────────────────────┐
│  Restaurant E-commerce Backend                               │
│  POST /kaha-sync/user-restaurant                             │
│                                                              │
│  1. Authenticate service account                             │
│  2. Create/Update User                                       │
│  3. Create/Update Restaurant                                 │
│  4. Return IDs                                               │
└─────────────────────────────────────────────────────────────┘
         │
         │ Response: { userId, restaurantId, ... }
         ▼
┌─────────────────────────────────────────────────────────────┐
│  Kaha Main API v3                                            │
│  - Store restaurantId in business metadata                   │
│  - Mark restaurant features as enabled                       │
│  - Return success response                                   │
└─────────────────────────────────────────────────────────────┘
```

## 📦 Files Created

### In Kaha Main API v3

```
kaha-main-api-v3/src/modules/
├── restaurant-ecommerce/                    ✅ NEW MODULE
│   ├── restaurant-ecommerce.service.ts      - Sync service
│   └── restaurant-ecommerce.module.ts       - Module definition
└── businesses/
    ├── dtos/
    │   └── enable-restaurant.dto.ts         ✅ NEW DTO
    ├── businesses.controller.ts             ✅ UPDATED (new endpoint)
    └── businesses.module.ts                 ✅ UPDATED (import module)
```

## 🚀 Setup Instructions

### Step 1: Configure Restaurant E-commerce Backend

1. **Start Restaurant E-commerce backend:**
```bash
cd /home/kali/Documents/KAHA_Verse/Kaha_restaurant-ecommerce/restaurant-ecommerce
npm run start:dev
```

2. **Run database migration:**
```bash
psql -U your_user -d your_database -f migrations/AddUserAndRestaurantEntities.sql
```

3. **Create service account:**
```bash
curl -X POST http://localhost:3000/admin/service-accounts \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Kaha Main API Integration",
    "description": "Service account for Kaha main-api-v3",
    "validityDays": 365
  }'
```

**Response:**
```json
{
  "id": "abc-123-...",
  "name": "Kaha Main API Integration",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiresAt": "2027-05-24T...",
  "message": "Service account created successfully..."
}
```

⚠️ **SAVE THE TOKEN!** You'll need it in the next step.

### Step 2: Configure Kaha Main API v3

1. **Add environment variables to `.env`:**
```bash
cd /home/kali/Documents/KAHA_Verse/kaha-main-api-v3

# Add to .env file
echo "RESTAURANT_ECOMMERCE_URL=http://localhost:3000" >> .env
echo "RESTAURANT_ECOMMERCE_TOKEN=YOUR_TOKEN_FROM_STEP_1" >> .env
```

Replace `YOUR_TOKEN_FROM_STEP_1` with the actual token.

2. **Install dependencies (if needed):**
```bash
npm install
```

3. **Build and start:**
```bash
npm run build
npm run start:dev
```

### Step 3: Test the Integration

1. **Get a business ID from Kaha:**
```bash
# Login and get token
curl -X POST http://localhost:3001/auth/login \
  -H "Content-Type: application/json" \
  -d '{"phone":"9801234567","password":"your_password"}'

# Get your businesses
curl -X GET http://localhost:3001/businesses/my \
  -H "Authorization: Bearer YOUR_KAHA_TOKEN"
```

2. **Enable restaurant features:**
```bash
curl -X POST http://localhost:3001/businesses/BUSINESS_ID/enable-restaurant \
  -H "Authorization: Bearer YOUR_KAHA_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "enableRestaurant": true,
    "syncNow": true
  }'
```

**Expected Response:**
```json
{
  "statusCode": 200,
  "message": "Restaurant features enabled successfully",
  "data": {
    "business": {
      "id": "business-id",
      "name": "My Restaurant",
      "metadata": {
        "restaurantEnabled": true,
        "restaurantSyncedAt": "2026-05-24T...",
        "restaurantId": "uuid-from-restaurant-ecommerce"
      }
    },
    "sync": {
      "userId": "uuid-user-id",
      "restaurantId": "uuid-restaurant-id",
      "isNewUser": true,
      "isNewRestaurant": true,
      "message": "User and restaurant synced successfully"
    }
  }
}
```

3. **Verify in Restaurant E-commerce database:**
```sql
-- Check user was created
SELECT id, phone, "firstName", "lastName", "externalId", source
FROM "user"
WHERE "externalId" = 'YOUR_BUSINESS_OWNER_ID';

-- Check restaurant was created
SELECT id, name, "restaurantCode", "externalId", source
FROM restaurant
WHERE "externalId" = 'YOUR_BUSINESS_ID';
```

## 🔌 API Endpoints

### Kaha Main API v3

#### Enable Restaurant Features
```
POST /businesses/:id/enable-restaurant
Authorization: Bearer <kaha-user-token>
Content-Type: application/json

{
  "enableRestaurant": true,
  "syncNow": true
}
```

**Permissions:**
- Business owner
- Super admin
- Admin

**Response:**
```json
{
  "statusCode": 200,
  "message": "Restaurant features enabled successfully",
  "data": {
    "business": { ... },
    "sync": {
      "userId": "uuid",
      "restaurantId": "uuid",
      "isNewUser": boolean,
      "isNewRestaurant": boolean,
      "message": "User and restaurant synced successfully"
    }
  }
}
```

### Restaurant E-commerce Backend

#### Sync User and Restaurant
```
POST /kaha-sync/user-restaurant
Authorization: Bearer <service-account-token>
Content-Type: application/json

{
  "user": {
    "externalUserId": "kaha-user-id",
    "phone": "9801234567",
    "firstName": "John",
    "lastName": "Doe",
    "email": "john@example.com"
  },
  "restaurant": {
    "externalRestaurantId": "kaha-business-id",
    "name": "Restaurant Name",
    "address": { ... },
    "contact": { ... },
    "coordinates": { ... }
  }
}
```

## 🔄 Data Mapping

### User Mapping

| Kaha Main API | Restaurant E-commerce |
|---------------|----------------------|
| `user.id` | `user.externalId` |
| `user.phone` | `user.phone` |
| `user.fullName` (first word) | `user.firstName` |
| `user.fullName` (rest) | `user.lastName` |
| `user.email` | `user.email` |
| - | `user.source = 'kaha'` |
| - | `user.userType = 'restaurant_owner'` |

### Business → Restaurant Mapping

| Kaha Main API | Restaurant E-commerce |
|---------------|----------------------|
| `business.id` | `restaurant.externalId` |
| `business.name` | `restaurant.name` |
| `business.description` | `restaurant.description` |
| `business.address` | `restaurant.address` |
| `business.phone` | `restaurant.contact.phones[]` |
| `business.email` | `restaurant.contact.email` |
| `business.website` | `restaurant.contact.website` |
| `business.location.coordinates` | `restaurant.coordinates` |
| `business.avatarUrl` | `restaurant.logoUrl` |
| `business.coverImageUrl` | `restaurant.bannerUrl` |
| `business.rating` | `restaurant.rating` |
| `business.workingDaysAndHours` | `restaurant.businessHours` |
| - | `restaurant.source = 'kaha'` |
| - | `restaurant.status = 'trial'` |

## 🔒 Security

### Service Account Token
- **Storage:** Environment variable `RESTAURANT_ECOMMERCE_TOKEN`
- **Validity:** 365 days (configurable)
- **Rotation:** Create new token before expiration
- **Revocation:** Use `/admin/service-accounts/:id/deactivate`

### Authentication Flow
1. Kaha Main API includes service account token in `Authorization` header
2. Restaurant E-commerce validates JWT signature
3. Checks token expiration and service account status
4. Processes sync request if valid

## 🐛 Troubleshooting

### Error: "Service account token required"
**Cause:** Missing or invalid `Authorization` header
**Solution:** Check `RESTAURANT_ECOMMERCE_TOKEN` in Kaha `.env` file

### Error: "Failed to connect to Restaurant E-commerce service"
**Cause:** Restaurant E-commerce backend not running or wrong URL
**Solution:** 
- Check if backend is running: `curl http://localhost:3000/health`
- Verify `RESTAURANT_ECOMMERCE_URL` in `.env`

### Error: "User with phone already exists"
**Cause:** A local user with that phone exists in Restaurant E-commerce
**Solution:** This is expected if user registered directly. The sync will update the existing user.

### Sync succeeds but no data in database
**Cause:** Database migration not run
**Solution:** Run the migration SQL script

## 📊 Monitoring

### Check Sync Status

**In Kaha Main API:**
```javascript
// Business metadata will contain:
{
  "restaurantEnabled": true,
  "restaurantSyncedAt": "2026-05-24T10:30:00Z",
  "restaurantId": "uuid-from-restaurant-ecommerce"
}
```

**In Restaurant E-commerce:**
```sql
-- Check sync status
SELECT 
  u.id as user_id,
  u.phone,
  u."externalId" as kaha_user_id,
  u.source,
  r.id as restaurant_id,
  r.name,
  r."externalId" as kaha_business_id,
  r.source
FROM "user" u
JOIN restaurant r ON r."ownerId" = u.id
WHERE u.source = 'kaha';
```

### Logs

**Kaha Main API:**
```bash
# Check logs for sync operations
tail -f logs/app.log | grep "RestaurantEcommerce"
```

**Restaurant E-commerce:**
```bash
# Check logs for incoming sync requests
tail -f server.log | grep "KahaSyncService"
```

## 🎯 Next Steps

1. **Frontend Integration:**
   - Add "Enable Restaurant" button in Kaha business dashboard
   - Show sync status and restaurant ID
   - Link to Restaurant E-commerce management panel

2. **Webhook Integration (Optional):**
   - Restaurant E-commerce notifies Kaha when menu items are added
   - Bi-directional sync for orders and inventory

3. **Batch Sync (Optional):**
   - Sync multiple businesses at once
   - Background job for periodic sync

4. **Analytics:**
   - Track sync success/failure rates
   - Monitor API response times
   - Alert on repeated failures

## 📞 Support

- **Kaha Main API Issues:** Check `/src/modules/restaurant-ecommerce/`
- **Restaurant E-commerce Issues:** Check `/src/modules/kaha-sync/`
- **Integration Issues:** Review this guide and check logs

## ✅ Checklist

- [ ] Restaurant E-commerce backend running
- [ ] Database migration applied
- [ ] Service account created
- [ ] Token added to Kaha `.env`
- [ ] Kaha Main API restarted
- [ ] Test sync successful
- [ ] Data verified in database
- [ ] Frontend integration planned
