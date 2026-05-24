# 🚀 KAHA Restaurant API - Complete Testing Guide

## 📋 Overview

This guide covers the **complete comprehensive test suite** for the KAHA Restaurant E-Commerce API with **131 test cases** covering all modules, CRUD operations, edge cases, and error scenarios.

## 📦 What's Included

### Complete Test Collection
- **File**: `KAHA_Restaurant_Complete_Tests.postman_collection.json`
- **Total Modules**: 8
- **Total Test Cases**: 131
- **Coverage**: All CRUD operations + Edge cases + Error scenarios

### Modules Covered

1. **🏥 Health Check** (1 test)
   - API availability check

2. **📁 Categories** (17 tests)
   - Create, Read, Update, Delete operations
   - Authorization & permission tests
   - Data validation & error handling

3. **🍔 Menu Items** (23 tests)
   - Full CRUD with complex data structures
   - Price validation, service types
   - Signature item toggles
   - Addon associations

4. **🧩 Addons** (17 tests)
   - Individual addon management
   - Price validation
   - Availability toggles

5. **📦 Addon Groups** (18 tests)
   - Group creation & management
   - Selection type validation (single/multiple)
   - Min/max selection rules
   - Adding/removing addons from groups

6. **🛒 Cart** (17 tests)
   - Cart creation & item management
   - Quantity validation
   - Special instructions
   - Addon selections in cart

7. **📦 Orders** (18 tests)
   - Order creation (DINE_IN, TAKEAWAY, HOME_DELIVERY)
   - Order status management
   - Payment method validation
   - Service type validation

8. **⭐ Menu Ratings** (20 tests)
   - Rating creation (1-5 stars)
   - Rating updates & deletion
   - Visibility toggles
   - Business & menu-specific ratings

## 🎯 Test Categories

### ✅ Happy Path Tests
- Valid data with proper authentication
- Expected successful responses (200, 201)
- Proper data extraction and variable storage

### ❌ Error & Edge Case Tests
- Missing required fields
- Invalid data types
- Out-of-range values (negative prices, invalid ratings)
- Non-existent resource IDs
- Invalid UUID formats
- Unauthorized access (no token)
- Insufficient permissions (wrong role)

### ⚠️ Destructive Tests
- DELETE operations (run last)
- Marked with ⚠️ symbol
- Should be executed after other tests

## 🔧 Setup Instructions

### 1. Import to Postman

```bash
# Option A: Direct Import
1. Open Postman
2. Click "Import" button
3. Select file: KAHA_Restaurant_Complete_Tests.postman_collection.json
4. Click "Import"

# Option B: Drag & Drop
1. Open Postman
2. Drag the JSON file into Postman window
3. Collection will be imported automatically
```

### 2. Configure Environment

The collection includes embedded variables. No additional environment setup needed!

**Pre-configured Variables:**
```javascript
baseUrl: http://localhost:3001/api/v1
authToken: <mock-user-token>
adminToken: <mock-admin-token>
businessId: biz-mock-001
userId: user-mock-001
```

**Dynamic Variables** (auto-populated during tests):
```javascript
categoryId
menuId
addonId
addonGroupId
cartId
cartItemId
orderId
ratingId
```

### 3. Start Your API Server

```bash
# Make sure your API is running
npm run start:dev

# Or with Docker
docker-compose up
```

## 🏃 Running Tests

### Method 1: Run Entire Collection

```
1. Select "KAHA Restaurant - Complete CRUD & Edge Cases Tests"
2. Click "Run" button (or Runner icon)
3. Select all folders or specific modules
4. Click "Run KAHA Restaurant..."
5. View results in real-time
```

### Method 2: Run Individual Modules

```
1. Expand the collection
2. Select a specific module (e.g., "📁 Categories")
3. Click "Run" on that folder
4. Execute module-specific tests
```

### Method 3: Run Individual Tests

```
1. Navigate to specific test
2. Click "Send"
3. View response in bottom panel
```

## 📊 Test Execution Order

### Recommended Sequence

```
1. 🏥 Health Check
   ↓
2. 📁 Categories (Create category first)
   ↓
3. 🍔 Menu Items (Requires categoryId)
   ↓
4. 🧩 Addons (Create addons)
   ↓
5. 📦 Addon Groups (Group addons)
   ↓
6. 🛒 Cart (Add menu items to cart)
   ↓
7. 📦 Orders (Create orders from cart)
   ↓
8. ⭐ Menu Ratings (Rate menu items)
```

### Important Notes

- **Dependencies**: Some tests depend on IDs from previous tests
- **Auto-extraction**: Test scripts automatically save IDs to variables
- **DELETE tests**: Run last (marked with ⚠️)
- **Order matters**: Follow the sequence for best results

## 🧪 Test Scripts Explained

### Auto ID Extraction

Many CREATE tests include scripts like:

```javascript
if (pm.response.code === 201 || pm.response.code === 200) {
    try {
        var jsonData = pm.response.json();
        var categoryId = jsonData.id || jsonData.data?.id || jsonData._id;
        if (categoryId) {
            pm.collectionVariables.set('categoryId', categoryId);
            console.log('Category ID saved:', categoryId);
        }
    } catch(e) {
        console.log('Could not extract category ID:', e);
    }
}
```

This automatically:
1. Checks for successful response
2. Extracts the ID from response
3. Saves it to collection variable
4. Makes it available for subsequent tests

### Status Code Validation

```javascript
pm.test('Status code is 201 or 200', function() {
    pm.expect([200, 201]).to.include(pm.response.code);
});
```

Validates expected success responses.

## 📝 Test Case Examples

### Example 1: Valid Category Creation

```json
POST {{baseUrl}}/categories
Authorization: Bearer {{adminToken}}

{
  "name": "Burgers",
  "icon": "🍔",
  "description": "Delicious burgers",
  "businessId": "{{businessId}}",
  "isAvailable": true,
  "position": 1
}

Expected: 201 Created
Result: categoryId saved to variables
```

### Example 2: Invalid Data Type

```json
POST {{baseUrl}}/categories
Authorization: Bearer {{adminToken}}

{
  "name": 12345,
  "icon": true,
  "isAvailable": "not-a-boolean"
}

Expected: 400 Bad Request
Result: Validation error message
```

### Example 3: Unauthorized Access

```json
POST {{baseUrl}}/categories
(No Authorization header)

{
  "name": "Test Category"
}

Expected: 401 Unauthorized
Result: Authentication error
```

## 🔍 Validation Coverage

### Data Type Validation
- ✅ String fields (name, description)
- ✅ Number fields (price, quantity, rating)
- ✅ Boolean fields (isAvailable, isActive)
- ✅ Array fields (services, images, allergens)
- ✅ Object fields (details, addonInfo)
- ✅ Enum fields (serviceType, paymentMethod, orderStatus)

### Business Logic Validation
- ✅ Negative prices (should fail)
- ✅ Zero quantities (should fail)
- ✅ Rating range (1-5 stars)
- ✅ Required field presence
- ✅ UUID format validation
- ✅ Foreign key existence (categoryId, menuId, etc.)

### Authorization Validation
- ✅ No token (401 Unauthorized)
- ✅ Invalid token (401 Unauthorized)
- ✅ Insufficient permissions (403 Forbidden)
- ✅ Role-based access (BUSINESS_SUPER_ADMIN)

## 📈 Expected Results

### Success Scenarios (✅)
- **Status Codes**: 200 (OK), 201 (Created)
- **Response**: Valid JSON with data
- **Variables**: IDs extracted and saved

### Error Scenarios (❌)
- **Status Codes**: 400 (Bad Request), 401 (Unauthorized), 403 (Forbidden), 404 (Not Found)
- **Response**: Error message with details
- **Validation**: Proper error handling

## 🐛 Troubleshooting

### Issue: Tests Failing with 401 Unauthorized

**Solution**:
```
1. Check if API server is running
2. Verify JWT_SECRET_TOKEN in .env matches mock tokens
3. Update authToken and adminToken in collection variables
```

### Issue: Tests Failing with 404 Not Found

**Solution**:
```
1. Verify baseUrl is correct (http://localhost:3001/api/v1)
2. Check API routes match collection endpoints
3. Ensure database is initialized
```

### Issue: Foreign Key Errors (categoryId, menuId not found)

**Solution**:
```
1. Run tests in sequence (Categories → Menu → Cart → Orders)
2. Check if CREATE tests successfully saved IDs
3. View Postman Console for ID extraction logs
```

### Issue: Variables Not Saving

**Solution**:
```
1. Check test scripts in Pre-request/Tests tabs
2. View Postman Console (View → Show Postman Console)
3. Verify response structure matches extraction logic
```

## 📚 Additional Resources

### Individual Module Collections

If you prefer modular testing, individual collections are available in `/postman/`:

- `Categories.postman_collection.json`
- `Menu.postman_collection.json`
- `Addons.postman_collection.json`
- `AddonGroups.postman_collection.json`
- `Cart.postman_collection.json`
- `Orders.postman_collection.json`
- `MenuRatings.postman_collection.json`

### API Documentation

- `API_ENDPOINTS.md` - Complete endpoint reference
- `DATABASE_SCHEMA.md` - Database structure
- `SWAGGER_ANALYSIS.md` - Swagger/OpenAPI docs

## 🎓 Best Practices

### 1. Run Health Check First
Always verify API is accessible before running tests.

### 2. Follow Execution Order
Respect dependencies between modules (Categories → Menu → Cart → Orders).

### 3. Check Console Logs
Use Postman Console to debug ID extraction and variable storage.

### 4. Run DELETE Tests Last
Destructive operations should be executed after validation tests.

### 5. Use Collection Runner
For comprehensive testing, use Postman's Collection Runner feature.

### 6. Save Responses
Use "Save Response" feature to compare expected vs actual results.

### 7. Environment Variables
Consider creating separate environments for dev/staging/production.

## 📊 Test Coverage Summary

| Module | Total Tests | Create | Read | Update | Delete | Edge Cases |
|--------|-------------|--------|------|--------|--------|------------|
| Health Check | 1 | 0 | 1 | 0 | 0 | 0 |
| Categories | 17 | 5 | 5 | 4 | 3 | 10 |
| Menu | 23 | 6 | 4 | 6 | 3 | 14 |
| Addons | 17 | 6 | 4 | 4 | 2 | 11 |
| Addon Groups | 18 | 4 | 3 | 4 | 2 | 9 |
| Cart | 17 | 6 | 2 | 3 | 2 | 11 |
| Orders | 18 | 7 | 4 | 4 | 0 | 11 |
| Menu Ratings | 20 | 9 | 4 | 3 | 2 | 14 |
| **TOTAL** | **131** | **43** | **27** | **28** | **14** | **80** |

## ✅ Checklist

Before running tests:
- [ ] API server is running
- [ ] Database is initialized and accessible
- [ ] Postman is installed and updated
- [ ] Collection is imported
- [ ] Variables are configured
- [ ] JWT tokens are valid (if using real auth)

During testing:
- [ ] Health check passes
- [ ] Follow execution order
- [ ] Monitor Postman Console
- [ ] Check variable extraction
- [ ] Verify response status codes
- [ ] Review error messages

After testing:
- [ ] All happy path tests pass (✅)
- [ ] All error tests return expected errors (❌)
- [ ] IDs are properly extracted
- [ ] No unexpected failures
- [ ] Document any issues found

## 🎉 Success Criteria

Your API is working correctly if:

1. ✅ All **happy path tests** return 200/201 status codes
2. ✅ All **error tests** return appropriate 4xx status codes
3. ✅ **IDs are extracted** and saved to variables automatically
4. ✅ **Dependent tests** work with extracted IDs
5. ✅ **Authorization** is properly enforced
6. ✅ **Data validation** catches invalid inputs
7. ✅ **Business logic** is correctly implemented

## 📞 Support

If you encounter issues:

1. Check this guide's Troubleshooting section
2. Review API logs for error details
3. Verify database state
4. Check Postman Console for debugging info
5. Refer to API_ENDPOINTS.md for endpoint specifications

---

**Happy Testing! 🚀**

*Last Updated: May 2026*
*Version: 1.0.0*
*Test Cases: 131*
*Coverage: Complete*
