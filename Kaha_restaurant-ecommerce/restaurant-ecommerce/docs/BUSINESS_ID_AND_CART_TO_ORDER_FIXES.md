# Business ID & Cart-to-Order Implementation Fixes

**Issues Found:**
1. ❌ businessId stored in entities but not properly used for data isolation
2. ❌ No cart-to-order conversion (partial or full)
3. ❌ Price calculation logic incomplete
4. ❌ RolesGuard not enforcing business-level access control

---

## Issue #1: Why businessId in Entities?

### Current Problem

**RolesGuard checks authorization** (Can this user access this endpoint?)  
**businessId in entities** is for **data isolation** (Which business owns this data?)

They serve **different purposes**!

### Example Scenario

```
Restaurant A (businessId: biz-001)
├── Menu: Pizza ($10)
├── Order #123
└── Cart for User X

Restaurant B (businessId: biz-002)
├── Menu: Burger ($8)
├── Order #456
└── Cart for User Y
```

**Without businessId in entities:**
```sql
-- User from Restaurant A queries orders
SELECT * FROM orders WHERE userId = 'user-x';

-- PROBLEM: Returns orders from ALL restaurants!
-- User sees orders from Restaurant A AND Restaurant B
```

**With businessId in entities:**
```sql
-- User from Restaurant A queries orders
SELECT * FROM orders 
WHERE userId = 'user-x' 
  AND businessId = 'biz-001';

-- CORRECT: Only returns Restaurant A's orders
```

### The Two-Layer Security Model

```
┌─────────────────────────────────────────────────────┐
│  Layer 1: RolesGuard (Authorization)                │
│  "Can this user perform this action?"               │
│  - Checks JWT token                                 │
│  - Verifies user role (ADMIN, STAFF, CUSTOMER)      │
│  - Calls Kaha Main V3 API                           │
└─────────────────────────────────────────────────────┘
                      ↓ PASS
┌─────────────────────────────────────────────────────┐
│  Layer 2: businessId Filter (Data Isolation)        │
│  "Which business's data can they access?"           │
│  - Filters by businessId in WHERE clause            │
│  - Ensures multi-tenancy                            │
│  - Prevents cross-business data leaks               │
└─────────────────────────────────────────────────────┘
```

### Why Both Are Needed

**RolesGuard alone is NOT enough:**
- ✅ Checks if user is an ADMIN
- ❌ Doesn't know WHICH business they admin
- ❌ Could access other businesses' data

**businessId alone is NOT enough:**
- ✅ Filters data by business
- ❌ Doesn't check user permissions
- ❌ Any user could query any business

**Both together:**
- ✅ RolesGuard: "You're an ADMIN" ✓
- ✅ businessId filter: "For business biz-001 only" ✓
- ✅ Secure multi-tenant system

---

## Issue #2: Missing Cart-to-Order Conversion

### Current Problem

**Cart Service:** Manages shopping cart  
**Order Service:** Creates orders from scratch  
**Missing:** Convert cart items to order

### What's Needed

1. **Full Cart Checkout** - Convert entire cart to order
2. **Partial Cart Checkout** - Select specific items from cart
3. **Price Calculation** - Accurate totals with addons
4. **Cart Cleanup** - Remove ordered items from cart

---

## Issue #3: Price Calculation Problems

### Current Issues

1. **Cart doesn't calculate totals**
2. **Order calculation is basic** (missing addon totals)
3. **No validation** of prices against current menu prices
4. **Tax/fees hardcoded**

---

## Solutions Implementation

Let me create the fixed versions of the services...

