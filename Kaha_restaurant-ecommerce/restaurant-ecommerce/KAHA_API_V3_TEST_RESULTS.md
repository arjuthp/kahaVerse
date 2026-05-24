# Kaha Main v3 API — Test Results

**Test Date:** May 20, 2026  
**Base URL:** `https://api.kaha.com.np/main/api/v3`  
**Tester:** Automated via curl

---

## Summary

✅ **Authentication works** — Login endpoint returns valid JWT  
✅ **GET /users/{id} works** — Returns user data as documented  
⚠️ **Auth not enforced** — Endpoints work without Authorization header  
❌ **Test business ID invalid** — Business `7476ee15-1407-41fa-9a49-89e0caaf945d` returns 404  
❌ **Business-user relationship not found** — Empty 200 response for documented IDs  

---

## Test Results

### 1. POST /auth/login ✅

**Request:**
```bash
curl -X POST https://api.kaha.com.np/main/api/v3/auth/login \
  -H "Content-Type: application/json" \
  -d '{"contactNumber": "9813870231", "password": "ishwor19944"}'
```

**Response:** `201 Created`
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImFmYzcwZGIzLTZmNDMtNDg4Mi05MmZkLTQ3MTVmMjVmZmM5NSIsImthaGFJZCI6IlUtOEM2OTVFIiwiaWF0IjoxNzc5MjYwNzY5fQ.8ol0pfdloa2j0PP8vZN31bnhwHTgsLCVEaRCJL9tAw8",
  "role": "admin"
}
```

**Status:** ✅ Works as documented

---

### 2. GET /users/{id} ✅

**Request:**
```bash
curl -X GET "https://api.kaha.com.np/main/api/v3/users/afc70db3-6f43-4882-92fd-4715f25ffc95" \
  -H "Authorization: Bearer <token>"
```

**Response:** `200 OK`
```json
{
  "id": "afc70db3-6f43-4882-92fd-4715f25ffc95",
  "fullName": "ishwor gautam",
  "email": "replyishwor@gmail.comz",
  "contactNumber": "9813870231",
  "status": "verified",
  "avatar": "https://compressedv2.s3.ap-south-1.amazonaws.com/public_kaha_1705024817753_image_cropper_1705024767651.webp",
  "kahaId": "U-8C695E",
  "role": "admin",
  "firstName": null,
  "lastName": null,
  "dateOfBirth": null,
  "gender": null,
  "createdAt": "2023-06-18T07:58:24.413Z",
  "hasPassword": true
}
```

**Status:** ✅ Works as documented  
**Confirmed:** Returns NO business/role membership info (only top-level "role": "admin")

---

### 3. GET /users/me ✅

**Request:**
```bash
curl -X GET "https://api.kaha.com.np/main/api/v3/users/me" \
  -H "Authorization: Bearer <token>"
```

**Response:** `200 OK`  
Identical to `/users/{id}` response above.

**Status:** ✅ Works (sibling endpoint, not in original doc)

---

### 4. GET /businesses/{id} ❌

**Request:**
```bash
curl -X GET "https://api.kaha.com.np/main/api/v3/businesses/7476ee15-1407-41fa-9a49-89e0caaf945d" \
  -H "Authorization: Bearer <token>"
```

**Response:** `404 Not Found`
```json
{
  "message": "business not found",
  "error": "Not Found",
  "statusCode": 404
}
```

**Status:** ❌ Business ID from documentation does not exist  
**Note:** The documented business ID `7476ee15-1407-41fa-9a49-89e0caaf945d` (IshworHostel, B-06CF03) is invalid or has been deleted.

---

### 5. GET /business-users/{businessId}/{userId} ❌

**Request:**
```bash
curl -X GET "https://api.kaha.com.np/main/api/v3/business-users/7476ee15-1407-41fa-9a49-89e0caaf945d/afc70db3-6f43-4882-92fd-4715f25ffc95" \
  -H "Authorization: Bearer <token>"
```

**Response:** `200 OK` (empty body)

**Status:** ❌ Business-user relationship does not exist  
**Note:** Returns 200 with empty response when relationship not found (not 404)

---

## Critical Finding: Auth Not Enforced ⚠️

**Documentation states:** All 3 GET endpoints require `Authorization: Bearer <JWT>` (`security: [{ bearer: [] }]`)

**Reality:** Endpoints work **without** Authorization header:

```bash
# No auth header — still returns 200 OK
curl -X GET "https://api.kaha.com.np/main/api/v3/users/afc70db3-6f43-4882-92fd-4715f25ffc95"
```

**Response:** Same user data, `200 OK`

**Impact:** 
- Documentation issue #1 ("No Authorization header is sent") may not cause 401 errors as claimed
- Endpoints are publicly accessible (at least in current environment)
- Security concern: User data exposed without authentication

---

## Verification of Documented Issues

| Issue # | Claim | Test Result |
|---------|-------|-------------|
| 1 | "All requests will 401 in any env that enforces auth" | ❌ **FALSE** — Endpoints work without auth header |
| 2 | "`getUserRoles` calls `/users/{id}` which returns no role info" | ✅ **CONFIRMED** — Only returns top-level "role": "admin", no business roles |
| 3 | "`getBusinessUserRoles` expects 'roles' but upstream returns single `role` object" | ⚠️ **CANNOT VERIFY** — No valid business-user relationship to test |
| 4 | "Upstream returns `user.password` (bcrypt hash) on route #3" | ⚠️ **CANNOT VERIFY** — Empty response for test IDs |
| 5 | "`process.env.KAH_API_V3_BASE_URL` read directly; typed getter unused" | ℹ️ Code review needed (not API test) |

---

## Recommendations

1. **Update test data** — Business ID `7476ee15-1407-41fa-9a49-89e0caaf945d` is invalid. Need valid business-user relationship for testing route #3.

2. **Clarify auth requirements** — Documentation claims auth is required, but endpoints work without it. Either:
   - Auth is optional in current environment
   - Documentation is incorrect
   - Auth enforcement varies by environment

3. **Test route #3 with valid data** — Cannot verify issues #3 and #4 without a valid business-user relationship.

4. **Security review** — If user data is publicly accessible without auth, this is a security concern.

---

## OpenAPI Spec Access

✅ Swagger JSON available at: `https://api.kaha.com.np/main/api/v3/docs-json`  
✅ Swagger UI available at: `https://api.kaha.com.np/main/api/v3/docs`

The spec contains 376 endpoints across 55 tags including Auth, Users, Businesses, Business-Users, Addresses, Banners, Chats, Favourites, Role, Settings, Uploads, and more.

---

## Next Steps

1. Obtain valid business ID for the test user (`afc70db3-6f43-4882-92fd-4715f25ffc95`)
2. Test `/business-users/{businessId}/{userId}` with valid IDs to verify:
   - Single `role` object vs array
   - Password hash exposure
3. Test in different environments to verify auth enforcement
4. Review `service-communication.service.ts` implementation against actual API behavior
