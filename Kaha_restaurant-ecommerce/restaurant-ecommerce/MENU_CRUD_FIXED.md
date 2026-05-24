# Menu CRUD Operations - FIXED ✅

## Issue Fixed
**Problem**: UpdateMenuDto had `businessId` as a required field, but the controller extracts it from JWT token.

**Solution**: Removed `businessId` field from `UpdateMenuDto` to match `CreateMenuDto` pattern.

---

## Working Examples

### 1. CREATE Menu
```bash
POST http://localhost:3001/api/v1/menu
Headers:
  Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImFkbWluLW1vY2stMDAxIiwia2FoYUlkIjoia2FoYS1hZG1pbi0wMDEiLCJidXNpbmVzc0lkIjoiYml6LW1vY2stMDAxIiwiZW1haWwiOiJhZG1pbkB0ZXN0LmNvbSIsInJvbGUiOiJCVVNJTkVTU19TVVBFUl9BRE1JTiIsImlhdCI6MTc3OTI0MzU1OSwiZXhwIjoxNzgxODM1NTU5fQ.bgpNW3hddZ86L41Yyam_JrbupoCjkKn7CclEUFgvPaY
  Content-Type: application/json

Body:
{
  "name": "New Menu Item",
  "categoryId": "cec0cc8a-3682-4801-aec9-8cffe231ad3c",
  "description": "Description here",
  "price": 25.99,
  "isAvailable": true,
  "allowAddOns": false
}
```

### 2. UPDATE Menu
```bash
PATCH http://localhost:3001/api/v1/menu/886e26da-fa37-4030-9a60-a885b690c549
Headers:
  Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImFkbWluLW1vY2stMDAxIiwia2FoYUlkIjoia2FoYS1hZG1pbi0wMDEiLCJidXNpbmVzc0lkIjoiYml6LW1vY2stMDAxIiwiZW1haWwiOiJhZG1pbkB0ZXN0LmNvbSIsInJvbGUiOiJCVVNJTkVTU19TVVBFUl9BRE1JTiIsImlhdCI6MTc3OTI0MzU1OSwiZXhwIjoxNzgxODM1NTU5fQ.bgpNW3hddZ86L41Yyam_JrbupoCjkKn7CclEUFgvPaY
  Content-Type: application/json

Body:
{
  "name": "Updated Menu Name",
  "categoryId": "cec0cc8a-3682-4801-aec9-8cffe231ad3c",
  "description": "Updated description",
  "price": 499.99,
  "isAvailable": true
}
```

### 3. GET All Menus
```bash
GET http://localhost:3001/api/v1/menu/biz-mock-001
```

### 4. GET Menu by ID
```bash
GET http://localhost:3001/api/v1/menu/886e26da-fa37-4030-9a60-a885b690c549
```

### 5. DELETE Menu
```bash
DELETE http://localhost:3001/api/v1/menu/886e26da-fa37-4030-9a60-a885b690c549
Headers:
  Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImFkbWluLW1vY2stMDAxIiwia2FoYUlkIjoia2FoYS1hZG1pbi0wMDEiLCJidXNpbmVzc0lkIjoiYml6LW1vY2stMDAxIiwiZW1haWwiOiJhZG1pbkB0ZXN0LmNvbSIsInJvbGUiOiJCVVNJTkVTU19TVVBFUl9BRE1JTiIsImlhdCI6MTc3OTI0MzU1OSwiZXhwIjoxNzgxODM1NTU5fQ.bgpNW3hddZ86L41Yyam_JrbupoCjkKn7CclEUFgvPaY
```

---

## Postman Setup

### In Headers Tab (NOT Authorization Tab):
```
Key: Authorization
Value: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImFkbWluLW1vY2stMDAxIiwia2FoYUlkIjoia2FoYS1hZG1pbi0wMDEiLCJidXNpbmVzc0lkIjoiYml6LW1vY2stMDAxIiwiZW1haWwiOiJhZG1pbkB0ZXN0LmNvbSIsInJvbGUiOiJCVVNJTkVTU19TVVBFUl9BRE1JTiIsImlhdCI6MTc3OTI0MzU1OSwiZXhwIjoxNzgxODM1NTU5fQ.bgpNW3hddZ86L41Yyam_JrbupoCjkKn7CclEUFgvPaY
```

---

## Key Values
- **Token**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImFkbWluLW1vY2stMDAxIiwia2FoYUlkIjoia2FoYS1hZG1pbi0wMDEiLCJidXNpbmVzc0lkIjoiYml6LW1vY2stMDAxIiwiZW1haWwiOiJhZG1pbkB0ZXN0LmNvbSIsInJvbGUiOiJCVVNJTkVTU19TVVBFUl9BRE1JTiIsImlhdCI6MTc3OTI0MzU1OSwiZXhwIjoxNzgxODM1NTU5fQ.bgpNW3hddZ86L41Yyam_JrbupoCjkKn7CclEUFgvPaY`
- **Business ID**: `biz-mock-001`
- **User ID**: `admin-mock-001`
- **Category ID (Burgers)**: `cec0cc8a-3682-4801-aec9-8cffe231ad3c`
- **Category ID (Food)**: `2ef726f3-a533-4f30-9eb0-5913373fc908`
- **Sample Menu ID**: `886e26da-fa37-4030-9a60-a885b690c549`

---

## Important Notes
1. **DO NOT** include `businessId` in CREATE or UPDATE request bodies - it's extracted from JWT
2. Use Headers tab in Postman, NOT Authorization tab (variable resolution issues)
3. All protected endpoints require the Bearer token
4. Mock auth is enabled: `USE_MOCK_AUTH=true` in `.env`
