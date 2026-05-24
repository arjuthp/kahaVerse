# 🚀 Quick Start: Automated Swagger Testing

## What You Have Now

✅ **Automated Swagger/Postman API Testing** - Similar to Jest API integration tests but for OpenAPI/Swagger specs

## One-Minute Setup

### 1️⃣ **Start API Server** (Terminal 1)
```bash
cd /home/kali/Documents/KAHA_Verse/Kaha_restaurant-ecommerce/restaurant-ecommerce
npm run start:prod
```

### 2️⃣ **Run Tests** (Terminal 2)
```bash
cd /home/kali/Documents/KAHA_Verse/Kaha_restaurant-ecommerce/restaurant-ecommerce
npm run test:swagger
```

### 3️⃣ **View Results**
- **Console Output:** Direct in Terminal 2
- **JSON Report:** `test-reports/swagger-test-report-*.json`
- **HTML Report:** `test-reports/swagger-test-report-*.html` (open in browser)

---

## Available NPM Scripts

```bash
# Full test run with all reports (JSON + HTML)
npm run test:swagger

# CI/CD friendly (JSON only)
npm run test:swagger:ci

# Jest integration tests (TypeScript)
npm run test:e2e

# All tests (Jest + Swagger)
npm run test:swagger && npm run test:e2e
```

---

## What Gets Tested ✅

- **Health Check** - API connectivity
- **Categories** - CRUD operations
- **Menu Items** - CRUD operations
- **Addons & Groups** - CRUD operations
- **Cart** - Add, update, remove items
- **Orders** - Create, retrieve, track
- **Menu Ratings** - Create, update, delete
- **Authentication** - Bearer tokens, roles
- **Edge Cases** - Validation, errors
- **Performance** - Response times

---

## Test Results (Example)

```
KAHA Restaurant - Complete CRUD & Edge Cases Tests

❏ 🏥 Health Check
↳ GET - Health Check
  GET http://localhost:3001/api/v1  
  200 OK ★ 22ms
  ✓ Status code is 200

[... more tests ...]

Summary:
✅ Assertions Passed: 45
❌ Assertions Failed: 0
```

---

## Customizing Tests

### **Add/Edit Test Cases**
Open in Postman:
```bash
# Import into Postman
File → Open → KAHA_Restaurant_Complete_Tests.postman_collection.json
```

### **Change Test URL**
Edit environment:
```bash
# For production testing, edit this file:
postman/Kaha-Restaurant-Production.postman_environment.json

# Change baseUrl to your production server
"baseUrl": "https://your-api.com/api/v1"
```

### **View Detailed Report**
```bash
# View latest JSON report
cat test-reports/swagger-test-report-*.json | jq .

# View latest HTML report
open test-reports/swagger-test-report-*.html
```

---

## Integration with CI/CD

### **GitHub Actions**
```yaml
- name: Run Swagger Tests
  run: npm run test:swagger:ci
```

### **GitLab CI**
```yaml
test:swagger:
  script:
    - npm run test:swagger:ci
```

---

## Tools Used

- **Newman** - Postman CLI runner for automated testing
- **Newman HTML Reporter** - Generate visual test reports
- **Postman Collections** - Test cases and workflows
- **Your Existing API** - Production/staging server

---

## Troubleshooting

| Error | Fix |
|-------|-----|
| `connect ECONNREFUSED 127.0.0.1:3001` | Start API server: `npm run start:prod` |
| `ENOTFOUND restaurant.kaha.com.np` | External service - ignore if testing local API |
| `401 Unauthorized` | Update auth token in environment file |
| `HTML report not generated` | HTML reporter installed with `--legacy-peer-deps` |

---

## Full Documentation

See [SWAGGER_AUTOMATED_TESTING.md](./SWAGGER_AUTOMATED_TESTING.md) for detailed guide including:
- Advanced configurations
- Custom test filters
- Performance tuning
- Parallel execution
- Production testing workflows

---

**Status:** ✅ Production-Ready

Last Updated: May 21, 2026
