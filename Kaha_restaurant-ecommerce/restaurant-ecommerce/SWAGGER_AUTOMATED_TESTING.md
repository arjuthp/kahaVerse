# Automated Swagger/Postman API Testing Guide

## Overview

This guide explains how to use **Newman** to automatically test your Swagger/OpenAPI endpoints, just like the Jest API integration tests. Newman is the CLI companion for Postman that allows you to run API test collections programmatically.

---

## Quick Start

### 1. **Run Tests Locally (Development)**

```bash
npm run test:swagger
```

This will:
- ✅ Load your Postman collection
- ✅ Load the production environment variables
- ✅ Execute all API test cases
- ✅ Generate JSON and HTML reports
- ✅ Display results in console

### 2. **Run Tests for CI/CD Pipeline**

```bash
npm run test:swagger:ci
```

This exports results as JSON for CI/CD integration.

---

## What Gets Tested

Your Postman collection tests all API endpoints:

### ✅ **Health & Connectivity**
- GET `/api/v1` - Health check
- API server connectivity verification

### ✅ **Category Management (CRUD)**
- Create categories
- Read/Retrieve categories
- Update categories
- Delete categories
- Validation & edge cases

### ✅ **Menu Items (CRUD)**
- Create menu items
- Read menu items
- Update menu items
- Delete menu items
- Pagination & filtering

### ✅ **Addons & Addon Groups (CRUD)**
- Create addons and groups
- Manage addon pricing
- Update addon associations
- Delete addons

### ✅ **Cart Operations**
- Add items to cart
- View cart
- Update cart quantities
- Remove items from cart
- Cart validation

### ✅ **Order Processing**
- Create orders from cart
- Get order details
- Order status tracking
- Order history

### ✅ **Menu Ratings**
- Create ratings
- Update ratings
- Delete ratings
- Retrieve rating statistics

### ✅ **Authentication & Authorization**
- Bearer token validation
- Role-based access control
- Business isolation

### ✅ **Edge Cases & Error Handling**
- Invalid inputs
- Missing fields
- Unauthorized access
- Not found scenarios
- Validation errors

---

## Test Reports

After running tests, you'll find reports in `test-reports/`:

### **JSON Report**
```bash
cat test-reports/swagger-test-report-*.json
```

Contains:
- All test execution details
- Assertions passed/failed
- Response times
- Error details

### **HTML Report**
```bash
# Open in browser
open test-reports/swagger-test-report-*.html
```

Visual dashboard showing:
- Pass/fail status
- Request/response details
- Performance metrics
- Timeline view

---

## Prerequisites

### 1. **Start the API Server**

```bash
# Terminal 1 - Start API server
npm run start:prod
# or for development
npm run dev
```

Server should be running at `http://localhost:3001`

### 2. **Environment Configuration**

The tests use `postman/Kaha-Restaurant-Production.postman_environment.json` with:
- `baseUrl`: `http://localhost:3001/api/v1`
- `authToken`: Pre-configured mock JWT token
- Business IDs, User IDs, and other test data

---

## Customizing Tests

### **1. Add New Test Cases**

Edit the Postman collection:
```bash
# Open in Postman UI
# File → Open → KAHA_Restaurant_Complete_Tests.postman_collection.json
```

### **2. Update Environment Variables**

Edit production environment:
```json
// postman/Kaha-Restaurant-Production.postman_environment.json
{
  "key": "baseUrl",
  "value": "http://localhost:3001/api/v1"  // Change this to your production URL
}
```

### **3. Run Specific Tests**

Use Newman filters:
```bash
npx newman run KAHA_Restaurant_Complete_Tests.postman_collection.json \
  --environment postman/Kaha-Restaurant-Production.postman_environment.json \
  --folder "Category CRUD"  # Run only this folder
```

---

## Production Testing

To test against your production API:

### **1. Create Production Environment**

```bash
# Create new environment file
cp postman/Kaha-Restaurant-Production.postman_environment.json \
   postman/Kaha-Restaurant-Production-Live.postman_environment.json
```

### **2. Update URLs**

Edit the new environment file:
```json
{
  "key": "baseUrl",
  "value": "https://your-production-api.com/api/v1"  // Your production URL
}
```

### **3. Update Auth Token**

Get a valid token from your production environment:
```json
{
  "key": "authToken",
  "value": "your-production-jwt-token"
}
```

### **4. Run Against Production**

```bash
npx newman run KAHA_Restaurant_Complete_Tests.postman_collection.json \
  --environment postman/Kaha-Restaurant-Production-Live.postman_environment.json \
  --reporters cli,json,html \
  --reporter-json-export test-reports/production-results.json
```

---

## NPM Scripts Reference

| Script | Purpose |
|--------|---------|
| `npm run test:swagger` | Run full test suite with reports |
| `npm run test:swagger:ci` | CI/CD compatible output (JSON only) |
| `npm run test:e2e` | Jest API integration tests (TypeScript) |
| `npm test` | Jest unit tests |
| `npm run test:cov` | Unit tests with coverage |

---

## Comparison: Jest vs. Swagger Testing

| Aspect | Jest E2E | Swagger/Newman |
|--------|----------|-----------------|
| **Type** | TypeScript integration tests | Postman collection tests |
| **Coverage** | Internal API logic | External API endpoints |
| **Language** | TypeScript/JavaScript | JSON/Collections |
| **Mock Auth** | ✅ Full JWT generation | ✅ Pre-configured tokens |
| **Test Data** | ✅ Database seeding | ✅ Environment variables |
| **CI/CD** | ✅ Built-in | ✅ Excellent |
| **Visual Reports** | ✅ Coverage reports | ✅ HTML dashboards |
| **Debugging** | ✅ Source code debugging | ✅ Network inspection |

**Recommended Flow:**
1. Use **Jest** for unit and integration testing during development
2. Use **Swagger/Newman** for API endpoint validation and production testing
3. Run both in CI/CD pipeline for comprehensive coverage

---

## Troubleshooting

### **Connection Refused Error**
```
Error: connect ECONNREFUSED 127.0.0.1:3001
```

**Solution:** Start your API server
```bash
npm run dev
# Wait for "Listening on port 3001" message
```

### **Authentication Failures**
```
401 Unauthorized
```

**Solution:** Update token in environment:
```bash
npm run seed:mock-jwt
# Copy generated token to postman/Kaha-Restaurant-Production.postman_environment.json
```

### **Invalid Environment File**
```
Error: reading environment from [file]
```

**Solution:** Verify JSON syntax:
```bash
cat postman/Kaha-Restaurant-Production.postman_environment.json | jq .
```

---

## Advanced Configuration

### **Parallel Test Execution**

Run multiple collections in parallel:
```bash
npm run test:swagger:ci & \
npm run test:e2e
```

### **Timeout Configuration**

Adjust timeouts in Newman:
```bash
npx newman run collection.json \
  --request-timeout 5000 \  # 5 seconds
  --global-timeout 30000    # 30 seconds max
```

### **Custom Reporters**

Add JUnit XML reporter for CI systems:
```bash
npm install -D newman-reporter-junitxml
npx newman run collection.json \
  --reporters cli,junitxml \
  --reporter-junitxml-export results.xml
```

---

## Integration with CI/CD

### **GitHub Actions Example**

```yaml
- name: Run Swagger Tests
  run: npm run test:swagger:ci
  
- name: Upload Results
  uses: actions/upload-artifact@v2
  if: always()
  with:
    name: swagger-test-results
    path: test-reports/
```

### **GitLab CI Example**

```yaml
test:swagger:
  script:
    - npm run test:swagger:ci
  artifacts:
    paths:
      - test-reports/
    reports:
      junit: test-reports/results.xml
```

---

## Resources

- **Newman Documentation**: https://learning.postman.com/docs/running-collections/using-newman-cli/
- **Postman Collections**: https://learning.postman.com/docs/collections/collections-overview/
- **Postman Environments**: https://learning.postman.com/docs/sending-requests/managing-environments/
- **OpenAPI/Swagger**: https://swagger.io/specification/

---

## Next Steps

1. ✅ Start your API server (`npm run dev`)
2. ✅ Run tests (`npm run test:swagger`)
3. ✅ Review HTML report in browser
4. ✅ Fix any failing tests
5. ✅ Integrate into your CI/CD pipeline

---

**Last Updated:** May 21, 2026
