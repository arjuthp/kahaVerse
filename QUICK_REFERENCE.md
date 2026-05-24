# 🚀 Quick Reference: Kaha ↔ Restaurant E-commerce

## TL;DR - Get Started in 5 Minutes

```bash
# 1. Start Restaurant E-commerce
cd Kaha_restaurant-ecommerce/restaurant-ecommerce && npm run start:dev

# 2. Run migration
psql -U user -d db -f migrations/AddUserAndRestaurantEntities.sql

# 3. Create service account & save token
curl -X POST http://localhost:3000/admin/service-accounts \
  -H "Content-Type: application/json" \
  -d '{"name":"Kaha Integration","validityDays":365}'

# 4. Configure Kaha
cd kaha-main-api-v3
echo "RESTAURANT_ECOMMERCE_URL=http://localhost:3000" >> .env
echo "RESTAURANT_ECOMMERCE_TOKEN=YOUR_TOKEN" >> .env

# 5. Start Kaha & seed restaurants
npm run start:dev
node seed-restaurants.js

# 6. Enable restaurant & sync
curl -X POST http://localhost:3001/businesses/BUSINESS_ID/enable-restaurant \
  -H "Authorization: Bearer USER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"enableRestaurant":true,"syncNow":true}'
```

## 📁 Key Files

| File | Purpose |
|------|---------|
| `COMPLETE_TESTING_GUIDE.md` | Step-by-step testing instructions |
| `KAHA_RESTAURANT_INTEGRATION_GUIDE.md` | Complete integration documentation |
| `INTEGRATION_COMPLETE_SUMMARY.md` | Implementation summary |
| `seed-restaurants.js` | Seed script for test data |
| `Kaha_Sync_Tests.postman_collection.json` | Postman tests |

## 🔌 API Endpoints

### Restaurant E-commerce (Port 3000)
```
POST   /admin/service-accounts          Create service account
GET    /admin/service-accounts          List service accounts
POST   /kaha-sync/user-restaurant       Sync user + restaurant
```

### Kaha Main API (Port 3001)
```
POST   /auth/register                   Register user
POST   /auth/login                      Login user
POST   /businesses                      Create business
GET    /businesses/my                   Get my businesses
POST   /businesses/:id/enable-restaurant  Enable restaurant features
```

## 🗄️ Database Tables

### Restaurant E-commerce
- `user` - Users (with `externalId` for Kaha user ID)
- `restaurant` - Restaurants (with `externalId` for Kaha business ID)

### Kaha Main API
- `user_entity` - Users
- `business_entity` - Businesses (with `metadata.restaurantId`)

## 🔑 Environment Variables

### Kaha Main API (.env)
```env
RESTAURANT_ECOMMERCE_URL=http://localhost:3000
RESTAURANT_ECOMMERCE_TOKEN=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## 🧪 Test Data

### Users
| Phone | Name | Email |
|-------|------|-------|
| 9801234567 | Ramesh Sharma | ramesh.sharma@example.com |
| 9809876543 | Sita Thapa | sita.thapa@example.com |
| 9801111111 | Krishna Gurung | krishna.gurung@example.com |

### Restaurants
| Name | Location | Tag |
|------|----------|-----|
| Mountain View Restaurant | Thamel, Kathmandu | mountain-view-restaurant |
| Himalayan Delights | Lakeside, Pokhara | himalayan-delights |
| Nepali Kitchen | Durbar Marg, Kathmandu | nepali-kitchen |

## 🔍 Verification Queries

### Check synced data
```sql
-- Restaurant E-commerce
SELECT u.phone, u."firstName", r.name, r."restaurantCode"
FROM "user" u
JOIN restaurant r ON r."ownerId" = u.id
WHERE u.source = 'kaha';

-- Kaha Main API
SELECT name, contact, metadata->>'restaurantId' as restaurant_id
FROM business_entity
WHERE metadata->>'restaurantEnabled' = 'true';
```

## 🐛 Common Issues

| Issue | Solution |
|-------|----------|
| Token not configured | Check `RESTAURANT_ECOMMERCE_TOKEN` in Kaha `.env` |
| Connection refused | Ensure Restaurant E-commerce is running on port 3000 |
| User already exists | Expected - sync will update existing user |
| Migration failed | Check database connection and permissions |

## 📊 Data Flow

```
Kaha User → Restaurant E-commerce User
  ├─ id → externalId
  ├─ phone → phone
  ├─ fullName → firstName + lastName
  └─ email → email

Kaha Business → Restaurant E-commerce Restaurant
  ├─ id → externalId
  ├─ name → name
  ├─ address → address
  ├─ phone → contact.phones
  └─ location → coordinates
```

## 🎯 Testing Checklist

- [ ] Restaurant E-commerce running
- [ ] Migration applied
- [ ] Service account created
- [ ] Kaha configured with token
- [ ] Kaha running
- [ ] Restaurants seeded
- [ ] Restaurant features enabled
- [ ] Data synced successfully
- [ ] Verified in database

## 📞 Quick Help

```bash
# Check if services are running
curl http://localhost:3000/health  # Restaurant E-commerce
curl http://localhost:3001/health  # Kaha Main API

# View logs
tail -f server.log | grep -i sync

# Test service account
curl -X GET http://localhost:3000/admin/service-accounts

# Check database
psql -U user -d db -c "SELECT COUNT(*) FROM restaurant WHERE source='kaha';"
```

## 🔗 Related Documentation

- Full Testing Guide: `COMPLETE_TESTING_GUIDE.md`
- Integration Guide: `KAHA_RESTAURANT_INTEGRATION_GUIDE.md`
- Implementation Details: `KAHA_SYNC_IMPLEMENTATION.md`
- Postman Tests: `Kaha_Sync_Tests.postman_collection.json`

---

**Quick Start:** Follow `COMPLETE_TESTING_GUIDE.md` for detailed instructions!
