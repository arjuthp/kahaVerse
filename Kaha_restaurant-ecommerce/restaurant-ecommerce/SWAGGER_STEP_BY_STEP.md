# 🔐 Swagger Authorization - Step by Step Guide

## ⚠️ IMPORTANT: Token Format in Swagger

When you click "Authorize" in Swagger UI, there are **TWO different ways** to enter the token:

### ❌ WRONG WAY (causes 401 error):
If you paste the FULL token including "Bearer ":
```
Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```
**This will FAIL** because Swagger adds "Bearer " automatically!

### ✅ CORRECT WAY:
Paste ONLY the token WITHOUT "Bearer ":
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjEyMzQ1Njc4LTkwYWItY2RlZi0xMjM0LTU2Nzg5MGFiY2RlZiIsImthaGFJZCI6ImthaGEtMTIzNDU2NzgtOTBhYi1jZGVmLTEyMzQtNTY3ODkwYWJjZGVmIiwiYnVzaW5lc3NJZCI6ImFiY2RlZjEyLTM0NTYtNzg5MC1hYmNkLWVmMTIzNDU2Nzg5MCIsImlhdCI6MTc3OTMzNjM1NiwiZXhwIjoxODEwODcyMzU2fQ.ilimSTU06an8xoTFHmblTa-P3PM8pWj_tTj_7oHPkRc
```

---

## 📋 Step-by-Step Instructions

### Step 1: Open Swagger UI
```
http://localhost:3001/api/v1/docs
```

### Step 2: Click the "Authorize" Button
- Look for the green **"Authorize"** button at the top right
- It has a lock icon 🔒
- Click it

### Step 3: Enter Token (WITHOUT "Bearer ")
In the popup dialog, you'll see a field labeled "Value"

**Copy and paste THIS (without "Bearer "):**
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjEyMzQ1Njc4LTkwYWItY2RlZi0xMjM0LTU2Nzg5MGFiY2RlZiIsImthaGFJZCI6ImthaGEtMTIzNDU2NzgtOTBhYi1jZGVmLTEyMzQtNTY3ODkwYWJjZGVmIiwiYnVzaW5lc3NJZCI6ImFiY2RlZjEyLTM0NTYtNzg5MC1hYmNkLWVmMTIzNDU2Nzg5MCIsImlhdCI6MTc3OTMzNjM1NiwiZXhwIjoxODEwODcyMzU2fQ.ilimSTU06an8xoTFHmblTa-P3PM8pWj_tTj_7oHPkRc
```

### Step 4: Click "Authorize"
- Click the blue "Authorize" button in the dialog
- You should see a checkmark ✓
- Click "Close"

### Step 5: Test an Endpoint
- Scroll to any endpoint (e.g., POST /api/v1/order)
- Click "Try it out"
- The request body will be pre-filled
- Click "Execute"
- You should get a response (not 401)

---

## 🧪 Quick Test

### Test with curl (this works):
```bash
curl -X POST http://localhost:3001/api/v1/order \
  -H 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjEyMzQ1Njc4LTkwYWItY2RlZi0xMjM0LTU2Nzg5MGFiY2RlZiIsImthaGFJZCI6ImthaGEtMTIzNDU2NzgtOTBhYi1jZGVmLTEyMzQtNTY3ODkwYWJjZGVmIiwiYnVzaW5lc3NJZCI6ImFiY2RlZjEyLTM0NTYtNzg5MC1hYmNkLWVmMTIzNDU2Nzg5MCIsImlhdCI6MTc3OTMzNjM1NiwiZXhwIjoxODEwODcyMzU2fQ.ilimSTU06an8xoTFHmblTa-P3PM8pWj_tTj_7oHPkRc' \
  -H 'Content-Type: application/json' \
  -d '{"businessId":"abcdef12-3456-7890-abcd-ef1234567890","serviceType":"DINE_IN","orderItems":[]}'
```

**Expected:** 400 error (orderItems must contain at least 1 element) - this means auth worked!

---

## 🔍 Troubleshooting

### Still Getting 401?

1. **Check the token format in Swagger:**
   - ❌ Should NOT start with "Bearer "
   - ✅ Should start with "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9"

2. **Refresh the Swagger page:**
   - Press Ctrl+Shift+R (hard refresh)
   - Re-authorize with the token

3. **Check server is running:**
   ```bash
   curl http://localhost:3001/api/v1
   ```
   Should return: "Kaha Restaurant E-Commerce API is running!"

4. **Check server logs:**
   - Look for any authentication errors
   - Verify JWT strategy is loaded

### Token Comparison:

**For curl commands (include "Bearer "):**
```
Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**For Swagger UI (NO "Bearer "):**
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## 📸 Visual Guide

### What You Should See:

1. **Authorize Dialog:**
   ```
   ┌─────────────────────────────────────┐
   │ Available authorizations            │
   │                                     │
   │ bearer (http, Bearer)               │
   │ Value: [paste token here]           │
   │                                     │
   │ [Authorize] [Close]                 │
   └─────────────────────────────────────┘
   ```

2. **After Authorization:**
   - Lock icons change from open 🔓 to closed 🔒
   - You'll see "Authorized" text

3. **Testing Endpoint:**
   ```
   POST /api/v1/order
   [Try it out] button
   
   Request body (pre-filled):
   {
     "businessId": "string",
     "serviceType": "DINE_IN",
     ...
   }
   
   [Execute] button
   ```

---

## ✅ Success Indicators

You'll know it's working when:
- ✅ No 401 Unauthorized errors
- ✅ You get validation errors (400) instead - means auth passed!
- ✅ Lock icons show as closed 🔒
- ✅ Responses include actual data

---

## 🎯 Token for Copy-Paste

**For Swagger UI (paste this):**
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjEyMzQ1Njc4LTkwYWItY2RlZi0xMjM0LTU2Nzg5MGFiY2RlZiIsImthaGFJZCI6ImthaGEtMTIzNDU2NzgtOTBhYi1jZGVmLTEyMzQtNTY3ODkwYWJjZGVmIiwiYnVzaW5lc3NJZCI6ImFiY2RlZjEyLTM0NTYtNzg5MC1hYmNkLWVmMTIzNDU2Nzg5MCIsImlhdCI6MTc3OTMzNjM1NiwiZXhwIjoxODEwODcyMzU2fQ.ilimSTU06an8xoTFHmblTa-P3PM8pWj_tTj_7oHPkRc
```

**For curl/Postman (use this):**
```
Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjEyMzQ1Njc4LTkwYWItY2RlZi0xMjM0LTU2Nzg5MGFiY2RlZiIsImthaGFJZCI6ImthaGEtMTIzNDU2NzgtOTBhYi1jZGVmLTEyMzQtNTY3ODkwYWJjZGVmIiwiYnVzaW5lc3NJZCI6ImFiY2RlZjEyLTM0NTYtNzg5MC1hYmNkLWVmMTIzNDU2Nzg5MCIsImlhdCI6MTc3OTMzNjM1NiwiZXhwIjoxODEwODcyMzU2fQ.ilimSTU06an8xoTFHmblTa-P3PM8pWj_tTj_7oHPkRc
```

---

**Remember: Swagger adds "Bearer " automatically, so DON'T include it!** 🚀
