# KAHA Restaurant E-Commerce - Role-Based Access

## 🎯 User Roles & Access

### 👤 Regular User (Customer)
**Access:** Customer-facing pages only
- ✅ Homepage with featured dishes
- ✅ Menu browsing
- ✅ Shopping cart
- ✅ Checkout
- ✅ Order history
- ✅ Order tracking

**Login URL:** http://localhost:5173  
**After Login:** Stays on customer pages

---

### 👨‍💼 Business Admin
**Access:** Admin dashboard only (NO customer pages)
- ✅ Analytics & Overview
- ✅ Order Management
- ✅ Menu CRUD Operations
- ✅ Category Management
- ✅ User Overview

**Login URL:** http://localhost:5173/admin  
**After Login:** Redirected to `/admin` dashboard

---

### 👑 Business Owner
**Access:** Full admin dashboard (same as Business Admin)
- ✅ All Business Admin features
- ✅ Business settings (future)

**Login URL:** http://localhost:5173/admin  
**After Login:** Redirected to `/admin` dashboard

---

## 🔄 Automatic Routing

### What I Fixed:

1. **Mock Login Page Updated**
   - Business Admin → redirects to `/admin`
   - Business Owner → redirects to `/admin`
   - Regular User → redirects to `/` (homepage)

2. **App.tsx Updated**
   - Admin users visiting `/` are automatically redirected to `/admin`
   - Customer users cannot access `/admin` routes
   - Proper role-based route protection

---

## 🚀 How to Use

### For Business Admin/Owner:

1. **Open Mock Login Page:**
   ```bash
   xdg-open file:///home/kali/Documents/KAHA_Verse/MOCK_LOGIN.html
   ```

2. **Select "Business Admin" or "Business Owner"**

3. **Click Login**
   - You'll be redirected to: http://localhost:5173/admin
   - You'll see the admin dashboard (NOT the customer homepage)

4. **Admin Dashboard Features:**
   - 📊 Overview & Analytics
   - 🛍️ Orders Management
   - 🍲 Menu Operations
   - 🗂️ Categories Control
   - 👥 Users Overview

---

### For Regular Customers:

1. **Open Mock Login Page** or go directly to http://localhost:5173

2. **Select "Regular User"**

3. **Click Login**
   - You'll stay on: http://localhost:5173
   - You'll see the customer homepage with featured dishes

4. **Customer Features:**
   - Browse menu
   - Add to cart
   - Checkout
   - View orders

---

## 📍 URL Structure

| Role | Login Redirects To | Can Access | Cannot Access |
|------|-------------------|------------|---------------|
| **Regular User** | `/` (homepage) | Customer pages | `/admin/*` |
| **Business Admin** | `/admin` (dashboard) | Admin pages | Customer pages (auto-redirect) |
| **Business Owner** | `/admin` (dashboard) | Admin pages | Customer pages (auto-redirect) |

---

## 🎨 UI Differences

### Customer Pages (Regular User)
- ✅ Navbar with "Menu", "My Orders", "Cart"
- ✅ Homepage with hero section and featured dishes
- ✅ Menu browsing with categories
- ✅ Shopping cart interface
- ✅ Checkout flow

### Admin Dashboard (Business Admin/Owner)
- ✅ Sidebar navigation
- ✅ Analytics dashboard
- ✅ Order management table
- ✅ Menu CRUD interface
- ✅ Category management
- ❌ NO customer homepage
- ❌ NO shopping cart
- ❌ NO checkout

---

## 🔧 Technical Implementation

### Route Protection (App.tsx)
```typescript
// Admin users visiting homepage are redirected to admin
<Route path="/" element={isAdmin ? <Navigate to="/admin" replace /> : <HomePage />} />

// Admin routes require admin role
<Route path="/admin/*" element={<ProtectedRoute adminOnly><AdminDashboard /></ProtectedRoute>} />
```

### Mock Login Redirect Logic
```javascript
// Determine redirect based on role
let redirectUrl = 'http://localhost:5173';
if (selectedUser === 'admin' || selectedUser === 'owner') {
    redirectUrl = 'http://localhost:5173/admin'; // Admin dashboard
}
// Regular users go to customer homepage
```

---

## ✅ What's Fixed

1. ✅ Business Admin no longer sees customer homepage
2. ✅ Business Admin redirected to `/admin` dashboard
3. ✅ Business Owner redirected to `/admin` dashboard
4. ✅ Regular users stay on customer pages
5. ✅ Automatic role-based routing
6. ✅ Proper access control

---

## 🧪 Testing

### Test Business Admin Access:
1. Open mock login page
2. Select "Business Admin"
3. Click login
4. **Expected:** You see admin dashboard at `/admin`
5. **Expected:** Sidebar with Overview, Orders, Menu, Categories, Users
6. **Expected:** NO customer homepage, NO "Order Now" button

### Test Regular User Access:
1. Open mock login page
2. Select "Regular User"
3. Click login
4. **Expected:** You see customer homepage at `/`
5. **Expected:** Navbar with Menu, Cart
6. **Expected:** Featured dishes section

### Test Auto-Redirect:
1. Login as Business Admin
2. Try to visit http://localhost:5173/
3. **Expected:** Automatically redirected to `/admin`

---

## 📚 Related Files

- **App.tsx** - Route configuration with role-based redirects
- **AuthContext.tsx** - Role detection logic
- **MOCK_LOGIN.html** - Login page with role-based redirects
- **AdminDashboard.tsx** - Admin interface (no customer pages)

---

## 🎯 Summary

✅ **Business Admin and Business Owner** now see ONLY the admin dashboard  
✅ **Regular Users** see ONLY customer pages  
✅ **Automatic routing** based on user role  
✅ **No more confusion** between admin and customer interfaces  

**The separation is complete!** 🎉
