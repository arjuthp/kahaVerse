# Customer Flow Implementation - KAHA Restaurant E-Commerce

**Status:** ✅ COMPLETE  
**Date:** May 29, 2026  
**Frontend Base URL:** `http://localhost:5173/` or `http://localhost:5174/`

---

## Table of Contents

1. [Overview](#overview)
2. [Customer Flow Diagram](#customer-flow-diagram)
3. [Route Structure](#route-structure)
4. [Feature Implementation](#feature-implementation)
5. [Pages & Components](#pages--components)
6. [State Management](#state-management)
7. [API Integration](#api-integration)
8. [Testing Instructions](#testing-instructions)

---

## Overview

The KAHA Restaurant E-Commerce platform implements a complete customer journey that separates public browsing from authenticated operations.

### Key Features Implemented

✅ **Public Home Page** - Browse menu without login  
✅ **Customer Authentication** - Login/Register with email/phone  
✅ **Menu Browsing** - View items, filters, search, add-ons  
✅ **Shopping Cart** - Add/remove items, select specific items for checkout  
✅ **Order Management** - Place orders, track status, view history  
✅ **Admin Dashboard** - Separate admin login and dashboard  

---

## Customer Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                      PUBLIC HOME PAGE (/)                        │
│  - Browse featured menu items                                   │
│  - View categories and filters                                  │
│  - No authentication required                                   │
│  - Sign In / Sign Up buttons in header                          │
└──────────┬──────────────────────────────────────────────────────┘
           │
           ├─────────────────────┬──────────────────────┐
           │                     │                      │
           ↓                     ↓                      ↓
    ┌──────────────┐      ┌──────────────┐      ┌──────────────┐
    │ Sign In      │      │ Sign Up      │      │ Browse Menu  │
    │ (/login)     │      │ (/register)  │      │ (→ requires  │
    │              │      │              │      │  login)      │
    └──────┬───────┘      └──────┬───────┘      └──────────────┘
           │                    │
           └────────┬───────────┘
                    ↓
        ┌──────────────────────────┐
        │   CUSTOMER DASHBOARD     │
        │   Authenticated User     │
        └──────────┬───────────────┘
                   │
        ┌──────────┼──────────┬──────────┐
        ↓          ↓          ↓          ↓
    ┌────────┐ ┌────────┐ ┌────────┐ ┌─────────┐
    │ MENU   │ │ CART   │ │ ORDERS │ │ PROFILE │
    │ /menu  │ │ /cart  │ │ /orders│ │ Settings│
    └────┬───┘ └────┬───┘ └────┬───┘ └─────────┘
         │          │           │
         │    View  │  Select   │
         │   Items  │  Items    │
         │          │           │
         └────┬─────┘           │
              ↓                 │
         ┌──────────┐           │
         │ ADD TO   │           │
         │  CART    │           │
         └────┬─────┘           │
              │                 │
              ↓                 ↓
         ┌─────────────────────────────┐
         │   CHECKOUT (/checkout)      │
         │ - Select items to order     │
         │ - Apply coupons             │
         │ - Choose delivery method    │
         │ - Payment processing        │
         └────────┬────────────────────┘
                  │
                  ↓
         ┌──────────────────┐
         │ ORDER PLACED     │
         │ & TRACKING       │
         │ (/orders)        │
         │ (/track/:orderId)│
         └──────────────────┘
```

---

## Route Structure

### Public Routes (No Authentication Required)

```
/                      Home Page - Browse menu, featured items
/login                 Customer login page
/register              Customer registration page
/admin-login           Admin login page
```

### Protected Routes (Authentication Required)

```
/menu                  Authenticated menu page - Full menu with filters
/cart                  Shopping cart with item selection
/checkout              Order checkout and payment
/orders                Order history and tracking
/track/:orderId        Live order tracking
/dashboard             Admin dashboard (admin role required)
```

---

## Feature Implementation

### 1. **Home Page** (`/`)

**Purpose:** Public landing page showcasing restaurant and menu

**Features:**
- Display featured menu items from database
- Category filtering (main-course, appetizers, bread, beverages)
- Search functionality
- Call-to-action buttons for Sign In/Sign Up
- Responsive grid layout for items
- No login required

**File:** `src/pages/customer/HomePage.tsx`  
**Styles:** `src/pages/customer/HomePage.css`

**User Interactions:**
```
View Featured Items → Sign In/Sign Up Required → Redirects to /login
                    → Already Logged In → View Full Menu
```

---

### 2. **Authentication**

#### 2.1 Login Page (`/login`)

**File:** `src/pages/LoginPage.tsx`  
**Features:**
- Phone number + password login
- Remember me option
- Error handling
- Token storage in localStorage

**Login Flow:**
```
1. User enters contact number and password
2. API call to backend: POST /auth/login
3. Store JWT token in localStorage
4. Redirect to /menu (customer dashboard)
```

#### 2.2 Registration Page (`/register`)

**File:** `src/pages/customer/RegisterPage.tsx`  
**Features:**
- Full name, email, phone, password
- Password confirmation
- Sync with Kaha Main API v3
- Auto-login after registration

**Registration Flow:**
```
1. User fills registration form
2. Submit to: POST /auth/register (backend)
3. Backend syncs with Kaha Main API v3
4. User data stored in both systems
5. Token returned and stored
6. Auto-redirect to /menu
```

---

### 3. **Menu Browsing** (`/menu`)

**File:** `src/pages/MenuPage.tsx`  
**Protected:** Yes (requires login)

**Features:**
- Display all menu items
- Filter by category
- Search by name/description
- Sort by price/popularity
- Add items to cart with quantity
- View item details with add-ons
- Add-on selection and pricing

**Cart Addition:**
```
Select Item → Choose Quantity → Select Add-ons → Add to Cart
              ↓
           Stored in localStorage as cartItems
```

---

### 4. **Shopping Cart** (`/cart`)

**File:** `src/pages/CartPage.tsx`  
**Protected:** Yes (requires login)

**Features - NEWLY ADDED:**
✅ **Item Selection Checkboxes** - Select/deselect individual items
✅ **Select All Option** - Toggle all items at once
✅ **Partial Checkout** - Proceed with only selected items
✅ **Real-time Total Calculation** - Based on selected items only
✅ **Quantity Adjustment** - Modify quantities in cart
✅ **Coupon/Promo Codes** - Apply discounts (SAVE10, SAVE20, WELCOME50)
✅ **Price Breakdown** - Subtotal, tax (9%), delivery fee, discount, total
✅ **Free Delivery Threshold** - Free delivery on orders > ₹500

**Example Use Case:**
```
Cart Items:
- Butter Chicken (₹450) x 1     [Checkbox]
- Garlic Naan (₹80) x 2         [Checkbox]
- Samosa (₹40) x 5              [Checkbox]
- Mango Lassi (₹120) x 1        [Checkbox]

User selects:
- Butter Chicken (₹450) x 1     [✓ Checked]
- Garlic Naan (₹80) x 2         [✓ Checked]
- Samosa (₹40) x 5              [✗ Unchecked]
- Mango Lassi (₹120) x 1        [✓ Checked]

Calculation:
Subtotal: ₹450 + ₹160 + ₹120 = ₹730
Tax (9%): ₹65.70
Delivery: ₹0 (free, > ₹500)
Total: ₹795.70
```

**Cart Item State:**
```typescript
interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
}

// Selected items tracked via Set<itemId>
const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
```

---

### 5. **Checkout** (`/checkout`)

**File:** `src/pages/CheckoutPage.tsx`  
**Protected:** Yes (requires login)
**Input:** Only selected items from cart

**Features:**
- Display selected items for review
- Delivery address input
- Payment method selection (Online/COD)
- Order summary
- Final price calculation
- Place order button

**Checkout Flow:**
```
1. User navigates from /cart with selected items
2. Display order summary (selected items only)
3. Enter delivery details
4. Choose payment method
5. Submit order
6. API call: POST /orders
7. Redirect to order tracking
```

---

### 6. **My Orders** (`/orders`)

**File:** `src/pages/OrderHistoryPage.tsx`  
**Protected:** Yes (requires login)

**Features:**
- Display all customer orders
- Order ID, date, status, total amount
- Order status badge (Pending, Confirmed, Preparing, Ready, Out for Delivery, Delivered)
- Click to view details
- Click to track order

**Status Types:**
- 🔵 Pending - Order received, awaiting confirmation
- 🟡 Confirmed - Restaurant confirmed the order
- 🟠 Preparing - Food being prepared
- 🟢 Ready - Order ready for pickup/delivery
- 🔴 Out for Delivery - Currently en route
- ✅ Delivered - Order completed

---

### 7. **Order Tracking** (`/track/:orderId`)

**File:** `src/pages/OrderTrackingPage.tsx`  
**Protected:** Yes (requires login)

**Features:**
- Real-time order status tracking
- Order timeline with timestamps
- Delivery person details (name, contact)
- Live map tracking (mock implementation)
- Estimated delivery time
- Support contact information

**Tracking Timeline:**
```
Order Placed (2:30 PM)
    ↓
Order Confirmed (2:32 PM)
    ↓
Preparing Food (2:35 PM)
    ↓
Ready for Delivery (2:45 PM)
    ↓
Out for Delivery (2:50 PM)
    ├─ Driver: Rajesh Kumar
    ├─ Phone: +977-9841234567
    └─ ETA: 5 mins
    ↓
Delivered (2:55 PM)
```

---

### 8. **Admin System** (Separate from Customer)

**Admin Login:** `/admin-login`  
**Admin Dashboard:** `/dashboard`  
**File:** `src/pages/admin/AdminLoginPage.tsx`  
**File:** `src/pages/AdminDashboard.tsx`

**Features:**
- Separate authentication from customer login
- Menu management (Create, Read, Update, Delete)
- Category management
- Order management
- Order status updates
- Business analytics

**Protected Route:**
```typescript
<Route
  path="/dashboard"
  element={
    <ProtectedRoute
      element={<AdminDashboard />}
      requiredRole="admin"
    />
  }
/>
```

---

## Pages & Components

### Page Structure

```
src/pages/
├── customer/
│   ├── HomePage.tsx           ✅ Public landing page
│   ├── LoginPage.tsx          ✅ Customer login
│   ├── RegisterPage.tsx       ✅ Customer registration
│   ├── MenuPage.tsx           ✅ Full menu browser
│   ├── CartPage.tsx           ✅ Shopping cart (with selection)
│   ├── CheckoutPage.tsx       ✅ Order checkout
│   ├── OrderHistoryPage.tsx   ✅ My orders
│   └── OrderTrackingPage.tsx  ✅ Live tracking
├── admin/
│   ├── AdminLoginPage.tsx     ✅ Admin login
│   └── AdminDashboard.tsx     ✅ Admin panel
└── App.tsx                    ✅ Main router
```

### Protected Route Component

```typescript
const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ element, requiredRole }) => {
  const token = localStorage.getItem('authToken');
  const userRole = localStorage.getItem('userRole');

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  if (requiredRole && userRole !== requiredRole) {
    return <Navigate to="/" replace />;
  }

  return element;
};
```

---

## State Management

### localStorage Keys

```
authToken           → JWT token for API calls
userRole           → User role (customer/admin)
userId             → Unique user ID
cart               → JSON stringified cart items
post_login_redirect → Redirect URL after login
```

### Context (AuthContext)

**File:** `src/context/AuthContext.tsx`

```typescript
interface AuthContext {
  isAuthenticated: boolean;
  user: User | null;
  login(token: string, user: User): void;
  logout(): void;
}
```

### Cart State

**Local State in CartPage:**
```typescript
const [cartItems, setCartItems] = useState<CartItem[]>([]);
const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
const [appliedPromo, setAppliedPromo] = useState<string>('');
```

---

## API Integration

### Authentication Endpoints

```
POST /auth/login
  Request: { contactNumber, password }
  Response: { accessToken, user: { id, role, ... } }

POST /auth/register
  Request: { name, email, phone, password }
  Response: { accessToken, user, ... }
```

### Menu Endpoints

```
GET /menu
  Response: MenuItem[]

GET /categories
  Response: Category[]

GET /addons
  Response: AddOn[]
```

### Cart/Order Endpoints

```
GET /cart
  Response: CartItem[]

POST /orders
  Request: { items[], deliveryAddress, paymentMethod, ... }
  Response: { orderId, status, total, ... }

GET /orders/user
  Response: Order[]

GET /orders/:orderId
  Response: Order (with tracking info)
```

---

## Testing Instructions

### 1. Test Public Home Page

```
1. Open http://localhost:5173/
2. Should display:
   - Restaurant header with Sign In/Sign Up buttons
   - Featured menu items
   - Category filters
   - Search functionality
3. Click "Browse Menu" → Should redirect to /login (not authenticated)
```

### 2. Test Registration & Login

```
1. Click "Sign Up" → /register
2. Fill registration form:
   - Full Name: John Doe
   - Email: john@example.com
   - Phone: 9841234567
   - Password: securePassword123
3. Submit → Auto-login and redirect to /menu
4. Verify localStorage has authToken
```

### 3. Test Menu & Cart

```
1. Browse menu items at /menu
2. Filter by category (e.g., "Main Course")
3. Search for items (e.g., "Butter")
4. Add items to cart with quantities
5. Navigate to /cart
6. Verify all items appear in cart
```

### 4. Test Item Selection (NEW FEATURE)

```
1. Add 5 different items to cart with various quantities
2. Go to /cart
3. UNCHECK "Select All Items"
4. Manually check 2-3 items only
5. Verify:
   - Subtotal, tax, delivery fee calculated for SELECTED items only
   - "Proceed to Checkout" button disabled if nothing selected
   - Can proceed with partial selection
```

### 5. Test Checkout

```
1. Add items to cart
2. Select specific items (2-3 out of many)
3. Click "Proceed to Checkout" with selections
4. Verify checkout shows ONLY selected items
5. Enter delivery address
6. Choose payment method
7. Submit order
8. Verify order created with correct items
```

### 6. Test Order Tracking

```
1. Place an order
2. Navigate to /orders
3. View order in history
4. Click order → /track/:orderId
5. View:
   - Order timeline
   - Current status
   - Delivery ETA
   - Driver info
```

### 7. Test Admin Login (Separate)

```
1. Click "Admin Login" or go to /admin-login
2. Enter admin credentials (different from customer)
3. Should redirect to /dashboard
4. Admin should NOT access /menu or /orders (customer routes)
5. Customer should NOT access /dashboard (admin route)
```

---

## Data Flow Summary

```
┌─────────────────┐
│  User Action    │
└────────┬────────┘
         │
         ↓
┌─────────────────────────────┐
│  React State Update         │
│  (e.g., selectedItems Set)  │
└────────┬────────────────────┘
         │
         ↓
┌─────────────────────────────┐
│  Recalculate Totals         │
│  (for selected items only)  │
└────────┬────────────────────┘
         │
         ↓
┌─────────────────────────────┐
│  localStorage Sync          │
│  (persist cart data)        │
└────────┬────────────────────┘
         │
         ↓
┌─────────────────────────────┐
│  Re-render Component        │
│  (show updated UI)          │
└─────────────────────────────┘
         │
         ├─(User checkout)──→ API Call
         ├─(User adds item)──→ Update State
         └─(User logout)────→ Clear localStorage
```

---

## Customization & Future Enhancements

### Potential Additions

- 📱 Mobile app variant
- 🗺️ Real-time GPS tracking map
- ⭐ Product ratings and reviews
- 💬 In-app chat support
- 🎯 Personalized recommendations
- 📅 Schedule order for future date
- 👥 Share cart with friends
- 🔔 Push notifications for order updates
- 💳 Saved payment methods
- 🏠 Saved delivery addresses

### Configuration

Edit `src/constants/` for:
- Tax rate (currently 9%)
- Delivery fee structure
- Coupon codes
- Service charges
- Business hours

---

## Support & Documentation

**Frontend API Guide:** `./FRONTEND_API_GUIDE.md`  
**Requirements Document:** Backend repo `docs/FRONTEND_REQUIREMENTS_DOCUMENT.md`  
**Backend Status:** NestJS v3 API  
**Database:** PostgreSQL with sync to Kaha Main API

---

## Summary

✅ Complete customer flow implemented  
✅ Public browsing without login  
✅ Secure authentication with JWT  
✅ Shopping cart with partial item selection  
✅ Order management and tracking  
✅ Separate admin system  
✅ Responsive design  
✅ Error handling and validation  

**Ready for testing and deployment!**
