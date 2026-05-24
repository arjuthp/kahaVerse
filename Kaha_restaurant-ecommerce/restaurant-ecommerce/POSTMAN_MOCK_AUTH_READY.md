# ✅ Postman Collection - Mock Auth Ready!

## 🎉 **What's Been Updated:**

All Postman files now have **hardcoded mock tokens and IDs** - no environment setup needed!

---

## 📦 **Updated Files:**

### **1. Main Collection**
**File:** `KAHA_Restaurant_Complete_Tests.postman_collection.json`

**Changes:**
- ✅ `authToken` = Mock admin token (hardcoded)
- ✅ `adminToken` = Mock admin token (hardcoded)
- ✅ `userId` = `admin-mock-001` (hardcoded)
- ✅ `businessId` = `biz-mock-001` (hardcoded)
- ✅ `baseUrl` = `http://localhost:3001/api/v1`

### **2. Environment File**
**File:** `postman/Kaha-Restaurant-Environment.postman_environment.json`

**Changes:**
- ✅ Renamed to "Mock Auth (Development)"
- ✅ `authToken` = Mock admin token (hardcoded)
- ✅ `adminToken` = Mock admin token (hardcoded)
- ✅ `regularUserToken` = Mock user token (hardcoded)
- ✅ `ownerToken` = Mock owner token (hardcoded)
- ✅ `userId` = `admin-mock-001`
- ✅ `businessId` = `biz-mock-001`

### **3. Simple Test Collection**
**File:** `postman/MOCK_AUTH_TEST.postman_collection.json`

**New file with:**
- ✅ Health check
- ✅ GET categories
- ✅ CREATE category (with hardcoded token)

---

## 🚀 **How to Use:**

### **Option 1: Use Main Collection (Recommended)**

1. **Import:**
   ```
   KAHA_Restaurant_Complete_Tests.postman_collection.json
   ```

2. **That's it!** All tokens are already set in collection variables

3. **Run any request** - They all work now!

### **Option 2: Use Environment File**

1. **Import:**
   ```
   postman/Kaha-Restaurant-Environment.postman_environment.json
   ```

2. **Select environment** (dropdown top right)

3. **Run requests** - Variables will resolve automatically

### **Option 3: Use Simple Test Collection**

1. **Import:**
   ```
   postman/MOCK_AUTH_TEST.postman_collection.json
   ```

2. **Run the 3 test requests** - All work out of the box!

---

## 🔑 **Hardcoded Values:**

### **Mock Admin Token:**
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImFkbWluLW1vY2stMDAxIiwia2FoYUlkIjoia2FoYS1hZG1pbi0wMDEiLCJidXNpbmVzc0lkIjoiYml6LW1vY2stMDAxIiwiZW1haWwiOiJhZG1pbkB0ZXN0LmNvbSIsInJvbGUiOiJCVVNJTkVTU19TVVBFUl9BRE1JTiIsImlhdCI6MTc3OTI0MzU1OSwiZXhwIjoxNzgxODM1NTU5fQ.bgpNW3hddZ86L41Yyam_JrbupoCjkKn7CclEUFgvPaY
```

**Decoded:**
```json
{
  "id": "admin-mock-001",
  "kahaId": "kaha-admin-001",
  "businessId": "biz-mock-001",
  "email": "admin@test.com",
  "role": "BUSINESS_SUPER_ADMIN"
}
```

### **Mock IDs:**
- **userId:** `admin-mock-001`
- **businessId:** `biz-mock-001`
- **baseUrl:** `http://localhost:3001/api/v1`

---

## ✅ **What Works Now:**

### **All CRUD Operations:**
- ✅ Categories (Create, Read, Update, Delete)
- ✅ Menu Items (Create, Read, Update, Delete)
- ✅ Addons (Create, Read, Update, Delete)
- ✅ Addon Groups (Create, Read, Update, Delete)
- ✅ Cart (Add, View, Update, Remove)
- ✅ Orders (Create, View, Update Status)
- ✅ Menu Ratings (Create, View, Update)

### **No Setup Required:**
- ❌ No login needed
- ❌ No environment variables to set
- ❌ No token generation
- ❌ No external API calls

### **Just Import and Test:**
1. Import collection
2. Start server (`npm run start:dev`)
3. Run requests
4. Everything works! 🎉

---

## 🧪 **Testing Checklist:**

- [x] Mock auth enabled in `.env` (`USE_MOCK_AUTH=true`)
- [x] Server running (`npm run start:dev`)
- [x] Postman collection imported
- [x] Tokens hardcoded in collection
- [x] IDs hardcoded in collection
- [x] Database has mock data (`biz-mock-001`)
- [x] All requests work without setup

---

## 📝 **Quick Test:**

### **1. Health Check:**
```
GET http://localhost:3001
```
Expected: `404 Not Found` (normal - no root route)

### **2. Get Categories:**
```
GET {{baseUrl}}/categories/{{businessId}}
```
Expected: `200 OK` with list of categories

### **3. Create Category:**
```
POST {{baseUrl}}/categories
Authorization: Bearer {{authToken}}

Body:
{
  "name": "Test Category",
  "description": "Testing",
  "businessId": "{{businessId}}"
}
```
Expected: `201 Created`

---

## 🎯 **Benefits:**

### **For Developers:**
- ✅ **Zero setup** - Import and test immediately
- ✅ **No credentials needed** - Mock tokens included
- ✅ **Works offline** - No external API dependency
- ✅ **Fast** - No network calls to KAHA Main V3
- ✅ **Reliable** - Always works, no auth failures

### **For Testing:**
- ✅ **Consistent** - Same tokens every time
- ✅ **Predictable** - Known user/business IDs
- ✅ **Complete** - All CRUD operations testable
- ✅ **Isolated** - No production data affected

### **For Team:**
- ✅ **Easy onboarding** - New devs can test immediately
- ✅ **No sharing credentials** - Mock tokens are safe
- ✅ **Version controlled** - Tokens in git are fine
- ✅ **Documentation** - Self-documenting with hardcoded values

---

## 🔄 **Token Expiry:**

**Current tokens expire:** June 19, 2026 (30 days from generation)

**To regenerate:**
```bash
node scripts/generate-mock-tokens.js
```

Then update the tokens in:
1. `KAHA_Restaurant_Complete_Tests.postman_collection.json`
2. `postman/Kaha-Restaurant-Environment.postman_environment.json`

---

## 📚 **Related Documentation:**

- [Mock Auth Guide](docs/testing/MOCK_AUTH_GUIDE.md)
- [Quick Start](MOCK_AUTH_QUICK_START.md)
- [Implementation Summary](MOCK_AUTH_IMPLEMENTATION_SUMMARY.md)
- [Complete Testing Guide](docs/testing/COMPLETE_TESTING_GUIDE.md)

---

## 🎉 **Success!**

**Status:** ✅ **READY TO USE**

**No setup required** - Just import and test!

**All requests work out of the box!** 🚀

---

## 💡 **Pro Tips:**

1. **Use collection variables** - They're already set!
2. **Check server logs** - Look for `🧪 Mock:` messages
3. **Test public endpoints first** - GET categories (no auth)
4. **Then test protected endpoints** - POST create category (with auth)
5. **Use Postman Console** - View → Show Postman Console to debug

---

**Happy Testing!** 🎊
