# Postman Testing - Quick Guide

## 📦 Files

1. **Kaha-Restaurant-Environment.postman_environment.json** - Environment with production credentials
2. **KAHA_Restaurant_Complete_Tests.postman_collection.json** - Complete test suite (in parent directory)

## 🚀 Quick Start (2 Steps!)

### Step 1: Import to Postman

1. Open Postman
2. Click **Import**
3. Import both files:
   - `postman/Kaha-Restaurant-Environment.postman_environment.json`
   - `KAHA_Restaurant_Complete_Tests.postman_collection.json`
4. Select environment: **"Kaha Restaurant - Production Credentials"**

### Step 2: Get Auth Token (In Postman!)

1. Open collection: **"KAHA Restaurant - Complete CRUD & Edge Cases Tests"**
2. Expand: **"🔐 Get Auth Token (Kaha Main v3)"**
3. Click: **"LOGIN - Owner (Recommended)"**
4. Click: **Send**
5. ✅ Token automatically saved to environment!

**That's it!** Now you can run any test.

## 📋 Testing Workflow

### Recommended Order:

1. **🔐 Get Auth Token** → Run "LOGIN - Owner" → Token auto-saved ✅
2. **🏥 Health Check** → Verify API is running
3. **Categories** → Test CRUD operations
4. **Menu Items** → Test menu management
5. **Cart** → Test shopping cart
6. **Orders** → Test order creation
7. **Menu Ratings** → Test ratings

### For Admin Operations:

If you need admin privileges (create/update/delete categories, menu):
1. Run **"LOGIN - Admin"** instead
2. Admin token will be saved automatically

## 📋 What Gets Tested

- ✅ **Health Check** (GET `/api/v1/`)
- ✅ **Auth Token** (Login to Kaha Main v3 - auto-saves token)
- ✅ Categories (Create, Read, Update, Delete) - 17 tests
- ✅ Menu Items (Full CRUD + Variants) - 23 tests
- ✅ Addons (Full CRUD) - 17 tests
- ✅ Addon Groups (Full CRUD) - 18 tests
- ✅ Cart (Create, Add, Update, Delete) - 17 tests
- ✅ Orders (Create, Read, Update Status) - 18 tests
- ✅ Menu Ratings (Create, Read) - 20 tests

**Total: 131 tests**

## 🔍 API Endpoints

- **Base URL**: `http://localhost:3001/api/v1`
- **Health Check**: `http://localhost:3001/api/v1/`
- **Kaha Main v3**: `https://api.kaha.com/v3` (for authentication)

## 🔑 Embedded Credentials

### Owner (Recommended for Testing)
- Email: `owner@kahastays.com`
- Password: `password123`
- User ID: `00000000-0000-4000-a000-000000000010`

### Admin
- Email: `admin@kahastays.com`
- Password: `password123`
- User ID: `00000000-0000-4000-a000-000000000011`

### Business IDs (Hotels)
- Yak & Yeti: `00000000-0000-4000-a000-000000000100`
- Temple Tree: `00000000-0000-4000-a000-000000000101`
- Barahi Lodge: `00000000-0000-4000-a000-000000000102`

## ⚙️ Before Testing

1. Start restaurant API: `npm run dev` (port 3001)
2. Verify `.env` has:
   ```
   JWT_SECRET_TOKEN=secret
   KAH_API_V3_BASE_URL=https://api.kaha.com/v3
   ```

## 🐛 Troubleshooting

### "401 Unauthorized"
- Run the LOGIN request again to get fresh token
- Token automatically saves to environment

### "403 Forbidden"
- Use "LOGIN - Admin" for admin operations
- Use "LOGIN - Owner" for customer operations

### "Connection refused"
- Ensure restaurant API is running: `npm run dev`

### "Cannot GET /api/v1/categories"
- Verify `baseUrl` is `http://localhost:3001/api/v1`
- Check API is running on port 3001

## ✅ Success!

Your tests should now pass with production data from Kaha Main v3!

**No manual token copying needed** - the LOGIN requests automatically save tokens to your environment! 🎉

---

**API Base URL**: `http://localhost:3001/api/v1`
**Auth Source**: `https://api.kaha.com/v3`
