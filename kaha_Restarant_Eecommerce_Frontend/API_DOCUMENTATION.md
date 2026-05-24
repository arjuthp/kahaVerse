# KAHA Restaurant E-Commerce - Frontend Developer Guide

> **Complete API Documentation & Integration Guide**  
> Version: 1.0  
> Last Updated: May 21, 2026

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Authentication & Authorization](#authentication--authorization)
4. [Data Models & Entities](#data-models--entities)
5. [API Endpoints Reference](#api-endpoints-reference)
6. [CRUD Operations by Entity](#crud-operations-by-entity)
7. [User Flows & Integration Patterns](#user-flows--integration-patterns)
8. [Request/Response Examples](#requestresponse-examples)
9. [Error Handling](#error-handling)
10. [Best Practices](#best-practices)

---

## 🎯 Overview

KAHA Restaurant E-Commerce is a comprehensive multi-tenant restaurant platform built with NestJS, TypeORM, and PostgreSQL. This guide provides everything frontend developers need to integrate with the API.

### Key Features

- ✅ **Multi-tenant Architecture** - Multiple businesses on one platform
- ✅ **Complete Menu Management** - Categories, items, variants, and addons
- ✅ **Shopping Cart System** - Full cart management with addon support
- ✅ **Order Management** - Order creation, tracking, and status updates
- ✅ **Rating & Review System** - Customer feedback on menu items
- ✅ **Role-Based Access Control** - Customer, business admin, and super admin roles
- ✅ **Snapshot Pricing** - Historical price preservation for orders
- ✅ **Service Type Support** - Dine-in, delivery, and takeaway

### Base URL

```
Development: http://localhost:3000
Production: [Your production URL]
API Documentation: http://localhost:3000/api (Swagger)
```

---

## 🔐 Authentication & Authorization

### Authentication Flow

1. **User Login** (External Service)
   - User authenticates via **Kaha Main V3 API**
   - Receives JWT token containing: `{ id, kahaId, businessId }`

2. **API Requests**
   - Include JWT in all authenticated requests:
   ```http
   Authorization: Bearer <your-jwt-token>
   ```

3. **Token Validation**
   - API validates token using `JwtStrategy`
   - Extracts user info: `req.user = { id, kahaId, businessId }`

### Authorization Roles

| Role | Description | Access Level |
|------|-------------|--------------|
| `user` | Regular customer | Browse menu, manage cart, create orders, rate items |
| `business_super_admin` | Business owner/manager | Full menu management, view business orders |
| `admin` | Platform admin | Platform-level operations |
| `super_admin` | System administrator | Full system access |

---

## 📡 API Endpoints Reference

### Base URL
```
http://localhost:3000
```

### Categories
- `GET /categories/business/:businessId` - Get all categories (Public)
- `GET /categories/:id` - Get single category (Public)
- `POST /categories` - Create category (BUSINESS_SUPER_ADMIN)
- `PATCH /categories/:id` - Update category (BUSINESS_SUPER_ADMIN)
- `DELETE /categories/:id` - Delete category (BUSINESS_SUPER_ADMIN)

### Menu
- `GET /menu/:businessId` - Get all menu items (Public)
- `GET /menu/:id` - Get single menu item (Public)
- `POST /menu` - Create menu item (BUSINESS_SUPER_ADMIN)
- `PATCH /menu/:id` - Update menu item (BUSINESS_SUPER_ADMIN)
- `DELETE /menu/:id` - Delete menu item (BUSINESS_SUPER_ADMIN)

### Cart
- `POST /cart` - Create cart (JWT)
- `POST /cart/item` - Add item to cart (JWT)
- `GET /cart` - Get user cart (JWT)
- `PATCH /cart/:itemId` - Update cart item (JWT)
- `DELETE /cart/:id` - Delete cart item (JWT)

### Orders
- `POST /order` - Create order (JWT)
- `POST /order/from-cart` - Create order from cart (JWT)
- `GET /order/user` - Get user orders (JWT)
- `GET /order/:id` - Get single order (JWT)
- `POST /order/:orderId/change-status` - Update order status (JWT)

### Menu Ratings
- `POST /menu-ratings` - Create rating (JWT)
- `GET /menu-ratings/menu/:menuId` - Get menu ratings (JWT)
- `PATCH /menu-ratings` - Update rating (JWT)
- `DELETE /menu-ratings/:id` - Delete rating (JWT)

---

## 📊 Data Models

### Menu Item
```typescript
interface Menu {
  id: string;
  name: string;
  description?: string;
  images?: string[];
  price: number;
  discountedPrice?: number;
  isAvailable: boolean;
  isSignature: boolean;
  services: ('DINE_IN' | 'DELIVERY' | 'TAKEAWAY')[];
  category: Category;
  variants: MenuVariant[];
  addonGroups: AddonGroup[];
}
```

### Cart
```typescript
interface Cart {
  id: string;
  userId: string;
  businessId: string;
  cartItems: CartItem[];
}

interface CartItem {
  id: string;
  quantity: number;
  unitPriceSnapshot: number;
  menu: Menu;
  menuVariant?: MenuVariant;
  addOns: CartItemAddon[];
}
```

### Order
```typescript
interface Order {
  id: string;
  orderNumber: string;
  userId: string;
  businessId: string;
  serviceType: 'DINE_IN' | 'DELIVERY' | 'TAKEAWAY';
  subtotal: number;
  taxAmount: number;
  totalAmount: number;
  paymentStatus: 'UNPAID' | 'PAID' | 'REFUNDED' | 'FAILED';
  orderItems: OrderItem[];
  orderStatus: OrderStatus[];
}
```

---

## 🚀 Quick Start

### 1. Setup API Client
```typescript
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:3000',
  headers: {
    'Content-Type': 'application/json'
  }
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('authToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
```

### 2. Fetch Menu Items
```typescript
const fetchMenu = async (businessId: string) => {
  const response = await api.get(`/menu/${businessId}`);
  return response.data;
};
```

### 3. Add to Cart
```typescript
const addToCart = async (item: {
  menuId: string;
  menuVariantId?: string;
  quantity: number;
  addonInfo?: Array<{ addonsId: string; quantity: number }>;
}) => {
  const response = await api.post('/cart/item', {
    userId: getCurrentUserId(),
    ...item
  });
  return response.data;
};
```

### 4. Checkout
```typescript
const checkout = async (orderData: {
  businessId: string;
  serviceType: 'DINE_IN' | 'DELIVERY' | 'TAKEAWAY';
  paymentMethod?: string;
}) => {
  const response = await api.post('/order/from-cart', orderData);
  return response.data;
};
```

---

## ⚠️ Error Handling

### Standard Error Response
```json
{
  "statusCode": 400,
  "message": "Validation failed",
  "error": "Bad Request"
}
```

### Common Status Codes
- **200** - OK
- **201** - Created
- **400** - Bad Request
- **401** - Unauthorized
- **403** - Forbidden
- **404** - Not Found
- **500** - Internal Server Error

---

## 💡 Best Practices

1. **Always validate businessId** before checkout
2. **Use snapshot prices** in cart display
3. **Validate addon selections** based on group rules
4. **Handle token expiration** gracefully
5. **Implement optimistic updates** for better UX
6. **Cache menu data** to reduce API calls
7. **Show loading states** during API calls
8. **Implement error boundaries** for graceful failures

---

For complete documentation, see the full API guide.
