# KAHA Restaurant E-Commerce - Admin Access Guide

## 🔐 Authentication Issue Fixed

The error "Failed to fetch business user role" occurs because you need to be authenticated as a **Business Admin** to create categories and manage menu items.

---

## 🚀 Quick Solution - Use Mock Login Page

### Option 1: Browser Login (Easiest)

1. **Open the Mock Login Page:**
   ```bash
   xdg-open file:///home/kali/Documents/KAHA_Verse/MOCK_LOGIN.html
   ```
   Or navigate to: `file:///home/kali/Documents/KAHA_Verse/MOCK_LOGIN.html`

2. **Select User Type:**
   - **Business Admin** (Recommended for admin panel)
   - Business Owner (Full access)
   - Regular User (Customer access only)

3. **Click Login:**
   - Token will be saved to localStorage
   - You'll be redirected to http://localhost:5173
   - You can now create categories, menu items, etc.

---

## 🔑 Manual Token Setup

If you prefer to set the token manually in the browser console:

### Step 1: Open Browser Console
1. Go to http://localhost:5173
2. Press `F12` or `Ctrl+Shift+I` to open Developer Tools
3. Go to the **Console** tab

### Step 2: Set Admin Token

Copy and paste this into the console:

```javascript
// Business Admin Token (30 days validity)
const adminToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImFkbWluLW1vY2stMDAxIiwia2FoYUlkIjoia2FoYS1hZG1pbi0wMDEiLCJidXNpbmVzc0lkIjoiYml6LW1vY2stMDAxIiwiZW1haWwiOiJhZG1pbkB0ZXN0LmNvbSIsInJvbGUiOiJCVVNJTkVTU19TVVBFUl9BRE1JTiIsImlhdCI6MTc3OTYwMTk5NywiZXhwIjoxNzgyMTkzOTk3fQ.ugCTcsykEiGgppBCz3GFfBtA_069Hu7NmKFg2-BGsaw';

const adminUser = {
    id: 'admin-mock-001',
    kahaId: 'kaha-admin-001',
    businessId: 'biz-mock-001',
    email: 'admin@test.com',
    role: 'BUSINESS_SUPER_ADMIN'
};

// Save to localStorage
localStorage.setItem('kaha_token', adminToken);
localStorage.setItem('kaha_user', JSON.stringify(adminUser));

// Reload page
location.reload();
```

### Step 3: Verify Login
After the page reloads, you should be logged in as Business Admin and can:
- ✅ Create categories
- ✅ Add menu items
- ✅ Manage variants
- ✅ Configure addon groups
- ✅ View orders

---

## 👥 Available Mock Users

### 1. Regular User (Customer)
```javascript
{
  id: 'user-mock-001',
  kahaId: 'kaha-mock-001',
  businessId: 'biz-mock-001',
  email: 'user@test.com',
  role: 'USER'
}
```
**Token:**
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6InVzZXItbW9jay0wMDEiLCJrYWhhSWQiOiJrYWhhLW1vY2stMDAxIiwiYnVzaW5lc3NJZCI6ImJpei1tb2NrLTAwMSIsImVtYWlsIjoidXNlckB0ZXN0LmNvbSIsInJvbGUiOiJVU0VSIiwiaWF0IjoxNzc5NjAxOTk3LCJleHAiOjE3ODIxOTM5OTd9.h3EaxNAA59OrAmghQ3RUluXeL2w6tUPEXrROh4z3728
```

**Permissions:**
- Browse menu
- Add to cart
- Create orders
- Rate menu items

---

### 2. Business Admin (Recommended) ⭐
```javascript
{
  id: 'admin-mock-001',
  kahaId: 'kaha-admin-001',
  businessId: 'biz-mock-001',
  email: 'admin@test.com',
  role: 'BUSINESS_SUPER_ADMIN'
}
```
**Token:**
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImFkbWluLW1vY2stMDAxIiwia2FoYUlkIjoia2FoYS1hZG1pbi0wMDEiLCJidXNpbmVzc0lkIjoiYml6LW1vY2stMDAxIiwiZW1haWwiOiJhZG1pbkB0ZXN0LmNvbSIsInJvbGUiOiJCVVNJTkVTU19TVVBFUl9BRE1JTiIsImlhdCI6MTc3OTYwMTk5NywiZXhwIjoxNzgyMTkzOTk3fQ.ugCTcsykEiGgppBCz3GFfBtA_069Hu7NmKFg2-BGsaw
```

**Permissions:**
- All customer permissions
- Create/edit/delete categories
- Create/edit/delete menu items
- Manage variants and addons
- View all orders
- Manage ratings visibility

---

### 3. Business Owner
```javascript
{
  id: 'owner-mock-001',
  kahaId: 'kaha-owner-001',
  businessId: 'biz-mock-001',
  email: 'owner@test.com',
  role: 'BUSINESS_OWNER'
}
```
**Token:**
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6Im93bmVyLW1vY2stMDAxIiwia2FoYUlkIjoia2FoYS1vd25lci0wMDEiLCJidXNpbmVzc0lkIjoiYml6LW1vY2stMDAxIiwiZW1haWwiOiJvd25lckB0ZXN0LmNvbSIsInJvbGUiOiJCVVNJTkVTU19PV05FUiIsImlhdCI6MTc3OTYwMTk5NywiZXhwIjoxNzgyMTkzOTk3fQ.FK98MTSSfhnRe1cKcRTNwbKRDM_ooNz2tGmvSI5tANI
```

**Permissions:**
- Full admin access
- Business settings management

---

## 🧪 Testing Admin Features

### 1. Create a Category
1. Login as Business Admin (use mock login page)
2. Navigate to Categories section
3. Click "Add Category"
4. Fill in:
   - **Name:** e.g., "Appetizers"
   - **Description:** e.g., "Start your meal right"
   - **Icon:** e.g., 🥗
5. Click "Create Category"

### 2. Add a Menu Item
1. Navigate to Menu Items section
2. Click "Add Menu Item"
3. Fill in details:
   - Name, description, price
   - Select category
   - Upload images
   - Set availability
4. Add variants (optional)
5. Attach addon groups (optional)
6. Save

### 3. Manage Orders
1. Navigate to Orders section
2. View all orders for your business
3. Update order status
4. View order details

---

## 🔧 Troubleshooting

### Issue: "Failed to fetch business user role"
**Solution:** You're not authenticated. Use the mock login page or set the token manually.

### Issue: "Unauthorized" or "403 Forbidden"
**Solution:** You're logged in as a regular user. Switch to Business Admin token.

### Issue: Token expired
**Solution:** Regenerate tokens using:
```bash
cd /home/kali/Documents/KAHA_Verse/Kaha_restaurant-ecommerce/restaurant-ecommerce
node scripts/generate-mock-tokens.js
```

### Issue: Changes not saving
**Solution:** 
1. Check browser console for errors
2. Verify backend is running: `curl http://localhost:3001/api/v1/menu/biz-mock-001`
3. Check network tab in DevTools

---

## 📊 API Testing with Postman

### Setup Postman Environment

1. **Import Collection:**
   ```
   /home/kali/Documents/KAHA_Verse/Kaha_restaurant-ecommerce/restaurant-ecommerce/KAHA_Restaurant_Complete_Tests.postman_collection.json
   ```

2. **Set Environment Variables:**
   ```
   baseUrl: http://localhost:3001/api/v1
   businessId: biz-mock-001
   authToken: <regular user token>
   adminToken: <admin user token>
   ```

3. **Test Endpoints:**
   - Use `{{adminToken}}` for admin operations
   - Use `{{authToken}}` for customer operations

---

## 🎯 Quick Commands

### Generate New Tokens
```bash
cd /home/kali/Documents/KAHA_Verse/Kaha_restaurant-ecommerce/restaurant-ecommerce
node scripts/generate-mock-tokens.js
```

### Open Mock Login Page
```bash
xdg-open file:///home/kali/Documents/KAHA_Verse/MOCK_LOGIN.html
```

### Check Backend Status
```bash
curl http://localhost:3001/api/v1/menu/biz-mock-001
```

### View Backend Logs
```bash
# If running in background
tail -f /home/kali/Documents/KAHA_Verse/Kaha_restaurant-ecommerce/restaurant-ecommerce/backend.log
```

---

## 📝 Important Notes

1. **Token Validity:** All tokens are valid for 30 days
2. **Business ID:** Always use `biz-mock-001` for testing
3. **Mock Auth:** Backend has `USE_MOCK_AUTH=true` enabled
4. **No External API:** No calls to Kaha Main V3 API in mock mode
5. **LocalStorage:** Tokens are stored in browser localStorage

---

## 🔗 Related Documentation

- **Quick Start:** `QUICK_START.md`
- **Full Status Report:** `FULLSTACK_STATUS_REPORT.md`
- **API Guide:** `Kaha_restaurant-ecommerce/restaurant-ecommerce/FRONTEND_DEVELOPER_GUIDE.md`

---

## ✅ Verification Checklist

After logging in as Business Admin, you should be able to:

- [ ] View existing categories
- [ ] Create new categories
- [ ] Edit existing categories
- [ ] Delete categories
- [ ] Create menu items
- [ ] Add variants to menu items
- [ ] Attach addon groups
- [ ] View all orders
- [ ] Update order status
- [ ] Manage ratings visibility

---

**Now you can fully manage your restaurant menu! 🎉**
