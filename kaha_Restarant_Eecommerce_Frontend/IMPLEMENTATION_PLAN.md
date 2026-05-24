# KAHA Restaurant Frontend - Implementation Plan

## 📊 Current Status Analysis

### ✅ What's Already Implemented

1. **Project Setup**
   - React + TypeScript + Vite
   - React Router for navigation
   - Axios for API calls
   - React Hot Toast for notifications
   - Lucide React for icons

2. **Core Structure**
   - Authentication Context (AuthContext)
   - Cart Context (CartContext)
   - API client with interceptors
   - Protected routes
   - Lazy-loaded pages

3. **Pages Created**
   - Customer: HomePage, MenuPage, CartPage, CheckoutPage, OrdersPage, LoginPage, RegisterPage
   - Admin: AdminDashboard, AdminLoginPage

4. **API Integration (Partial)**
   - Menu API (with mock data fallback)
   - Cart API (basic CRUD)
   - Order API (basic operations)
   - Addon API (mock implementation)

### ⚠️ Issues to Fix

1. **API Base URL Mismatch**
   - Current: `http://localhost:3001/api/v1`
   - Should be: `http://localhost:3000` (per documentation)

2. **API Endpoint Misalignment**
   - Current endpoints use `/products`, `/cart/items`
   - Should use `/menu`, `/cart/item` (per documentation)

3. **Data Model Differences**
   - Backend uses different field names than expected
   - Need to align with documented API response structure

4. **Missing Features**
   - Menu variants selection UI
   - Addon groups selection UI
   - Order status tracking timeline
   - Rating and review system
   - Business admin features

## 🎯 Implementation Roadmap

### Phase 1: Fix Core API Integration (Priority: HIGH)

#### 1.1 Update Environment Configuration
```env
VITE_API_BASE_URL=http://localhost:3000
VITE_BUSINESS_ID=your-business-id-here
```

#### 1.2 Update API Endpoints
- [ ] Update `menu.api.ts` to use correct endpoints
- [ ] Update `cart.api.ts` to match documentation
- [ ] Update `order.api.ts` to use `/order/from-cart`
- [ ] Add proper error handling

#### 1.3 Fix Data Models
- [ ] Update type definitions to match API responses
- [ ] Add missing fields (orderNumber, snapshot fields, etc.)
- [ ] Update enum values to match backend

### Phase 2: Complete Customer Features (Priority: HIGH)

#### 2.1 Menu Browsing
- [ ] Display menu items with proper images
- [ ] Category filtering
- [ ] Search functionality
- [ ] Signature dish badges
- [ ] Availability indicators

#### 2.2 Menu Item Detail Modal
- [ ] Show full item details
- [ ] Variant selection (radio buttons)
- [ ] Addon group selection (checkboxes/radio)
- [ ] Addon validation (min/max, required)
- [ ] Quantity selector
- [ ] Add to cart with selections

#### 2.3 Cart Management
- [ ] Display cart items with variants and addons
- [ ] Show snapshot prices
- [ ] Update quantity
- [ ] Remove items
- [ ] Special instructions
- [ ] Cart total calculation
- [ ] Business validation

#### 2.4 Checkout Flow
- [ ] Service type selection (Dine-in, Delivery, Takeaway)
- [ ] Table number input (for dine-in)
- [ ] Payment method selection
- [ ] Order summary with pricing breakdown
- [ ] Place order from cart
- [ ] Order confirmation screen

#### 2.5 Order Tracking
- [ ] Order history list
- [ ] Order detail view
- [ ] Status timeline visualization
- [ ] Reorder functionality

#### 2.6 Ratings & Reviews
- [ ] Rate menu items
- [ ] Write reviews
- [ ] View ratings on menu items
- [ ] Edit/delete own reviews

### Phase 3: Admin Dashboard (Priority: MEDIUM)

#### 3.1 Category Management
- [ ] List categories
- [ ] Create category
- [ ] Edit category
- [ ] Delete category
- [ ] Reorder categories

#### 3.2 Menu Management
- [ ] List menu items
- [ ] Create menu item
- [ ] Edit menu item
- [ ] Delete menu item
- [ ] Toggle availability
- [ ] Mark as signature
- [ ] Upload images

#### 3.3 Variant Management
- [ ] Add variants to menu items
- [ ] Edit variants
- [ ] Delete variants
- [ ] Toggle variant availability

#### 3.4 Addon Management
- [ ] Create addon groups
- [ ] Add addons to groups
- [ ] Edit addons
- [ ] Delete addons
- [ ] Attach/detach addon groups to menu items

#### 3.5 Order Management
- [ ] View all business orders
- [ ] Filter by status, service type
- [ ] View order details
- [ ] Update order status
- [ ] Order statistics

#### 3.6 Review Management
- [ ] View all business reviews
- [ ] Toggle review visibility
- [ ] Respond to reviews (if implemented)

### Phase 4: Polish & Optimization (Priority: LOW)

#### 4.1 UI/UX Improvements
- [ ] Loading states
- [ ] Error boundaries
- [ ] Empty states
- [ ] Skeleton loaders
- [ ] Animations and transitions

#### 4.2 Performance
- [ ] Image lazy loading
- [ ] Code splitting
- [ ] API response caching
- [ ] Debounced search
- [ ] Optimistic updates

#### 4.3 Accessibility
- [ ] Keyboard navigation
- [ ] ARIA labels
- [ ] Focus management
- [ ] Screen reader support

#### 4.4 Testing
- [ ] Unit tests for utilities
- [ ] Integration tests for API calls
- [ ] E2E tests for critical flows

## 🔧 Immediate Action Items

### 1. Update `.env` file
```env
VITE_API_BASE_URL=http://localhost:3000
VITE_BUSINESS_ID=your-actual-business-id
```

### 2. Update `axios.ts` base URL
```typescript
const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';
```

### 3. Rewrite API files to match documentation
- Use correct endpoint paths
- Handle proper request/response formats
- Add comprehensive error handling

### 4. Update type definitions
- Add missing fields from API documentation
- Fix enum values
- Add snapshot fields for orders

### 5. Implement missing UI components
- MenuDetailModal with variants and addons
- OrderStatusTimeline
- RatingForm
- AddonGroupSelector

## 📝 Questions to Clarify

1. **Authentication**: 
   - Do you have access to the Kaha Main V3 API for authentication?
   - Or should we implement a mock authentication system?

2. **Business ID**:
   - What is your actual business ID to use in API calls?

3. **Backend Status**:
   - Is the backend API running on `http://localhost:3000`?
   - Are all endpoints from the documentation implemented?

4. **Priority**:
   - Should we focus on customer features first or admin features?
   - Which features are most critical for your launch?

## 🚀 Next Steps

1. **Confirm API availability** - Test if backend is running and accessible
2. **Update environment configuration** - Fix base URL and business ID
3. **Rewrite API integration layer** - Align with documentation
4. **Implement missing UI components** - Start with high-priority features
5. **Test end-to-end flows** - Ensure everything works together

Would you like me to start implementing these changes? Please let me know:
- Which phase should I prioritize?
- Any specific features you need urgently?
- Confirmation on authentication approach?
