# 🚀 Quick Fix Reference - Authentication Issues

## ⚡ TL;DR - What Was Wrong

1. **Mock auth was enabled** → Disabled it
2. **Wrong API URL** → Fixed to include `/main/api/v3`
3. **Missing role in JWT payload** → Added role field support

---

## 🔧 Files Changed

### 1. `.env` File
**Location:** `/home/kali/Documents/KAHA_Verse/Kaha_restaurant-ecommerce/restaurant-ecommerce/.env`

**Changes:**
```diff
- USE_MOCK_AUTH=true
+ USE_MOCK_AUTH=false

- KAH_API_V3_BASE_URL=https://api.kaha.com.np
+ KAH_API_V3_BASE_URL=https://api.kaha.com.np/main/api/v3
```

---

### 2. Payload Interface
**Location:** `src/common/interfaces/payload.interface.ts`

**Changes:**
```diff
export interface PayloadInterface {
  id: string;
  kahaId: string;
  businessId?: string;
+ role?: string;
}
```

---

### 3. JWT Strategy
**Location:** `src/modules/auth/strategy/jwt.strategy.ts`

**Changes:**
```diff
async validate(payload: PayloadInterface) {
- const { id, kahaId, businessId } = payload;
- return { id, kahaId, businessId };
+ const { id, kahaId, businessId, role } = payload;
+ return { id, kahaId, businessId, role };
}
```

---

### 4. Roles Guard (Enhanced Logging)
**Location:** `src/modules/auth/guards/roles.guard.ts`

**Changes:**
```diff
constructor(...) {
  this.useMockAuth = this.configService.useMockAuth;
  if (this.useMockAuth) {
    this.logger.log('🔓 Mock Auth Mode: ...');
+ } else {
+   this.logger.log('🔒 Production Mode: ...');
+   this.logger.log(`📡 Kaha Main V3 Base URL: ${...}`);
  }
}
```

---

## ✅ Quick Verification

### 1. Check Configuration (30 seconds)
```bash
cd /home/kali/Documents/KAHA_Verse/Kaha_restaurant-ecommerce/restaurant-ecommerce
grep -E "USE_MOCK_AUTH|KAH_API_V3_BASE_URL" .env
```

**Should show:**
```
USE_MOCK_AUTH=false
KAH_API_V3_BASE_URL=https://api.kaha.com.np/main/api/v3
```

---

### 2. Test Kaha Main V3 Login (1 minute)
```bash
curl -X POST https://api.kaha.com.np/main/api/v3/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@kahastays.com","password":"password123"}' | jq '.access_token'
```

**Should return:** JWT token string

---

### 3. Start Backend (1 minute)
```bash
cd /home/kali/Documents/KAHA_Verse/Kaha_restaurant-ecommerce/restaurant-ecommerce
npm run dev
```

**Look for:**
```
🔒 Production Mode: Role verification will use external Kaha Main V3 API
```

---

### 4. Test Protected Endpoint (2 minutes)
```bash
# Use token from step 2
TOKEN="YOUR_TOKEN_HERE"

curl -X POST http://localhost:3001/api/v1/menu \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","description":"Test","price":500,"categoryId":"VALID_CATEGORY_ID"}'
```

**Should return:** Success message (if you have valid category ID)

---

## 🐛 Common Errors & Quick Fixes

### Error: "Failed to fetch business user role"
**Quick Fix:**
```bash
# Verify URL is correct
cat .env | grep KAH_API_V3_BASE_URL
# Should be: https://api.kaha.com.np/main/api/v3
```

---

### Error: "Has required role: false"
**Quick Fix:**
```bash
# Check user role in Kaha Main V3
TOKEN="YOUR_TOKEN"
curl "https://api.kaha.com.np/main/api/v3/business-users/BUSINESS_ID/USER_ID" \
  -H "Authorization: Bearer $TOKEN" | jq '.role.name'
# Should return: "business_super_admin" for admin operations
```

---

### Error: 401 Unauthorized
**Quick Fix:**
```bash
# Get fresh token
curl -X POST https://api.kaha.com.np/main/api/v3/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@kahastays.com","password":"password123"}' | jq '.access_token'
```

---

### Error: Connection Refused
**Quick Fix:**
```bash
# Test Kaha Main V3 connectivity
curl -v https://api.kaha.com.np/main/api/v3/health

# If fails, check if you're using correct URL
cat .env | grep KAHA_API
```

---

## 🎯 What Should Work Now

### ✅ Admin Operations (with valid JWT from Kaha Main V3)
- Create menu items
- Update menu items
- Delete menu items
- Create categories
- Update categories
- Delete categories
- Manage addons
- Manage addon groups

### ✅ Customer Operations (no auth or customer JWT)
- View menu items
- View categories
- View addons
- Add to cart (with customer JWT)
- Create orders (with customer JWT)

### ✅ External Verification
- Backend calls Kaha Main V3 API for role verification
- Roles are checked against business-user relationship
- JWT signature is validated
- Proper authorization for all protected endpoints

---

## 📋 Testing Checklist

Quick 5-minute test:

1. [ ] Backend starts with "Production Mode" log
2. [ ] Can login to Kaha Main V3 and get token
3. [ ] Can view menu items (public endpoint)
4. [ ] Can create menu item with admin token
5. [ ] Cannot create menu item without token (401)
6. [ ] Backend logs show external API calls

---

## 🔗 Full Documentation

- **Detailed Debug Report:** `AUTHENTICATION_DEBUG_REPORT.md`
- **Complete Testing Guide:** `AUTHENTICATION_TESTING_GUIDE.md`
- **Quick Start:** `QUICK_START.md`

---

## 💡 Pro Tips

1. **Always check backend logs** - They show exactly what's happening
2. **Decode JWT tokens** - Use jwt.io to see payload
3. **Test Kaha Main V3 directly** - Verify it's accessible before testing integration
4. **Use jq for JSON** - Makes responses readable: `curl ... | jq`
5. **Save tokens in variables** - `TOKEN="xxx"` then use `$TOKEN`

---

## 🆘 Still Having Issues?

### Step 1: Collect Information
```bash
# Backend logs
npm run dev 2>&1 | tee backend.log

# Environment config
cat .env | grep -v PASSWORD

# Test external API
curl -v https://api.kaha.com.np/main/api/v3/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@kahastays.com","password":"password123"}'
```

### Step 2: Check These
- [ ] PostgreSQL is running
- [ ] Backend is on port 3001
- [ ] Kaha Main V3 is accessible
- [ ] JWT token is valid (not expired)
- [ ] User exists in Kaha Main V3
- [ ] User is associated with business

### Step 3: Review Logs
Look for these patterns in backend logs:
- `[RolesGuard]` - Shows role verification flow
- `[ServiceCommunicationService]` - Shows external API calls
- `Failed to fetch` - Indicates API call errors

---

**Last Updated:** $(date)
**Status:** ✅ Ready to use
