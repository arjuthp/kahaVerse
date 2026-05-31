# KAHA Restaurant E-Commerce - Frontend API Integration Guide

**Version:** 1.0  
**Last Updated:** May 28, 2026  
**Status:** ✅ PRODUCTION READY  
**Backend Status:** ✅ All Critical Issues Fixed  
**API Base URL:** Backend Local: `http://localhost:3000` | External: `https://api.kaha.com.np/main/api/v3`

---

## Table of Contents

1. [Quick Start](#quick-start)
2. [Authentication](#authentication)
3. [API Endpoints](#api-endpoints)
4. [User Management](#user-management)
5. [Business Management](#business-management)
6. [Menu Management](#menu-management)
7. [Shopping Cart](#shopping-cart)
8. [Orders](#orders)
9. [Error Handling](#error-handling)
10. [Implementation Examples](#implementation-examples)

---

## Quick Start

### Backend URL Configuration
```typescript
// src/api/config.ts
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
});

// Add token to all requests
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('authToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
```

### Environment Variables
```bash
# .env.local
REACT_APP_API_URL=http://localhost:3000
REACT_APP_KAHA_API_URL=https://api.kaha.com.np/main/api/v3
```

---

## Authentication

### 1. Login Flow

**Endpoint:** `POST /auth/login`  
**Service:** External (Kaha Main API v3)  
**Base URL:** `https://api.kaha.com.np/main/api/v3`

```typescript
// Request
const loginRequest = {
  contactNumber: "9813870231",
  password: "ishwor19944"
};

// Response
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "role": "admin"
}
```

**Frontend Implementation:**
```typescript
// services/authService.ts
export const loginUser = async (contactNumber: string, password: string) => {
  try {
    const response = await axios.post(
      'https://api.kaha.com.np/main/api/v3/auth/login',
      { contactNumber, password }
    );
    
    // Store token
    localStorage.setItem('authToken', response.data.accessToken);
    localStorage.setItem('userRole', response.data.role);
    
    return response.data;
  } catch (error) {
    throw new Error('Invalid credentials');
  }
};
```

### 2. Token Usage

All subsequent requests must include the Authorization header:
```typescript
const headers = {
  'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
  'Content-Type': 'application/json'
};
```

### 3. Logout
```typescript
export const logoutUser = () => {
  localStorage.removeItem('authToken');
  localStorage.removeItem('userRole');
  window.location.href = '/login';
};
```

---

## API Endpoints

### Backend Endpoints (Local API)

All backend endpoints are hosted locally at `http://localhost:3000`

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|----------------|
| **POST** | `/auth/login` | User login | ❌ No |
| **GET** | `/users/{id}` | Get user profile | ✅ Yes |
| **GET** | `/business-users/{businessId}/{userId}` | Get user roles in business | ✅ Yes |
| **GET** | `/businesses/{id}` | Get business details | ✅ Yes |
| **GET** | `/menu` | Get menu items | ✅ Yes |
| **POST** | `/menu` | Create menu item (Admin) | ✅ Yes |
| **PUT** | `/menu/{id}` | Update menu item | ✅ Yes |
| **DELETE** | `/menu/{id}` | Delete menu item | ✅ Yes |
| **GET** | `/categories` | Get categories | ✅ Yes |
| **POST** | `/categories` | Create category | ✅ Yes |
| **GET** | `/cart` | Get user cart | ✅ Yes |
| **POST** | `/cart/item` | Add item to cart | ✅ Yes |
| **PUT** | `/cart/{itemId}` | Update cart item | ✅ Yes |
| **DELETE** | `/cart/{itemId}` | Remove cart item | ✅ Yes |
| **POST** | `/order` | Create order | ✅ Yes |
| **GET** | `/order/user` | Get user orders | ✅ Yes |
| **GET** | `/order/{orderId}` | Get order details | ✅ Yes |
| **PUT** | `/order/{orderId}/status` | Update order status | ✅ Yes |

---

## User Management

### Get Current User Profile

**Endpoint:** `GET /users/{userId}`  
**Auth Required:** ✅ Yes

```typescript
export const getCurrentUser = async (userId: string, token: string) => {
  const response = await apiClient.get(`/users/${userId}`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  
  return response.data;
  // Response:
  // {
  //   id: string,
  //   fullName: string,
  //   email: string,
  //   contactNumber: string,
  //   kahaId: string,
  //   avatar: string,
  //   role: 'admin' | 'staff' | 'customer',
  //   status: 'verified' | 'unverified',
  //   createdAt: Date
  // }
};
```

### Get User Business Roles

**Endpoint:** `GET /business-users/{businessId}/{userId}`  
**Auth Required:** ✅ Yes

```typescript
export const getUserBusinessRoles = async (
  businessId: string,
  userId: string,
  token: string
) => {
  const response = await apiClient.get(
    `/business-users/${businessId}/${userId}`,
    { headers: { 'Authorization': `Bearer ${token}` } }
  );
  
  return response.data;
  // Response:
  // {
  //   id: string,
  //   role: {
  //     id: string,
  //     name: string,
  //     description: string
  //   },
  //   user: {
  //     id: string,
  //     fullName: string,
  //     email: string,
  //     // ... (password is stripped by backend)
  //   },
  //   createdAt: Date,
  //   updatedAt: Date
  // }
};
```

---

## Business Management

### Get Business Details

**Endpoint:** `GET /businesses/{businessId}`  
**Auth Required:** ✅ Yes

```typescript
export const getBusinessDetails = async (businessId: string, token: string) => {
  const response = await apiClient.get(`/businesses/${businessId}`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  
  return response.data;
  // Response structure:
  // {
  //   id: string,
  //   name: string,
  //   kahaId: string,
  //   contact: string,
  //   avatar: string,
  //   category: { name: string, parentCategoryName: string },
  //   workingDaysAndHours: Record<string, string>,
  //   location: { type: 'Point', coordinates: [lat, lng] },
  //   mapAddress: {
  //     street: string,
  //     province: string,
  //     district: string,
  //     municipality: string,
  //     wardNo: string,
  //     country: string
  //   },
  //   available: boolean,
  //   delivery: boolean,
  //   pickup: boolean,
  //   createdAt: Date
  // }
};
```

---

## Menu Management

### Get All Menu Items

**Endpoint:** `GET /menu`  
**Auth Required:** ✅ Yes

```typescript
export const getMenuItems = async (
  businessId: string,
  filters?: {
    categoryId?: string;
    isAvailable?: boolean;
    search?: string;
    page?: number;
    limit?: number;
  },
  token?: string
) => {
  const params = new URLSearchParams(
    Object.entries(filters || {}).reduce((acc, [k, v]) => {
      if (v !== undefined && v !== null) acc[k] = String(v);
      return acc;
    }, {} as Record<string, string>)
  );
  
  const response = await apiClient.get(`/menu/${businessId}?${params}`, {
    headers: token ? { 'Authorization': `Bearer ${token}` } : {}
  });
  
  return response.data;
  // Returns array of menu items
};
```

### Get Menu Item Details

**Endpoint:** `GET /menu/{menuId}`

```typescript
export const getMenuItemDetails = async (menuId: string) => {
  const response = await apiClient.get(`/menu/${menuId}`);
  
  return response.data;
  // Response:
  // {
  //   id: string,
  //   name: string,
  //   description: string,
  //   price: number,
  //   discountedPrice?: number,
  //   images: string[],
  //   category: { id: string, name: string },
  //   variants: [
  //     { id: string, name: string, price: number, isAvailable: boolean }
  //   ],
  //   addonGroups: [
  //     {
  //       id: string,
  //       name: string,
  //       isRequired: boolean,
  //       minSelect: number,
  //       maxSelect: number,
  //       selectionType: 'single' | 'multi',
  //       addons: [
  //         { id: string, name: string, price: number, isActive: boolean }
  //       ]
  //     }
  //   ],
  //   isAvailable: boolean,
  //   isSignature: boolean,
  //   allowAddOns: boolean,
  //   createdAt: Date,
  //   updatedAt: Date
  // }
};
```

### Create Menu Item (Admin)

**Endpoint:** `POST /menu`  
**Auth Required:** ✅ Yes (Admin only)

```typescript
export const createMenuItem = async (
  menuData: {
    name: string;
    categoryId: string;
    description: string;
    price: number;
    discountedPrice?: number;
    images: string[];
    services: string[];
    isAvailable: boolean;
    isSignature: boolean;
    allowAddOns: boolean;
  },
  token: string
) => {
  const response = await apiClient.post('/menu', menuData, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  
  return response.data;
};
```

### Update Menu Item

**Endpoint:** `PUT /menu/{menuId}`

```typescript
export const updateMenuItem = async (
  menuId: string,
  updates: Partial<any>,
  token: string
) => {
  const response = await apiClient.put(`/menu/${menuId}`, updates, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  
  return response.data;
};
```

### Delete Menu Item

**Endpoint:** `DELETE /menu/{menuId}`

```typescript
export const deleteMenuItem = async (menuId: string, token: string) => {
  const response = await apiClient.delete(`/menu/${menuId}`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  
  return response.data;
};
```

---

## Shopping Cart

### Create Cart

**Endpoint:** `POST /cart`  
**Auth Required:** ✅ Yes

```typescript
export const createCart = async (token: string) => {
  const response = await apiClient.post('/cart', {}, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  
  return response.data;
  // Response:
  // {
  //   id: string,
  //   userId: string,
  //   businessId: string,
  //   cartItems: [],
  //   createdAt: Date,
  //   updatedAt: Date
  // }
};
```

### Get User Cart

**Endpoint:** `GET /cart`  
**Auth Required:** ✅ Yes

```typescript
export const getUserCart = async (businessId: string, token: string) => {
  const response = await apiClient.get(`/cart?businessId=${businessId}`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  
  return response.data;
  // Response:
  // {
  //   id: string,
  //   userId: string,
  //   businessId: string,
  //   cartItems: [
  //     {
  //       id: string,
  //       quantity: number,
  //       unitPriceSnapshot: number,
  //       specialInstructions?: string,
  //       menu: { id, name, price, images },
  //       menuVariant?: { id, name, price },
  //       addOns: [
  //         {
  //           id: string,
  //           quantity: number,
  //           addon: { id, name, price }
  //         }
  //       ]
  //     }
  //   ],
  //   createdAt: Date,
  //   updatedAt: Date
  // }
};
```

### Add Item to Cart

**Endpoint:** `POST /cart/item`  
**Auth Required:** ✅ Yes

```typescript
export const addItemToCart = async (
  userId: string,
  menuId: string,
  menuVariantId?: string,
  quantity: number = 1,
  addonInfo?: Array<{ addonsId: string; quantity: number }>,
  token?: string
) => {
  const response = await apiClient.post(
    '/cart/item',
    {
      userId,
      menuId,
      menuVariantId,
      quantity,
      addonInfo: addonInfo || []
    },
    { headers: token ? { 'Authorization': `Bearer ${token}` } : {} }
  );
  
  return response.data;
};
```

### Update Cart Item

**Endpoint:** `PUT /cart/{itemId}`

```typescript
export const updateCartItem = async (
  itemId: string,
  updates: { quantity?: number; specialInstructions?: string },
  token: string
) => {
  const response = await apiClient.put(`/cart/${itemId}`, updates, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  
  return response.data;
};
```

### Remove Item from Cart

**Endpoint:** `DELETE /cart/{itemId}`

```typescript
export const removeCartItem = async (itemId: string, token: string) => {
  const response = await apiClient.delete(`/cart/${itemId}`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  
  return response.data;
};
```

---

## Orders

### Create Order from Cart

**Endpoint:** `POST /order/from-cart`  
**Auth Required:** ✅ Yes

```typescript
export const createOrderFromCart = async (
  orderData: {
    businessId: string;
    serviceType: 'DINE_IN' | 'DELIVERY' | 'TAKEAWAY';
    tableNumber?: string;
    remarks?: string;
    paymentMethod?: string;
    cartItemIds?: string[];
    deliveryFee?: number;
    serviceCharge?: number;
    tipAmount?: number;
    discountAmount?: number;
  },
  token: string
) => {
  const response = await apiClient.post('/order/from-cart', orderData, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  
  return response.data;
  // Response:
  // {
  //   message: string,  // e.g., "Order created successfully. 3 item(s) ordered. Order #ORD-1716234567890, Total: 1519"
  //   orderNumber?: string,
  //   orderId?: string
  // }
};
```

### Get User Orders

**Endpoint:** `GET /order/user`  
**Auth Required:** ✅ Yes

```typescript
export const getUserOrders = async (
  filters?: {
    status?: string;
    serviceType?: string;
    page?: number;
    limit?: number;
  },
  token?: string
) => {
  const params = new URLSearchParams(
    Object.entries(filters || {}).reduce((acc, [k, v]) => {
      if (v !== undefined && v !== null) acc[k] = String(v);
      return acc;
    }, {} as Record<string, string>)
  );
  
  const response = await apiClient.get(`/order/user?${params}`, {
    headers: token ? { 'Authorization': `Bearer ${token}` } : {}
  });
  
  return response.data;
  // Returns array of orders
};
```

### Get Order Details

**Endpoint:** `GET /order/{orderId}`  
**Auth Required:** ✅ Yes

```typescript
export const getOrderDetails = async (orderId: string, token: string) => {
  const response = await apiClient.get(`/order/${orderId}`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  
  return response.data;
  // Response:
  // {
  //   id: string,
  //   orderNumber: string,
  //   userId: string,
  //   businessId: string,
  //   serviceType: 'DINE_IN' | 'DELIVERY' | 'TAKEAWAY',
  //   tableNumber?: string,
  //   subtotal: number,
  //   taxAmount: number,
  //   deliveryFee: number,
  //   serviceCharge: number,
  //   discountAmount: number,
  //   tipAmount: number,
  //   totalAmount: number,
  //   paymentStatus: 'UNPAID' | 'PAID' | 'REFUNDED' | 'FAILED',
  //   paymentMethod?: string,
  //   remarks?: string,
  //   orderItems: [
  //     {
  //       id: string,
  //       quantity: number,
  //       menuNameSnapshot: string,
  //       variantNameSnapshot?: string,
  //       unitPriceSnapshot: number,
  //       addonsTotal: number,
  //       lineTotal: number,
  //       addons: []
  //     }
  //   ],
  //   orderStatus: [
  //     {
  //       id: string,
  //       status: 'PENDING' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED',
  //       updatedBy: string,
  //       remarks?: string,
  //       createdAt: Date
  //     }
  //   ],
  //   createdAt: Date,
  //   updatedAt: Date
  // }
};
```

### Update Order Status

**Endpoint:** `POST /order/{orderId}/change-status`  
**Auth Required:** ✅ Yes

```typescript
export const updateOrderStatus = async (
  orderId: string,
  status: 'PENDING' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED',
  token: string
) => {
  const response = await apiClient.post(
    `/order/${orderId}/change-status`,
    { status },
    { headers: { 'Authorization': `Bearer ${token}` } }
  );
  
  return response.data;
};
```

---

## Error Handling

### Standard Error Response

```json
{
  "statusCode": 400,
  "message": "Validation failed",
  "error": "Bad Request"
}
```

### Common Errors

| Code | Status | Description | Solution |
|------|--------|-------------|----------|
| 400 | Bad Request | Validation failed, missing data | Check request payload |
| 401 | Unauthorized | Missing/invalid JWT token | Login again |
| 403 | Forbidden | Insufficient permissions | Check user role |
| 404 | Not Found | Resource doesn't exist | Verify IDs |
| 500 | Server Error | Backend error | Retry or contact support |

### Error Handling Implementation

```typescript
// Global error handler
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('authToken');
      window.location.href = '/login';
    } else if (error.response?.status === 403) {
      // Insufficient permissions
      console.error('Access denied:', error.response.data.message);
    } else if (error.response?.status === 400) {
      // Validation error
      console.error('Invalid request:', error.response.data.message);
    }
    
    return Promise.reject(error);
  }
);
```

---

## Implementation Examples

### Complete Login Flow

```typescript
// pages/LoginPage.tsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { loginUser } from '@/services/authService';

export const LoginPage = () => {
  const [contactNumber, setContactNumber] = useState('9813870231');
  const [password, setPassword] = useState('ishwor19944');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await loginUser(contactNumber, password);
      
      // Token stored automatically by service
      if (response.role === 'admin') {
        navigate('/admin/dashboard');
      } else {
        navigate('/menu');
      }
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleLogin}>
      <input
        type="text"
        value={contactNumber}
        onChange={(e) => setContactNumber(e.target.value)}
        placeholder="Contact Number"
      />
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Password"
      />
      {error && <div className="error">{error}</div>}
      <button type="submit" disabled={loading}>
        {loading ? 'Logging in...' : 'Login'}
      </button>
    </form>
  );
};
```

### Browse Menu with Filtering

```typescript
// pages/MenuPage.tsx
import { useState, useEffect } from 'react';
import { getMenuItems } from '@/services/menuService';

export const MenuPage = () => {
  const [menu, setMenu] = useState([]);
  const [loading, setLoading] = useState(true);
  const [categoryId, setCategoryId] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => {
    const fetchMenu = async () => {
      setLoading(true);
      try {
        const data = await getMenuItems('business-uuid', {
          categoryId: categoryId || undefined,
          search: search || undefined,
          limit: 20
        });
        setMenu(data);
      } catch (error) {
        console.error('Failed to fetch menu:', error);
      } finally {
        setLoading(false);
      }
    };

    const timer = setTimeout(fetchMenu, 500); // Debounce
    return () => clearTimeout(timer);
  }, [categoryId, search]);

  if (loading) return <div>Loading menu...</div>;

  return (
    <div>
      <input
        type="text"
        placeholder="Search menu..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />
      
      <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
        <option value="">All Categories</option>
        {/* Categories here */}
      </select>

      <div className="menu-grid">
        {menu.map((item) => (
          <div key={item.id} className="menu-card">
            <img src={item.images?.[0]} alt={item.name} />
            <h3>{item.name}</h3>
            <p>{item.description}</p>
            <span className="price">${item.discountedPrice || item.price}</span>
            <button onClick={() => handleAddToCart(item)}>Add to Cart</button>
          </div>
        ))}
      </div>
    </div>
  );
};
```

### Shopping Cart with Checkout

```typescript
// pages/CartPage.tsx
import { useState, useEffect } from 'react';
import { getUserCart, createOrderFromCart } from '@/services/orderService';

export const CartPage = () => {
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(true);
  const [serviceType, setServiceType] = useState('DELIVERY');
  const [remarks, setRemarks] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadCart();
  }, []);

  const loadCart = async () => {
    try {
      const token = localStorage.getItem('authToken');
      const data = await getUserCart('business-uuid', token!);
      setCart(data);
    } catch (error) {
      console.error('Failed to load cart:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCheckout = async () => {
    setSubmitting(true);
    try {
      const token = localStorage.getItem('authToken');
      await createOrderFromCart(
        {
          businessId: 'business-uuid',
          serviceType: serviceType as any,
          remarks,
          paymentMethod: 'CASH'
        },
        token!
      );
      
      // Order created successfully
      window.location.href = '/orders';
    } catch (error) {
      console.error('Checkout failed:', error);
      alert('Failed to create order');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div>Loading cart...</div>;
  if (!cart || cart.cartItems.length === 0) return <div>Cart is empty</div>;

  return (
    <div>
      <h1>Shopping Cart</h1>
      
      {cart.cartItems.map((item: any) => (
        <div key={item.id} className="cart-item">
          <h3>{item.menu.name}</h3>
          <p>Qty: {item.quantity}</p>
          <p>Price: ${item.unitPriceSnapshot}</p>
        </div>
      ))}

      <div className="checkout-section">
        <select value={serviceType} onChange={(e) => setServiceType(e.target.value)}>
          <option value="DELIVERY">Delivery</option>
          <option value="TAKEAWAY">Takeaway</option>
          <option value="DINE_IN">Dine In</option>
        </select>

        <textarea
          value={remarks}
          onChange={(e) => setRemarks(e.target.value)}
          placeholder="Special instructions..."
        />

        <button onClick={handleCheckout} disabled={submitting}>
          {submitting ? 'Processing...' : 'Checkout'}
        </button>
      </div>
    </div>
  );
};
```

---

## Testing Credentials

| Field | Value |
|-------|-------|
| **Contact Number** | `9813870231` |
| **Password** | `ishwor19944` |
| **Email** | `replyishwor@gmail.comz` |
| **User ID** | `afc70db3-6f43-4882-92fd-4715f25ffc95` |
| **Business ID** | `7476ee15-1407-41fa-9a49-89e0caaf945d` |
| **Business Name** | `IshworHostel` |

---

## Deployment

### Build for Production
```bash
npm run build
```

### Environment Variables for Production
```bash
REACT_APP_API_URL=https://your-api-domain.com
REACT_APP_KAHA_API_URL=https://api.kaha.com.np/main/api/v3
```

---

## Support & Resources

- **Backend API Docs:** Available at backend Swagger UI
- **Postman Collection:** See backend `/postman` directory
- **Backend Status:** ✅ Production Ready (All 5 issues fixed)
- **Frontend Status:** 🚧 Ready for UI/UX Implementation

---

**Last Updated:** May 28, 2026  
**Next Step:** Update Frontend UI/UX Components
