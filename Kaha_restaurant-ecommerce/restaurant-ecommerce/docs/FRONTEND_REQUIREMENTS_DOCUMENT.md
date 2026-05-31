# Frontend Requirements Document - KAHA Restaurant E-Commerce Platform

**Document Version:** 1.0  
**Date:** May 27, 2026  
**Backend:** NestJS Restaurant E-Commerce API v3  
**API Base URL:** `https://api.kaha.com.np/main/api/v3` (Kaha Main API)  
**Restaurant API Base URL:** `http://localhost:3001/api/v1` (Local) | Production TBD  

---

## Table of Contents

1. [System Overview](#system-overview)
2. [Architecture & Integration](#architecture--integration)
3. [Authentication & Authorization](#authentication--authorization)
4. [Core Features & User Flows](#core-features--user-flows)
5. [API Endpoints Reference](#api-endpoints-reference)
6. [Data Models & DTOs](#data-models--dtos)
7. [UI Components & Views](#ui-components--views)
8. [State Management Requirements](#state-management-requirements)
9. [Error Handling & Validation](#error-handling--validation)
10. [Security Considerations](#security-considerations)
11. [Performance & Optimization](#performance--optimization)
12. [Testing Requirements](#testing-requirements)

---

## System Overview

### Platform Architecture

The KAHA Restaurant E-Commerce platform is a **two-tier API architecture**:

```
Frontend (React/TypeScript)
    ↓
Restaurant Backend API (NestJS)
    ↓
Kaha Main API v3 (External Authentication & User Service)
```

### Key Actors

1. **Customer (USER Role)**
   - Browse restaurants and menus
   - Add items to cart
   - Place orders
   - Track order status
   - Rate menu items

2. **Restaurant Admin (BUSINESS_SUPER_ADMIN Role)**
   - Manage restaurant menus
   - Create/edit categories and items
   - Manage add-ons and variants
   - View orders from customers
   - Update order status

3. **System**
   - Integrates with Kaha Main API v3 for authentication
   - Manages JWT tokens
   - Handles session management

---

## Architecture & Integration

### External API Integration

The Restaurant Backend communicates with **Kaha Main API v3** for:
- User authentication (login, token generation)
- User profile information
- Role verification
- Business (restaurant) information

### Token Flow

```
┌─────────────────────────────────────────────────────────────┐
│ 1. Frontend Login Form                                      │
│    (contactNumber, password)                                │
│           ↓                                                  │
│ 2. Restaurant Backend → Kaha Main API v3 /auth/login       │
│           ↓                                                  │
│ 3. Kaha Main API Returns JWT Token                          │
│           ↓                                                  │
│ 4. Restaurant Backend Stores Token & Returns User Context   │
│           ↓                                                  │
│ 5. Frontend Stores JWT in Secure Storage (HttpOnly Cookie)  │
│           ↓                                                  │
│ 6. Subsequent Requests Include Token in Authorization Header│
└─────────────────────────────────────────────────────────────┘
```

### Request/Response Pattern

**All authenticated requests MUST include:**

```http
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json
```

**All responses follow standard JSON structure:**

```json
{
  "statusCode": 200,
  "message": "Success message",
  "data": {
    // Response payload
  }
}
```

---

## Authentication & Authorization

### 1. Login Flow

**Endpoint:** `POST /auth/admin-login`

**Request Body:**
```json
{
  "contactNumber": "9813870231",
  "password": "ishwor19944"
}
```

**Response (200 OK):**
```json
{
  "statusCode": 200,
  "message": "Login successful",
  "data": {
    "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "afc70db3-6f43-4882-92fd-4715f25ffc95",
      "kahaId": "U-8C695E",
      "contactNumber": "9813870231",
      "email": "replyishwor@gmail.com",
      "role": "admin" | "customer",
      "businessId": "7476ee15-1407-41fa-9a49-89e0caaf945d"
    }
  }
}
```

### 2. Token Management

**Frontend Responsibilities:**
- Store JWT token securely (HttpOnly cookie preferred, or secure session storage)
- Refresh token before expiration (typically 1 hour TTL)
- Clear token on logout
- Send token with every authenticated request

**Backend Handling:**
- Validates JWT on protected endpoints
- Returns `401 Unauthorized` for invalid/expired tokens
- Forwards token to Kaha Main API v3 for external calls

### 3. Role-Based Access Control (RBAC)

| Role | Actions |
|------|---------|
| **CUSTOMER/USER** | Browse menus, create cart, place orders, rate items |
| **BUSINESS_SUPER_ADMIN** | Manage menus, categories, orders for their business |
| **Public (No Auth)** | View public menus, categories, add-ons |

---

## Core Features & User Flows

### Feature 1: Authentication

#### UI Components
- Login Form with validation
- Error toast/alert for failed login
- Loading state during login

#### User Flow
1. User enters contact number and password
2. Frontend validates input
3. Submit to `POST /auth/admin-login`
4. Store token and user context
5. Redirect to appropriate dashboard (customer/admin)

#### Error Handling
- Invalid credentials → Display error message
- Network error → Retry with backoff
- Token expired → Redirect to login

---

### Feature 2: Menu Management (Admin Only)

#### UI Components
- Menu list with pagination
- Create/Edit menu item form
- Delete confirmation dialog
- Search and filter controls

#### Admin Actions

**A. Create Menu Item**
- Form fields: name, description, category, price, discounted price, images, add-ons
- Validation: All required fields, price must be number
- Submit: `POST /menu`
- Success: Show success toast, refresh list

**B. View Menu Items**
- Fetch from: `GET /menu/business/:businessId`
- Display: Paginated list with filters (name, category, price range)
- Sort: By name, price, date created

**C. Edit Menu Item**
- Fetch details: `GET /menu/:id`
- Form pre-population
- Submit: `PATCH /menu/:id`
- Update local state

**D. Delete Menu Item**
- Confirmation dialog
- Submit: `DELETE /menu/:id`
- Remove from list

**E. Toggle Signature Dish**
- Endpoint: `PATCH /menu/toggle-signature/:id`
- Request: `{ "isSignature": true/false }`
- Visual indicator on menu item

**F. Menu Variants/Add-ons**
- Create variant: `POST /menu/:id/variants`
- View variants: `GET /menu/:id/variants`
- Edit variant: `PATCH /menu/:id/variants/:variantId`
- Delete variant: `DELETE /menu/:id/variants/:variantId`

---

### Feature 3: Category Management (Admin Only)

#### Admin Actions

**A. Create Category**
- Endpoint: `POST /categories`
- Fields: name, description, display order
- Request:
```json
{
  "name": "Appetizers",
  "description": "Starters and appetizers",
  "businessId": "7476ee15-1407-41fa-9a49-89e0caaf945d"
}
```

**B. View Categories**
- Endpoint: `GET /categories/business/:businessId`
- Display: List of categories
- Public version: `GET /categories/:businessId` (no auth)

**C. Edit Category**
- Endpoint: `PATCH /categories/:id`
- Update name/description

**D. Delete Category**
- Endpoint: `DELETE /categories/:id`
- Confirmation dialog

---

### Feature 4: Add-ons Management (Admin Only)

#### Endpoints
```
GET    /addons                  - List all add-ons
POST   /addons                  - Create add-on
PATCH  /addons/:id              - Update add-on
DELETE /addons/:id              - Delete add-on
```

#### Add-on Structure
```json
{
  "id": "uuid",
  "name": "Extra Cheese",
  "price": 2.50,
  "businessId": "uuid",
  "addOnGroupId": "uuid"
}
```

---

### Feature 5: Shopping Cart (Customer Only)

#### Cart Workflow

**Step 1: Create Cart**
- Endpoint: `POST /cart`
- Request: `{ "businessId": "uuid" }`
- Response: Cart ID with empty items

**Step 2: Add Items to Cart**
- Endpoint: `POST /cart/item`
- Request:
```json
{
  "cartId": "uuid",
  "menuId": "uuid",
  "quantity": 2,
  "selectedAddons": ["addon-id-1", "addon-id-2"],
  "notes": "Extra spicy"
}
```
- Response: Updated cart with item

**Step 3: View Cart**
- Endpoint: `GET /cart`
- Response: Cart with all items and totals

**Step 4: Update Cart Item**
- Endpoint: `PATCH /cart/:itemId`
- Update: quantity, add-ons, notes

**Step 5: Remove Item from Cart**
- Endpoint: `DELETE /cart/:id`
- Removes item or entire cart

#### Cart State
```typescript
interface Cart {
  id: string;
  userId: string;
  businessId: string;
  items: CartItem[];
  subtotal: number;
  tax: number;
  deliveryCharge: number;
  total: number;
  createdAt: Date;
  updatedAt: Date;
}

interface CartItem {
  id: string;
  menuId: string;
  quantity: number;
  price: number;
  selectedAddons: string[];
  notes: string;
}
```

---

### Feature 6: Order Management

#### Customer Order Flow

**Create Order from Cart**
- Endpoint: `POST /order/from-cart`
- Request:
```json
{
  "cartId": "uuid",
  "deliveryAddress": "123 Main St",
  "deliveryNotes": "Ring doorbell",
  "paymentMethod": "card" | "cash"
}
```

**Create Direct Order**
- Endpoint: `POST /order`
- Request:
```json
{
  "businessId": "uuid",
  "items": [
    { "menuId": "uuid", "quantity": 2, "selectedAddons": [] }
  ],
  "deliveryAddress": "123 Main St",
  "paymentMethod": "card"
}
```

**View My Orders**
- Endpoint: `GET /order/user`
- Query params: page, take, status
- Response: Paginated list of user's orders

**View Order Details**
- Endpoint: `GET /order/:id`
- Response: Complete order with items and status

**Cancel Order**
- Endpoint: `POST /order/:orderId/change-status`
- Request: `{ "status": "cancelled" }`

#### Admin Order View

**View Business Orders**
- Endpoint: `GET /order/business-man-vs/:businessId`
- Response: All orders for the business

**Update Order Status**
- Endpoint: `POST /order/:orderId/change-status`
- Status flow: pending → confirmed → preparing → ready → completed
- Request: `{ "status": "confirmed" }`

#### Order States
```typescript
enum OrderStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  PREPARING = 'preparing',
  READY = 'ready',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled'
}
```

---

### Feature 7: Menu Ratings

**Create Rating**
- Endpoint: `POST /menu-rating`
- Request:
```json
{
  "menuId": "uuid",
  "rating": 4,
  "review": "Great taste!",
  "businessId": "uuid"
}
```

**View Ratings**
- Endpoint: `GET /menu-rating/menu/:menuId`
- Response: Array of ratings for menu item

**Delete Rating**
- Endpoint: `DELETE /menu-rating/:id`
- Only user's own rating

---

## API Endpoints Reference

### Authentication Module
```
POST   /auth/admin-login         - Login with credentials
POST   /auth/test-login          - Mock test endpoint
```

### Categories Module
```
POST   /categories               - Create (ADMIN)
GET    /categories/business/:businessId - List for business
GET    /categories/:id           - Get single category
PATCH  /categories/:id           - Update (ADMIN)
DELETE /categories/:id           - Delete (ADMIN)
```

### Menu Module
```
POST   /menu                              - Create menu (ADMIN)
GET    /menu/business/:businessId         - List menus (paginated, filtered)
GET    /menu/:id                          - Get menu details
PATCH  /menu/:id                          - Update menu (ADMIN)
DELETE /menu/:id                          - Delete menu (ADMIN)
PATCH  /menu/toggle-signature/:id         - Toggle signature (ADMIN)
PATCH  /menu/update-addons/:id            - Update add-ons (ADMIN)

POST   /menu/:id/variants                 - Create variant (ADMIN)
GET    /menu/:id/variants                 - List variants
PATCH  /menu/:id/variants/:variantId      - Update variant (ADMIN)
DELETE /menu/:id/variants/:variantId      - Delete variant (ADMIN)
```

### Add-ons Module
```
GET    /addons                   - List all add-ons
POST   /addons                   - Create add-on (ADMIN)
PATCH  /addons/:id               - Update add-on (ADMIN)
DELETE /addons/:id               - Delete add-on (ADMIN)

GET    /addon-groups             - List add-on groups
POST   /addon-groups             - Create group (ADMIN)
```

### Cart Module
```
POST   /cart                      - Create cart (AUTH)
POST   /cart/item                 - Add item (AUTH)
GET    /cart                      - Get user's cart (AUTH)
PATCH  /cart/:itemId              - Update item (AUTH)
DELETE /cart/:id                  - Delete cart/item (AUTH)
```

### Order Module
```
POST   /order                     - Create order (AUTH)
POST   /order/from-cart           - Create from cart (AUTH)
GET    /order/user                - Get my orders (AUTH)
GET    /order/:id                 - Get order details (AUTH)
GET    /order/business-man-vs/:businessId - Get business orders (ADMIN)
POST   /order/:orderId/change-status - Update status (AUTH)
```

### Menu Ratings Module
```
POST   /menu-rating               - Create rating (AUTH)
GET    /menu-rating/menu/:menuId  - Get menu ratings
GET    /menu-rating               - Get all ratings
DELETE /menu-rating/:id           - Delete rating (AUTH)
```

---

## Data Models & DTOs

### User Model
```typescript
interface User {
  id: string;              // UUID
  kahaId: string;          // Kaha Main API ID (U-XXXXXXX)
  contactNumber: string;   // Phone number
  email: string;           // Email address
  role: 'admin' | 'customer';
  businessId?: string;     // For admins only
  createdAt: Date;
  updatedAt: Date;
}
```

### Business Model
```typescript
interface Business {
  id: string;
  name: string;
  description: string;
  logo: string;
  address: string;
  contactNumber: string;
  email: string;
  cuisineType: string[];
  rating: number;
  isActive: boolean;
  ownerId: string;
  createdAt: Date;
  updatedAt: Date;
}
```

### Category Model
```typescript
interface Category {
  id: string;
  name: string;
  description?: string;
  businessId: string;
  displayOrder: number;
  createdAt: Date;
  updatedAt: Date;
}
```

### Menu Model
```typescript
interface Menu {
  id: string;
  name: string;
  description?: string;
  categoryId: string;
  businessId: string;
  price: number;
  discountedPrice?: number;
  images: string[];
  isAvailable: boolean;
  isSignature: boolean;
  isBarItem: boolean;
  allowAddOns: boolean;
  details?: Record<string, string>;
  services: ('DINE_IN' | 'TAKEAWAY' | 'DELIVERY')[];
  addOns: string[];  // Add-on IDs
  variants: MenuVariant[];
  rating: number;
  totalRatings: number;
  createdAt: Date;
  updatedAt: Date;
}

interface MenuVariant {
  id: string;
  menuId: string;
  name: string;
  price: number;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}
```

### Add-on Model
```typescript
interface AddOn {
  id: string;
  name: string;
  price: number;
  description?: string;
  businessId: string;
  addOnGroupId: string;
  isAvailable: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface AddOnGroup {
  id: string;
  name: string;
  businessId: string;
  maxSelection: number;  // Max items can be selected
  isRequired: boolean;
  addOns: AddOn[];
  createdAt: Date;
  updatedAt: Date;
}
```

### Order Model
```typescript
interface Order {
  id: string;
  businessId: string;
  userId: string;
  items: OrderItem[];
  subtotal: number;
  tax: number;
  deliveryCharge: number;
  totalAmount: number;
  deliveryAddress: string;
  deliveryNotes?: string;
  paymentMethod: 'card' | 'cash' | 'wallet';
  paymentStatus: 'pending' | 'completed' | 'failed';
  orderStatus: OrderStatus;
  estimatedDeliveryTime?: Date;
  actualDeliveryTime?: Date;
  createdAt: Date;
  updatedAt: Date;
}

interface OrderItem {
  id: string;
  orderId: string;
  menuId: string;
  menuName: string;
  quantity: number;
  unitPrice: number;
  selectedAddons: OrderAddOn[];
  specialNotes?: string;
}

interface OrderAddOn {
  addOnId: string;
  addOnName: string;
  price: number;
}
```

### Menu Rating Model
```typescript
interface MenuRating {
  id: string;
  menuId: string;
  businessId: string;
  userId: string;
  rating: 1 | 2 | 3 | 4 | 5;
  review?: string;
  createdAt: Date;
  updatedAt: Date;
}
```

---

## UI Components & Views

### Page Structure

```
Frontend Application
├── Layout
│   ├── Header/Navbar
│   │   ├── Logo
│   │   ├── Search
│   │   ├── User Menu
│   │   └── Cart Icon (Customer only)
│   └── Footer
│
├── Routes
│   ├── Public Routes
│   │   ├── /                    - Landing page
│   │   ├── /restaurants         - Browse restaurants
│   │   ├── /restaurant/:id      - Restaurant details with menu
│   │   └── /login               - Login page
│   │
│   ├── Customer Routes (Protected)
│   │   ├── /dashboard           - Customer dashboard
│   │   ├── /menu/:businessId    - Business menu (detailed)
│   │   ├── /cart                - Shopping cart
│   │   ├── /checkout            - Checkout page
│   │   ├── /orders              - My orders
│   │   ├── /order/:id           - Order tracking
│   │   └── /profile             - User profile
│   │
│   └── Admin Routes (Protected + Role)
│       ├── /admin/dashboard     - Admin dashboard
│       ├── /admin/menu          - Menu management
│       ├── /admin/categories    - Category management
│       ├── /admin/addons        - Add-on management
│       ├── /admin/orders        - Orders management
│       └── /admin/settings      - Business settings
```

### Core Components

#### 1. Authentication Components
```
├── LoginForm
│   ├── ContactNumberInput
│   ├── PasswordInput
│   ├── LoginButton
│   ├── ErrorAlert
│   └── LoadingSpinner
└── LogoutButton
```

#### 2. Menu Components (Customer)
```
├── MenuList
│   ├── MenuCard
│   │   ├── MenuImage
│   │   ├── MenuName
│   │   ├── MenuPrice
│   │   ├── RatingDisplay
│   │   ├── AddToCartButton
│   │   └── MenuDetailsModal
│   │       ├── Description
│   │       ├── Images Carousel
│   │       ├── Variants Selector
│   │       ├── AddOns Selector
│   │       ├── QuantitySelector
│   │       ├── SpecialNotesInput
│   │       └── AddToCartButton
│   └── MenuFilters
│       ├── CategoryFilter
│       ├── PriceRangeFilter
│       ├── SearchInput
│       └── SortOptions
```

#### 3. Menu Management Components (Admin)
```
├── MenuManagementPage
│   ├── MenuTable
│   │   ├── MenuRow
│   │   │   ├── MenuName
│   │   │   ├── Price
│   │   │   ├── Category
│   │   │   ├── Availability Toggle
│   │   │   ├── EditButton → MenuEditForm
│   │   │   └── DeleteButton → ConfirmDialog
│   │   └── Pagination
│   ├── CreateMenuButton → MenuCreateForm
│   └── MenuFilters
│
├── MenuForm (Create/Edit)
│   ├── NameInput
│   ├── DescriptionTextarea
│   ├── CategorySelect
│   ├── PriceInput
│   ├── DiscountedPriceInput
│   ├── ImageUpload
│   ├── AvailabilityToggle
│   ├── SignatureDishToggle
│   ├── AllowAddOnsToggle
│   ├── AddOnsMultiSelect
│   ├── ServicesMultiSelect (DINE_IN, TAKEAWAY, DELIVERY)
│   └── SubmitButton
```

#### 4. Category Management Components (Admin)
```
├── CategoryManagementPage
│   ├── CategoryTable/List
│   │   ├── CategoryRow
│   │   │   ├── CategoryName
│   │   │   ├── ItemCount
│   │   │   ├── EditButton → CategoryEditForm
│   │   │   └── DeleteButton → ConfirmDialog
│   │   └── Pagination
│   └── CreateCategoryButton → CategoryCreateForm
│
├── CategoryForm (Create/Edit)
│   ├── NameInput
│   ├── DescriptionTextarea
│   ├── DisplayOrderInput
│   └── SubmitButton
```

#### 5. Cart Components (Customer)
```
├── ShoppingCart
│   ├── CartItemList
│   │   ├── CartItem
│   │   │   ├── MenuImage
│   │   │   ├── MenuName
│   │   │   ├── SelectedAddons
│   │   │   ├── QuantitySelector
│   │   │   ├── ItemPrice
│   │   │   ├── SpecialNotes
│   │   │   └── RemoveButton
│   │   └── EmptyCartMessage
│   ├── CartSummary
│   │   ├── Subtotal
│   │   ├── Tax
│   │   ├── DeliveryCharge
│   │   ├── TotalAmount
│   │   └── CheckoutButton
│   └── ContinueShoppingButton
```

#### 6. Checkout Components (Customer)
```
├── CheckoutPage
│   ├── OrderReview
│   │   ├── ItemSummary
│   │   └── PriceSummary
│   ├── DeliveryForm
│   │   ├── AddressInput
│   │   ├── DeliveryNotesTextarea
│   │   └── EstimatedTimeDisplay
│   ├── PaymentForm
│   │   ├── PaymentMethodSelect
│   │   ├── PaymentGateway (if card)
│   │   └── SecurityNotice
│   └── PlaceOrderButton
```

#### 7. Order Components
```
├── OrderListPage
│   ├── OrderFilters
│   │   ├── StatusFilter
│   │   ├── DateRangeFilter
│   │   └── SearchInput
│   ├── OrderTable
│   │   ├── OrderRow
│   │   │   ├── OrderID
│   │   │   ├── Date
│   │   │   ├── Amount
│   │   │   ├── Status Badge
│   │   │   └── ViewDetailsButton → OrderDetailsPage
│   │   └── Pagination
│   └── ExportButton
│
├── OrderDetailsPage
│   ├── OrderHeader
│   │   ├── OrderID
│   │   ├── Date
│   │   └── Status Timeline
│   ├── ItemDetails
│   │   ├── Each ordered item with add-ons
│   │   └── Pricing breakdown
│   ├── DeliveryInfo
│   │   ├── Address
│   │   ├── EstimatedTime
│   │   └── TrackingMap (if applicable)
│   ├── PaymentInfo
│   │   └── Method and status
│   └── ActionButtons
│       ├── (Customer) CancelButton
│       ├── (Admin) StatusUpdateSelect
│       └── ContactButton
```

#### 8. Admin Dashboard Components
```
├── AdminDashboard
│   ├── StatisticsCards
│   │   ├── TotalOrders
│   │   ├── TotalRevenue
│   │   ├── ActiveMenuItems
│   │   └── CustomerCount
│   ├── RecentOrdersWidget
│   ├── PopularMenuItemsWidget
│   ├── RevenueTrendChart
│   └── QuickActions
│       ├── CreateMenuButton
│       ├── ViewOrdersButton
│       └── BusinessSettingsButton
```

---

## State Management Requirements

### Global State Structure (Redux/Zustand/Context)

```typescript
// Auth State
interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  
  actions: {
    login: (credentials) => Promise<void>;
    logout: () => void;
    refreshToken: () => Promise<void>;
    setUser: (user: User) => void;
  }
}

// Business State
interface BusinessState {
  currentBusiness: Business | null;
  businesses: Business[];
  isLoading: boolean;
  
  actions: {
    fetchBusinesses: () => Promise<void>;
    fetchBusinessDetails: (id: string) => Promise<void>;
  }
}

// Menu State
interface MenuState {
  menus: Menu[];
  currentMenu: Menu | null;
  filters: {
    businessId: string;
    categoryId?: string;
    searchQuery?: string;
    minPrice?: number;
    maxPrice?: number;
    page: number;
    take: number;
  };
  pagination: {
    total: number;
    page: number;
    pageSize: number;
  };
  isLoading: boolean;
  error: string | null;
  
  actions: {
    fetchMenus: (businessId: string, filters?) => Promise<void>;
    fetchMenuById: (id: string) => Promise<void>;
    setFilters: (filters) => void;
    clearFilters: () => void;
  }
}

// Category State
interface CategoryState {
  categories: Category[];
  isLoading: boolean;
  
  actions: {
    fetchCategories: (businessId: string) => Promise<void>;
  }
}

// Cart State
interface CartState {
  cartId: string | null;
  items: CartItem[];
  summary: {
    subtotal: number;
    tax: number;
    deliveryCharge: number;
    total: number;
  };
  isLoading: boolean;
  
  actions: {
    createCart: (businessId: string) => Promise<void>;
    addItem: (item: CartItem) => Promise<void>;
    updateItem: (itemId: string, updates: Partial<CartItem>) => Promise<void>;
    removeItem: (itemId: string) => Promise<void>;
    clearCart: () => Promise<void>;
    fetchCart: () => Promise<void>;
  }
}

// Order State
interface OrderState {
  orders: Order[];
  currentOrder: Order | null;
  filters: {
    status?: OrderStatus;
    dateRange?: [Date, Date];
    businessId?: string;
  };
  pagination: {
    page: number;
    pageSize: number;
    total: number;
  };
  isLoading: boolean;
  
  actions: {
    createOrder: (order: CreateOrderDto) => Promise<string>;
    fetchOrders: (filters?) => Promise<void>;
    fetchOrderById: (id: string) => Promise<void>;
    updateOrderStatus: (orderId: string, status: OrderStatus) => Promise<void>;
  }
}

// AddOns State
interface AddOnsState {
  addOns: AddOn[];
  addOnGroups: AddOnGroup[];
  isLoading: boolean;
  
  actions: {
    fetchAddOns: () => Promise<void>;
    fetchAddOnGroups: () => Promise<void>;
  }
}

// Ratings State
interface RatingsState {
  ratings: MenuRating[];
  isLoading: boolean;
  
  actions: {
    fetchRatings: (menuId: string) => Promise<void>;
    submitRating: (rating: MenuRating) => Promise<void>;
    deleteRating: (ratingId: string) => Promise<void>;
  }
}

// UI State
interface UIState {
  isMenuDrawerOpen: boolean;
  selectedBusiness: Business | null;
  confirmDialog: {
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  };
  notifications: {
    type: 'success' | 'error' | 'warning' | 'info';
    message: string;
  }[];
  
  actions: {
    openMenuDrawer: () => void;
    closeMenuDrawer: () => void;
    openConfirmDialog: (title, message, callback) => void;
    closeConfirmDialog: () => void;
    addNotification: (notification) => void;
    removeNotification: (index) => void;
  }
}
```

---

## Error Handling & Validation

### Frontend Validation Rules

#### Login Form
- Contact Number: Required, valid format (10 digits)
- Password: Required, minimum 6 characters

#### Menu Form
- Name: Required, max 100 characters
- Description: Optional, max 500 characters
- Category: Required
- Price: Required, must be positive number
- Images: Optional, max 5 images, max 5MB each

#### Category Form
- Name: Required, max 50 characters
- Display Order: Optional, positive integer

#### Cart Item
- Quantity: Required, minimum 1, maximum based on inventory
- Selected Add-ons: Must not exceed group's max selection

#### Order
- Delivery Address: Required, min 10 characters
- Payment Method: Required

#### Rating
- Rating: Required, 1-5 scale
- Review: Optional, max 500 characters

### Error Handling Strategy

```typescript
interface ApiError {
  statusCode: number;
  message: string;
  errors?: {
    field: string;
    message: string;
  }[];
}

// Error codes and user-friendly messages
const ERROR_MESSAGES = {
  400: 'Invalid request. Please check your input.',
  401: 'Session expired. Please log in again.',
  403: 'You do not have permission to perform this action.',
  404: 'The requested resource was not found.',
  409: 'This item already exists.',
  422: 'Validation failed. Please correct the errors.',
  429: 'Too many requests. Please try again later.',
  500: 'Server error. Please try again later.',
};
```

### Toast/Alert System
- Success: Green background, checkmark icon, 3-second auto-dismiss
- Error: Red background, X icon, manual dismiss
- Warning: Yellow background, warning icon, 5-second auto-dismiss
- Info: Blue background, info icon, 4-second auto-dismiss

---

## Security Considerations

### 1. Token Management
- Store JWT in **HttpOnly cookie** (preferred) or secure session storage
- Never store in localStorage for sensitive tokens
- Implement token refresh logic (refresh 5 minutes before expiry)
- Clear token on logout

### 2. HTTPS/TLS
- All API calls must use HTTPS in production
- Certificate pinning for mobile apps (if applicable)

### 3. CORS
- Frontend domain must be whitelisted in backend CORS configuration
- Credentials should be sent with requests (`credentials: 'include'`)

### 4. Input Validation
- All user inputs must be validated client-side
- All inputs must be validated server-side (never trust client)
- Sanitize HTML inputs to prevent XSS

### 5. Authorization
- Check user role before displaying admin features
- Never expose admin endpoints in UI
- Verify businessId matches user's businessId for admin actions

### 6. Password Security
- Require strong passwords (min 8 chars, uppercase, numbers, special chars)
- Never log passwords
- Implement rate limiting on login (max 5 attempts per 15 minutes)

### 7. API Security
- Implement request signing for sensitive operations (optional)
- Use rate limiting to prevent API abuse
- Log all critical operations

---

## Performance & Optimization

### Frontend Optimization

#### 1. Code Splitting
- Split components by route using React.lazy()
- Lazy load heavy components (image galleries, maps)

#### 2. Image Optimization
- Use WebP format with JPEG fallback
- Implement lazy loading for images below the fold
- Compress images (max 200KB per image)
- Use responsive images with srcset

#### 3. Caching Strategy
```typescript
// Cache menu data for 5 minutes
// Cache categories for 10 minutes
// Cache add-ons for 15 minutes
// Cache user profile until logout
// Cache orders indefinitely (but refetch on demand)
```

#### 4. API Request Optimization
- Implement request debouncing for search (300ms)
- Implement pagination (default 20 items per page)
- Use HTTP caching headers (ETag, Cache-Control)
- Bundle multiple small requests into single batch endpoint

#### 5. Bundle Size
- Analyze bundle using webpack-bundle-analyzer
- Tree-shake unused imports
- Lazy load third-party libraries
- Target: < 200KB (gzipped) for main bundle

#### 6. Performance Monitoring
- Implement error tracking (Sentry/LogRocket)
- Monitor Core Web Vitals (LCP, FID, CLS)
- Log API response times
- Monitor JavaScript errors

### Network Optimization

#### Request/Response Timing
- Menu fetch: 1-2 seconds (with network latency)
- Cart operations: < 500ms
- Order creation: < 2 seconds
- Page load: < 3 seconds

#### Compression
- Enable gzip/brotli compression on backend
- Minify CSS/JS/HTML
- Enable compression for API responses

---

## Testing Requirements

### Unit Testing (Frontend)

#### Test Coverage Targets
- **Critical paths**: 90% (auth, cart, order)
- **UI components**: 70%
- **Utilities**: 85%
- **Overall**: 75%

#### Critical Paths to Test
1. Authentication flow
2. Add to cart → Checkout → Order creation
3. Menu filtering and search
4. Admin menu CRUD operations
5. Error handling for all API calls

### Integration Testing

```typescript
// Example: Cart to Order flow
describe('Cart to Order Flow', () => {
  it('should complete order from cart', async () => {
    // Login
    // Create cart
    // Add items
    // Checkout
    // Verify order created
  });
});
```

### E2E Testing

**Scenarios to test:**
1. User registration & login
2. Browse restaurants & menus
3. Add items to cart with add-ons
4. Checkout and payment
5. Order tracking
6. Admin dashboard
7. Menu management CRUD
8. Order management

### Performance Testing
- Load test with 100+ concurrent users
- Test API performance with 50K+ menu items
- Mobile performance (3G network simulation)

### Accessibility Testing
- WCAG 2.1 AA compliance
- Screen reader compatibility
- Keyboard navigation
- Color contrast (4.5:1 for text)

---

## Implementation Priority & Phases

### Phase 1: MVP (Weeks 1-4)
- [ ] Authentication (login/logout)
- [ ] Browse restaurants and menus
- [ ] Add to cart (basic)
- [ ] Checkout (without payment integration)
- [ ] Order tracking (basic status)

### Phase 2: Enhanced Features (Weeks 5-8)
- [ ] Admin menu management CRUD
- [ ] Category management
- [ ] Menu variants and add-ons
- [ ] Advanced filtering and search
- [ ] Order history and filtering
- [ ] Menu ratings and reviews

### Phase 3: Advanced Features (Weeks 9+)
- [ ] Payment gateway integration
- [ ] Real-time order notifications
- [ ] Admin analytics dashboard
- [ ] Delivery tracking with map
- [ ] Promo codes and discounts
- [ ] Favorite restaurants/items
- [ ] Order scheduling

---

## Technology Stack Recommendations

### Frontend Framework
- **React 18+** with TypeScript
- **Next.js** (for SSR and better SEO)

### State Management
- **Zustand** or **Redux Toolkit** (for medium-large apps)
- **React Query** (for server state management)

### UI Components
- **Material-UI** or **Tailwind CSS** + shadcn/ui
- **React Hook Form** (for forms)

### API Communication
- **Axios** with interceptors for token management
- **TanStack Query** for caching and synchronization

### Testing
- **Jest** + **React Testing Library**
- **Cypress** or **Playwright** for E2E

### Development Tools
- **Vite** (bundler)
- **ESLint** + **Prettier** (code quality)
- **Husky** + **lint-staged** (pre-commit hooks)

---

## Success Criteria

### Functional Requirements
- [ ] All authentication flows work correctly
- [ ] All CRUD operations functional
- [ ] All API integrations complete
- [ ] Error handling in place for all scenarios
- [ ] Form validation working

### Non-Functional Requirements
- [ ] Page load time < 3 seconds
- [ ] API response time < 500ms (p95)
- [ ] Mobile responsive (320px - 2560px)
- [ ] Accessibility WCAG 2.1 AA compliant
- [ ] Test coverage > 75%
- [ ] Zero critical security vulnerabilities

### User Experience
- [ ] Intuitive navigation
- [ ] Clear feedback for all actions
- [ ] Smooth animations and transitions
- [ ] Consistent design language
- [ ] Mobile-first approach

---

## Appendix: Environment Variables

### Frontend .env.local
```env
REACT_APP_API_BASE_URL=http://localhost:3001/api/v1
REACT_APP_KAHA_MAIN_API_URL=https://api.kaha.com.np/main/api/v3
REACT_APP_ENVIRONMENT=development
REACT_APP_SENTRY_DSN=<sentry-dsn>
REACT_APP_LOG_ROCKET_ID=<logrocket-id>
```

### Backend Environment (for reference)
```env
APP_ENV=development
APP_PORT=3001
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_NAME=kaha_restaurant
KAHA_MAIN_V3_BASE_URL=https://api.kaha.com.np/main/api/v3
JWT_SECRET=<jwt-secret>
```

---

## References & Documentation Links

- [Backend Architecture Documentation](./docs/architecture/ARCHITECTURE_FLOW.md)
- [Database Schema](./docs/database/DATABASE_SCHEMA.md)
- [API Endpoints Reference](./docs/api/API_ENDPOINTS.md)
- [Authentication Flow](./docs/api/AUTHENTICATION_FLOW_EXPLAINED.md)
- [Postman Collections](./postman/)

---

**Document Status:** Complete  
**Last Updated:** May 27, 2026  
**Prepared By:** Architecture & Engineering Team
