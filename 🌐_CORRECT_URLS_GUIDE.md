# 🌐 Correct URLs Guide - KAHA Restaurant E-Commerce

## 🎯 Quick Reference

Your frontend is running on: **http://localhost:5174** (or 5173)

---

## 📍 All Available URLs

### 🏠 Customer Portal (Public Access)

#### Home Page
```
http://localhost:5174/
```
**What it shows:** Landing page, featured items, categories

---

#### Menu Page
```
http://localhost:5174/menu
http://localhost:5174/menu/biz-mock-001
```
**What it shows:** All menu items, categories, search/filter

---

#### Customer Login
```
http://localhost:5174/login
```
**Credentials:** Create new account or use existing customer

---

#### Customer Registration
```
http://localhost:5174/register
```
**What it does:** Create new customer account

---

### 🔐 Customer Portal (Requires Login)

#### Shopping Cart
```
http://localhost:5174/cart
```
**Requires:** Customer login

---

#### Checkout
```
http://localhost:5174/checkout
```
**Requires:** Customer login, items in cart

---

#### My Orders
```
http://localhost:5174/orders
```
**Requires:** Customer login

---

#### Order Details
```
http://localhost:5174/orders/:orderId
```
**Requires:** Customer login
**Example:** `http://localhost:5174/orders/123e4567-e89b-12d3-a456-426614174000`

---

## 👨‍💼 Admin Portal

### Admin Login ⭐ **START HERE FOR ADMIN**
```
http://localhost:5174/admin/login
```

**Credentials:**
```
Email:    admin@kahastays.com
Password: password123
```

**This is the correct URL for admin access!**

---

### Admin Dashboard
```
http://localhost:5174/admin
```
**Requires:** Admin login
**What it shows:** Admin dashboard with menu management, categories, etc.

---

### Admin Sub-Routes
```
http://localhost:5174/admin/*
```
**Examples:**
- `/admin/menu` - Menu management
- `/admin/categories` - Category management
- `/admin/orders` - Order management
- `/admin/settings` - Settings

**Note:** Exact sub-routes depend on AdminDashboard component implementation

---

## 🧪 Testing Workflow

### For Admin Testing:

1. **Start here:** http://localhost:5174/admin/login
2. **Login with:**
   ```
   Email:    admin@kahastays.com
   Password: password123
   ```
3. **You'll be redirected to:** http://localhost:5174/admin
4. **From there:** Access menu management, categories, etc.

---

### For Customer Testing:

1. **Start here:** http://localhost:5174/
2. **Browse menu:** Click on menu or go to http://localhost:5174/menu
3. **Login (optional):** http://localhost:5174/login
4. **Or register:** http://localhost:5174/register
5. **Add items to cart**
6. **Checkout:** http://localhost:5174/checkout

---

## 🔍 URL Structure Explained

### Customer Portal
```
http://localhost:5174/
├── /                          → Home page
├── /menu                      → Menu listing
├── /menu/:businessId          → Menu for specific business
├── /login                     → Customer login
├── /register                  → Customer registration
├── /cart                      → Shopping cart (protected)
├── /checkout                  → Checkout (protected)
├── /orders                    → Order history (protected)
└── /orders/:orderId           → Order details (protected)
```

### Admin Portal
```
http://localhost:5174/admin/
├── /admin/login               → Admin login (public)
└── /admin/*                   → Admin dashboard (protected)
    ├── /admin                 → Dashboard home
    ├── /admin/menu            → Menu management
    ├── /admin/categories      → Category management
    └── /admin/...             → Other admin features
```

---

## ⚠️ Common Mistakes

### ❌ Wrong URLs:

```
http://localhost:5174/admin/login  ✅ CORRECT
http://localhost:5173/admin/login  ⚠️  Only if running on 5173
http://localhost:3001/admin/login  ❌ Wrong (that's backend)
http://localhost:5174/login        ❌ Wrong (that's customer login)
```

---

## 🎯 Quick Access Links

### Admin Access:
```bash
# Open admin login in browser
xdg-open http://localhost:5174/admin/login

# Or if on port 5173
xdg-open http://localhost:5173/admin/login
```

### Customer Access:
```bash
# Open home page
xdg-open http://localhost:5174/

# Open menu directly
xdg-open http://localhost:5174/menu
```

---

## 🔧 Check Which Port You're Using

```bash
# Check if frontend is running on 5173
curl -s http://localhost:5173 > /dev/null && echo "✅ Running on 5173"

# Check if frontend is running on 5174
curl -s http://localhost:5174 > /dev/null && echo "✅ Running on 5174"
```

---

## 📊 Backend API URLs (For Reference)

These are **NOT** for browser access (API only):

```
http://localhost:3001/api/v1/menu
http://localhost:3001/api/v1/categories
http://localhost:3001/api/v1/cart
http://localhost:3001/api/v1/orders
http://localhost:3001/api/v1/docs  ← Swagger API documentation
```

---

## 🎯 Summary

**For Admin:**
1. Go to: **http://localhost:5174/admin/login**
2. Login with: `admin@kahastays.com` / `password123`
3. Manage menu, categories, orders

**For Customer:**
1. Go to: **http://localhost:5174/**
2. Browse menu, add to cart
3. Login/register if needed
4. Checkout and place orders

---

## 🔍 Troubleshooting

### "Page not found" on /admin/login
**Check:**
1. Is frontend running? `curl http://localhost:5174`
2. Check terminal where you ran `npm run dev`
3. Try port 5173 instead: `http://localhost:5173/admin/login`

---

### Redirected to home page after login
**Possible causes:**
1. Not using admin credentials (use `admin@kahastays.com`)
2. Using customer login URL instead of admin login URL
3. Check browser console for errors

---

### "Cannot GET /admin/login"
**This means:**
- You're accessing the backend URL (port 3001) instead of frontend
- Use port 5174 (or 5173), not 3001

---

## ✅ Correct URLs Checklist

- [ ] Frontend running on port 5174 (or 5173)
- [ ] Admin login: `http://localhost:5174/admin/login`
- [ ] Customer home: `http://localhost:5174/`
- [ ] Menu page: `http://localhost:5174/menu`
- [ ] Backend API: `http://localhost:3001/api/v1/*`

---

**Status:** ✅ URLs verified and documented
**Admin Login:** http://localhost:5174/admin/login
**Customer Home:** http://localhost:5174/
