# 🚀 Mock Auth - Quick Start

## ⚡ 3-Step Setup

### 1️⃣ Enable Mock Auth
```bash
# Edit .env
USE_MOCK_AUTH=true
```

### 2️⃣ Start Server
```bash
npm run start:dev
```

Look for: `🧪 MOCK AUTH ENABLED`

### 3️⃣ Use in Postman
```
authToken = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImFkbWluLW1vY2stMDAxIiwia2FoYUlkIjoia2FoYS1hZG1pbi0wMDEiLCJidXNpbmVzc0lkIjoiYml6LW1vY2stMDAxIiwiZW1haWwiOiJhZG1pbkB0ZXN0LmNvbSIsInJvbGUiOiJCVVNJTkVTU19TVVBFUl9BRE1JTiIsImlhdCI6MTc3OTI0MzU1OSwiZXhwIjoxNzgxODM1NTU5fQ.bgpNW3hddZ86L41Yyam_JrbupoCjkKn7CclEUFgvPaY

userId = admin-mock-001
businessId = biz-mock-001
```

---

## 🔑 Mock Tokens (Copy & Paste)

### Admin Token (Recommended for Testing):
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImFkbWluLW1vY2stMDAxIiwia2FoYUlkIjoia2FoYS1hZG1pbi0wMDEiLCJidXNpbmVzc0lkIjoiYml6LW1vY2stMDAxIiwiZW1haWwiOiJhZG1pbkB0ZXN0LmNvbSIsInJvbGUiOiJCVVNJTkVTU19TVVBFUl9BRE1JTiIsImlhdCI6MTc3OTI0MzU1OSwiZXhwIjoxNzgxODM1NTU5fQ.bgpNW3hddZ86L41Yyam_JrbupoCjkKn7CclEUFgvPaY
```

### Regular User Token:
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6InVzZXItbW9jay0wMDEiLCJrYWhhSWQiOiJrYWhhLW1vY2stMDAxIiwiYnVzaW5lc3NJZCI6ImJpei1tb2NrLTAwMSIsImVtYWlsIjoidXNlckB0ZXN0LmNvbSIsInJvbGUiOiJVU0VSIiwiaWF0IjoxNzc5MjQzNTU5LCJleHAiOjE3ODE4MzU1NTl9.bPgJV73sIYKBXCep5nd_ANx2HPU5L_0vo0yWirSbz1s
```

---

## 📋 Mock Data Reference

| Variable | Value |
|----------|-------|
| **userId** | `admin-mock-001` |
| **businessId** | `biz-mock-001` |
| **role** | `business_super_admin` |

---

## ✅ Test It Works

```bash
# Test health check
curl http://localhost:3001

# Test with auth (replace TOKEN)
curl -H "Authorization: Bearer TOKEN" \
  http://localhost:3001/api/v1/categories/biz-mock-001
```

---

## 🔄 Generate New Tokens

```bash
node scripts/generate-mock-tokens.js
```

---

## 📖 Full Documentation

See: `docs/testing/MOCK_AUTH_GUIDE.md`

---

## 🎯 What Mock Auth Does

✅ **Bypasses KAHA Main V3 API** - No external calls
✅ **Returns mock user/business data** - From memory
✅ **Fast & Reliable** - No network delays
✅ **Works Offline** - No internet needed

---

## ⚠️ Remember

- **Development:** `USE_MOCK_AUTH=true`
- **Production:** `USE_MOCK_AUTH=false`

---

**That's it! Start testing! 🎉**
