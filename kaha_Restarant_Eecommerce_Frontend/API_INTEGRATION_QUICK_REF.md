# API Integration Quick Reference

## 🎯 Quick Start

### 1. Verify Configuration
```env
# .env should contain:
VITE_API_BASE_URL=http://localhost:3001
VITE_KAHA_MAIN_V3_URL=https://api.kaha.com.np/main/api/v3
VITE_BUSINESS_ID=00000000-0000-4000-a000-000000000100
```

### 2. Start Services
```bash
# Terminal 1: Backend (NestJS)
npm start  # runs on :3001

# Terminal 2: Frontend (Vite)
npm run dev  # runs on :5173
```

### 3. Access Application
- Open http://localhost:5173 in browser
- Login with Kaha Main V3 credentials
- Explore menu, add to cart, checkout

---

## 📋 Authentication Flow

```
User enters credentials
    ↓
authApi.login(email, password)
    ↓
POST https://api.kaha.com.np/main/api/v3/auth/login
    ↓
Response: { access_token, user: {id, email, fullName, role} }
    ↓
Decode JWT: extract businessId from token
    ↓
Store in localStorage:
  - kaha_token (JWT)
  - kaha_user (user object)
  - kaha_refresh_token
    ↓
Redirect to home page
    ↓
All subsequent API calls include: Authorization: Bearer {token}
```

---

## 🔌 API Integration Points

### Authentication (`src/api/auth.api.ts`)
```typescript
// Login
const { accessToken, refreshToken, user } = await authApi.login(email, password);

// Admin Login
const admin = await authApi.adminLogin(email, password);

// Verify Token
const user = await authApi.verifyToken(token);

// Logout
await authApi.logout();
```

### Menu & Categories (`src/api/menu.api.ts`)
```typescript
// Get all menu items
const items = await menuApi.getByBusiness(businessId);

// Get single item
const item = await menuApi.getById(itemId);

// Get categories
const categories = await categoryApi.getByBusiness(businessId);
```

### Cart Management (`src/api/cart.api.ts`)
```typescript
// Create cart
const cart = await cartApi.createCart();

// Get cart
const cart = await cartApi.getCart(businessId);

// Add item
await cartApi.addItem({ menuId, quantity, menuVariantId, addonInfo });

// Update item
await cartApi.updateItem(cartItemId, { quantity, specialInstructions });

// Remove item
await cartApi.removeItem(cartItemId);

// Clear cart
await cartApi.clearCart(cartId);
```

### Orders (`src/api/order.api.ts`)
```typescript
// Create from cart (checkout)
const result = await orderApi.createOrderFromCart({
  businessId,
  serviceType: 'DINE_IN', // or 'DELIVERY', 'TAKEAWAY'
  tableNumber,
  paymentMethod,
  cartItemIds
});

// Get user orders
const orders = await orderApi.getUserOrders();

// Get single order
const order = await orderApi.getOrderById(orderId);

// Update order status (admin)
await orderApi.updateStatus(orderId, { status: 'CONFIRMED' });
```

### Ratings (`src/api/order.api.ts`)
```typescript
// Create rating
await ratingApi.createRating({
  businessId,
  menuId,
  orderItemId,
  rating: 5,
  review: "Excellent food!"
});

// Get menu ratings
const ratings = await ratingApi.getMenuRatings(menuId);
```

---

## 🎨 Using Context Hooks

### Auth Context
```typescript
import { useAuth } from '../context/AuthContext';

export function MyComponent() {
  const { user, isAuthenticated, isAdmin, login, logout } = useAuth();
  
  return (
    <div>
      {isAuthenticated ? (
        <>
          <p>Welcome, {user?.name}!</p>
          <p>Business: {user?.businessId}</p>
          <button onClick={logout}>Logout</button>
        </>
      ) : (
        <p>Please login</p>
      )}
    </div>
  );
}
```

### Cart Context
```typescript
import { useCart } from '../context/CartContext';

export function CartSummary() {
  const { cart, itemCount, cartTotal, addItem, removeItem } = useCart();
  
  return (
    <div>
      <p>Items: {itemCount}</p>
      <p>Total: ${cartTotal.toFixed(2)}</p>
      {cart?.cartItems.map(item => (
        <div key={item.id}>
          {item.menu.name} x {item.quantity}
          <button onClick={() => removeItem(item.id)}>Remove</button>
        </div>
      ))}
    </div>
  );
}
```

---

## 🛠️ Common Tasks

### Task 1: Handle Business ID from Auth
```typescript
// Business ID automatically comes from JWT token
// No need to hardcode or pass it manually in most cases
// Falls back to VITE_BUSINESS_ID env variable if decode fails

const { user } = useAuth();
// user.businessId contains the business from token
```

### Task 2: Make Authenticated API Call
```typescript
// Axios interceptor automatically adds JWT token
// No need to manually add Authorization header

const { data } = await api.get('/menu/some-id');
// Token is automatically included in the request
```

### Task 3: Handle API Errors
```typescript
try {
  await cartApi.addItem(payload);
} catch (error) {
  const err = error as { response?: { data?: { message?: string } } };
  const message = err?.response?.data?.message || 'An error occurred';
  toast.error(message);
}
```

### Task 4: Pass Business ID to API
```typescript
// For operations that need businessId parameter
const items = await menuApi.getByBusiness(businessId);

// For operations that don't need explicit businessId
// (already in JWT token and extracted by backend)
const orders = await orderApi.getUserOrders(); // backend extracts from token
```

---

## 🔐 JWT Token Management

### What's Stored
```
localStorage:
├── kaha_token (JWT) → Authorization header in all requests
├── kaha_user (JSON) → User object {id, email, role, businessId}
└── kaha_refresh_token → For future token refresh implementation
```

### JWT Payload (decoded)
```json
{
  "id": "user-uuid",
  "email": "user@example.com",
  "businessId": "biz-uuid",
  "role": "user",
  "iat": 1685000000,
  "exp": 1685086400
}
```

### Token Lifecycle
```
1. Login → Get token from Kaha Main V3
2. Decode → Extract businessId
3. Store → Save to localStorage
4. Use → Add to Authorization header in all requests
5. Logout → Remove from localStorage
```

---

## 📊 Data Models

### User (from Kaha Main V3)
```typescript
{
  id: string;
  name: string;
  email?: string;
  phone?: string;
  role: 'user' | 'business_super_admin' | 'admin';
  businessId?: string;
}
```

### Menu Item
```typescript
{
  id: string;
  name: string;
  price: number | string;
  discountedPrice?: number | string;
  isAvailable: boolean;
  isSignature: boolean;
  businessId: string;
  categoryId?: string;
  variants?: MenuVariant[];
  addonGroups?: AddonGroup[];
}
```

### Cart Item
```typescript
{
  id: string;
  quantity: number;
  unitPriceSnapshot: number;
  menu: Menu;
  menuVariant?: MenuVariant;
  addOns: CartItemAddon[];
  specialInstructions?: string;
}
```

### Order
```typescript
{
  id: string;
  orderNumber: string;
  userId: string;
  businessId: string;
  serviceType: 'DINE_IN' | 'DELIVERY' | 'TAKEAWAY';
  subtotal: number;
  totalAmount: number;
  paymentStatus: 'UNPAID' | 'PAID' | 'REFUNDED';
  orderItems: OrderItem[];
  orderStatus: OrderStatusHistory[];
}
```

---

## 🐛 Debugging Tips

### Check if Token is Stored
```javascript
// In browser console
localStorage.getItem('kaha_token')
localStorage.getItem('kaha_user')
```

### Decode JWT to See Contents
```javascript
// In browser console
const token = localStorage.getItem('kaha_token');
const payload = JSON.parse(atob(token.split('.')[1]));
console.log(payload); // See businessId, role, etc
```

### Check Network Requests
1. Open DevTools → Network tab
2. Look for API calls (menu, cart, order endpoints)
3. Check headers for `Authorization: Bearer ...`
4. Check response status (200, 401, 404, 500)

### Check Console Logs
```javascript
// All API errors are logged to console
// Look for "Failed to fetch menu", "Login error", etc
```

### Verify Environment Variables
```javascript
// In any component
console.log(import.meta.env.VITE_API_BASE_URL)
console.log(import.meta.env.VITE_KAHA_MAIN_V3_URL)
console.log(import.meta.env.VITE_BUSINESS_ID)
```

---

## ✅ Checklist for Integration

- [ ] Backend running on http://localhost:3001
- [ ] Kaha Main V3 API is accessible
- [ ] .env file configured with correct URLs
- [ ] Frontend builds without errors: `npm run build`
- [ ] Dev server starts: `npm run dev`
- [ ] Can login with Kaha credentials
- [ ] Menu loads after login
- [ ] Can add items to cart
- [ ] Can create order from cart
- [ ] Can view order history
- [ ] Admin can manage menu items
- [ ] All API calls include JWT token

---

## 📞 Support

If you encounter issues:

1. **Check Logs**: Browser console + backend logs
2. **Verify Config**: .env variables are correct
3. **Network**: Check API responses in DevTools
4. **Build**: Run `npm run build` to catch TypeScript errors
5. **Restart**: Kill and restart all services

---

**Last Updated:** May 25, 2026  
**Status:** ✅ Ready for Integration Testing
