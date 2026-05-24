# Restaurant E-Commerce API Endpoints

## Overview
This microservice is part of the Kaha ecosystem and integrates with **Kaha Main v3 API** for user authentication and business management.

---

## External API Dependencies

### Kaha Main v3 API
**Base URL:** `process.env.KAH_API_V3_BASE_URL` (e.g., `https://api.kaha.com/v3` or `http://localhost:3001`)

This service communicates with Kaha Main v3 for authentication and authorization data:

| Method | Endpoint | Purpose | Called From |
|--------|----------|---------|-------------|
| GET | `/users/{userId}` | Get user information and roles | ServiceCommunicationService.getUser() |
| GET | `/users/{userId}` | Get user roles for access control | ServiceCommunicationService.getUserRoles() |
| GET | `/businesses/{businessId}` | Get business information | ServiceCommunicationService.getBusiness() |
| GET | `/business-users/{businessId}/{userId}` | Get user's role within a specific business | ServiceCommunicationService.getBusinessUserRoles() |

**Authentication Flow:**
1. User authenticates via Kaha Main v3 API (external)
2. JWT token is issued containing: `id`, `kahaId`, `businessId`
3. This microservice validates JWT and extracts user context
4. Additional user/business data fetched from Kaha Main v3 as needed

---

## Base Routes

### Root
- **GET** `/` - Health check / Welcome message

---

## Addons Module
**Base Path:** `/addons`

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/addons` | Create a new addon | No |
| GET | `/addons` | Get all addons | No |
| GET | `/addons/:id` | Get addon by ID | No |
| PATCH | `/addons/:id` | Update addon by ID | No |
| DELETE | `/addons/:id` | Delete addon by ID | No |

---

## Cart Module
**Base Path:** `/cart`

| Method | Endpoint | Description | Auth Required | Role Required |
|--------|----------|-------------|---------------|---------------|
| POST | `/cart` | Create a new cart | Yes (JWT) | - |
| POST | `/cart/item` | Add item to cart | Yes (JWT) | - |
| GET | `/cart` | Get user's cart | Yes (JWT) | - |
| PATCH | `/cart/:itemId` | Update cart item | No | - |
| DELETE | `/cart/:id` | Delete cart or cart item | Yes (JWT) | - |

---

## Categories Module
**Base Path:** `/categories`

| Method | Endpoint | Description | Auth Required | Role Required |
|--------|----------|-------------|---------------|---------------|
| POST | `/categories` | Create a new category | Yes (JWT) | BUSINESS_SUPER_ADMIN |
| GET | `/categories/:businessId` | Get all categories for a business | No | - |
| GET | `/categories/:id` | Get category by ID | No | - |
| PATCH | `/categories/:id` | Update category | Yes (JWT) | BUSINESS_SUPER_ADMIN |
| DELETE | `/categories/:id` | Delete category | Yes (JWT) | BUSINESS_SUPER_ADMIN |

---

## Menu Module
**Base Path:** `/menu`

| Method | Endpoint | Description | Auth Required | Role Required |
|--------|----------|-------------|---------------|---------------|
| POST | `/menu` | Create a new menu item | Yes (JWT) | BUSINESS_SUPER_ADMIN |
| GET | `/menu/:businessId` | Get all menu items for a business | No | - |
| GET | `/menu/:id` | Get menu item by ID | No | - |
| PATCH | `/menu/:id` | Update menu item | Yes (JWT) | BUSINESS_SUPER_ADMIN |
| PATCH | `/menu/update-addons/:id` | Update menu item addons | Yes (JWT) | BUSINESS_SUPER_ADMIN |
| PATCH | `/menu/toggle-signature/:id` | Toggle signature status | Yes (JWT) | BUSINESS_SUPER_ADMIN |
| DELETE | `/menu/:id` | Delete menu item | Yes (JWT) | BUSINESS_SUPER_ADMIN |

---

## Menu Ratings Module
**Base Path:** `/menu-ratings`

| Method | Endpoint | Description | Auth Required | Role Required |
|--------|----------|-------------|---------------|---------------|
| POST | `/menu-ratings` | Create a menu rating | Yes (JWT) | - |
| GET | `/menu-ratings/my-business` | Get ratings for business admin's business | Yes (JWT) | BUSINESS_SUPER_ADMIN |
| GET | `/menu-ratings/business/:businessId` | Get all ratings for a business | Yes (JWT) | - |
| GET | `/menu-ratings/menu:menuId` | Get ratings for a specific menu | Yes (JWT) | - |
| GET | `/menu-ratings/:id` | Get a specific rating by ID | Yes (JWT) | - |
| PATCH | `/menu-ratings` | Update a menu rating | Yes (JWT) | - |
| DELETE | `/menu-ratings/:id` | Delete a rating | Yes (JWT) | - |

---

## Order Module
**Base Path:** `/order`

| Method | Endpoint | Description | Auth Required | Role Required |
|--------|----------|-------------|---------------|---------------|
| POST | `/order` | Create a new order | Yes (JWT) | - |
| GET | `/order/user` | Get all orders for logged-in user | Yes (JWT) | - |
| GET | `/order/:id` | Get a specific order by ID | Yes (JWT) | - |
| GET | `/order/business-man-vs/:businessId` | Get all orders for a business | No | - |
| POST | `/order/:orderId/change-status` | Change order status | Yes (JWT) | - |

---

## Authentication & Authorization

### JWT Token Structure
The JWT token (issued by Kaha Main v3) contains:
```json
{
  "id": "user_id",
  "kahaId": "kaha_user_id", 
  "businessId": "business_id"
}
```

### Authentication Flow
1. **User Login** → Handled by Kaha Main v3 API (external)
2. **JWT Token** → Issued by Kaha Main v3, contains user identity
3. **Token Validation** → This service validates JWT signature
4. **User Context** → Extracts `userId`, `kahaId`, `businessId` from token
5. **Additional Data** → Fetches user roles/business info from Kaha Main v3 as needed

### Authorization Levels
- **Public**: No authentication required
- **Authenticated**: Requires valid JWT token
- **BUSINESS_SUPER_ADMIN**: Requires JWT + admin role for the business

### Notes
- **JWT Bearer Token**: Required for endpoints marked with "Yes (JWT)"
- **Roles**: Some endpoints require specific user roles (BUSINESS_SUPER_ADMIN)
- **User Context**: Authenticated endpoints automatically extract user information from the JWT token
- **Multi-tenancy**: All business operations are scoped by `businessId` from JWT token

## Query Parameters

### Cart
- `FilterCartDto` - Used for filtering cart items

### Menu
- `FilterMenuDto` - Used for filtering menu items (supports pagination, search, etc.)

### Order
- `FilterOrderDto` - Used for filtering orders (supports status, date range, etc.)

---

## Environment Configuration

Required environment variables:

```env
# Application
APP_PORT=3000

# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=restaurant_ecommerce
DB_USER_NAME=postgres
DB_PASSWORD=password

# JWT (must match Kaha Main v3 secret)
JWT_SECRET_TOKEN=your_secret_key

# External Services
KAH_API_V3_BASE_URL=https://api.kaha.com/v3  # Kaha Main v3 API
KAHA_API_LINK=https://api.kaha.com/v3        # Alternative config
```

---

## Service Architecture

### Internal Services
- **Restaurant E-Commerce API** (This Service)
  - Manages: Menu, Orders, Cart, Categories, Ratings, Addons
  - Database: PostgreSQL (ECOMMERCE_DB)
  - Port: Configured via `APP_PORT`

### External Dependencies
- **Kaha Main v3 API** (External Service)
  - Manages: Users, Authentication, Business Management
  - Database: PostgreSQL (AUTH_DB)
  - Accessed via: `KAH_API_V3_BASE_URL`

### Communication Pattern
```
Client → [JWT Auth] → Restaurant E-Commerce API
                            ↓
                    [HTTP Requests]
                            ↓
                      Kaha Main v3 API
                            ↓
                        AUTH_DB
```

---

## Notes

1. All endpoints return JSON responses
2. The API uses Swagger/OpenAPI documentation (accessible via `/api` or `/docs` typically)
   - Title: "KAHA-Restaurant Backend API"
   - Version: 1.0
3. Some endpoints have duplicate route definitions (e.g., DELETE `/cart/:id`) which may need review
4. The project uses NestJS framework with TypeORM for database operations
5. **No user registration/login endpoints** - Authentication is handled by Kaha Main v3 API
6. This is a microservice architecture where user management is centralized in Kaha Main v3
