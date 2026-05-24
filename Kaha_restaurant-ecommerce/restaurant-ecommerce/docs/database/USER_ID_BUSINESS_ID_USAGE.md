# Complete Reference: userId & businessId Usage Across the System

## Summary
`userId` and `businessId` are **NOT** limited to the 4 places you mentioned. They appear across **6 entities** and are extracted/validated via the **AUTH_DB through Kaha Main v3 API**.

---

## 1. ALL PLACES WHERE userId IS USED

### Entity Level (`@Column`)

| Entity | Field | Purpose |
|--------|-------|---------|
| **CartEntity** | `userId` | Points to AUTH_DB user |
| **OrderEntity** | `userId` | Points to AUTH_DB user |
| **OrderStatusEntity** | `updatedBy` | Points to AUTH_DB user (staff who updated order) |
| **MenuRatingEntity** | `ratedBy` | Points to AUTH_DB user (customer who rated) |

### Service Level (Where it's Used)

```
Cart Service:
- createCart(userId) → Creates cart for AUTH_DB user
- addItemToCart(userId) → Adds items to user's cart
- findUserCart(userId) → Retrieves user's cart
- deleteCartItem(userId) → Deletes from user's cart
- deleteCart(userId) → Deletes entire user's cart

Order Service:
- createOrder(userId) → Creates order for AUTH_DB user
- findOneOrder(id, userId) → Gets user's specific order
- findUserOrders(userId) → Gets all user's orders
- changeOrderStatus(orderId, userId) → Staff updates order status

Menu Rating Service:
- createMenuRating(userId) → User creates rating
- updateMenuRating(userId) → User updates their rating
- deleteRating(userId) → User deletes their rating
```

---

## 2. ALL PLACES WHERE businessId IS USED

### Entity Level (`@Column`)

| Entity | Field | Purpose |
|--------|-------|---------|
| **MenuEntity** | `businessId` | Isolates menu per business |
| **CategoryEntity** | `businessId` | Isolates categories per business |
| **OrderEntity** | `businessId` | Links order to business that received it |
| **OrderStatusEntity** | `businessId` (via OrderEntity relation) | Tracks which business order belongs to |
| **MenuRatingEntity** | `businessId` | Isolates ratings per business |

### Service Level (Where it's Used)

```
Menu Service:
- createMenu(businessId) → Creates menu for specific business
- findAllMenu(businessId) → Lists menus for specific business
- updateMenu(id, businessId) → Updates business's menu
- deleteMenu(menuId, businessId) → Deletes business's menu

Category Service:
- findAllCategories(businessId) → Lists categories for specific business

Order Service:
- findBusinessOrders(businessId) → Staff views orders for their business
- getBusinessInfo(businessId) → Fetches business details for order response

Menu Rating Service:
- getBusinessMenuRatings(businessId) → Gets all ratings for business
```

---

## 3. HOW userId & businessId ARE EXTRACTED FROM KAHA MAIN V3

### 3.1 JWT Token Extraction (On Request)

```typescript
// Order Controller Example
@Controller("order")
export class OrderController {
  @Post()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  createOrder(@Body() body: CreateOrderDto, @Req() req: any) {
    // ← JWT Token from Authorization header is decoded here
    // User decorator gets: req.user.id (from JWT payload)
    // This is then passed to service
    const userId = req?.user?.id;
    const businessId = req?.user?.businessId;
    // Both are in JWT claims from AUTH_DB
  }
}

// Menu Controller Example
async createMenu(@Body() body: CreateMenuDto, @Req() req) {
  const businessId = req.user.businessId;  // ← From JWT token
  return this.menuService.createMenu(businessId, body);
}
```

### 3.2 JWT Payload Structure (From AUTH_DB)
The JWT token contains claims that include:
```json
{
  "id": "user-uuid",              // ← userId (from AUTH_DB users table)
  "businessId": "business-uuid",   // ← businessId (from AUTH_DB businesses table)
  "role": "customer|staff|admin",  // ← role (from AUTH_DB business_users table)
  "iat": 1234567890
}
```

---

## 4. WHERE DATA IS FETCHED FROM KAHA MAIN V3

### ServiceCommunicationService

This service makes HTTP requests to **Kaha Main v3** API to get AUTH_DB data:

```typescript
@Injectable()
export class ServiceCommunicationService {
  constructor(private readonly httpService: HttpService) {}

  // 1️⃣ Get User Roles (for access control)
  async getUserRoles(userId: string) {
    const baseUrl = process.env.KAH_API_V3_BASE_URL;  // ← Points to Kaha Main v3
    const url = `${baseUrl}/users/${userId}`;        // ← Fetches from AUTH_DB
    return await this.httpService.get(url);          // ← User data from AUTH_DB
  }

  // 2️⃣ Get Business User Roles (staff permissions)
  async getBusinessUserRoles(businessId: string, userId: string) {
    const url = `${baseUrl}/business-users/${businessId}/${userId}`;
    return await this.httpService.get(url);  // ← BusinessUser data from AUTH_DB
  }

  // 3️⃣ Get User Details (for order responses)
  async getUser(userId: string) {
    const url = `${baseUrl}/users/${userId}`;
    return await this.httpService.get(url);  // ← User info: name, email, avatar
  }

  // 4️⃣ Get Business Details (for order responses)
  async getBusiness(businessId: string) {
    const url = `${baseUrl}/businesses/${businessId}`;
    return await this.httpService.get(url);  // ← Business info: name, address
  }
}
```

### How It's Used:

```typescript
// In Order Service - getBusinessInfo method
private async getBusinessInfo(businessId: string): Promise<IBusinessInfo> {
  try {
    const businessData = await this.serviceCommunicationService.getBusiness(businessId);
    // ↑ Makes HTTP request to Kaha Main v3 AUTH_DB
    
    return {
      name: businessData.name,
      category: businessData.category?.name || '',
      address: businessData.address || '',
      avatar: businessData.avatar || '',
    };
  } catch (error) {
    console.error('Failed to fetch business info:', error);
    return null;
  }
}

// In Order Service - getUserInfo method  
private async getUserInfo(userId: string): Promise<IUserInfo> {
  const userData = await this.serviceCommunicationService.getUser(userId);
  // ↑ Makes HTTP request to Kaha Main v3 AUTH_DB
  
  return {
    name: userData.name,
    email: userData.email,
    contact: userData.contact,
    avatar: userData.avatar,
  };
}
```

---

## 5. DATA FLOW: How User & Business Data Flows Through the System

### Step-by-Step Journey:

```
┌─────────────────────────────────────────────────────────────────┐
│ 1. CLIENT MAKES REQUEST WITH JWT TOKEN                          │
│    POST /order { items: [...] }                                 │
│    Header: Authorization: Bearer eyJhbGciOi...                  │
└─────────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────────┐
│ 2. NESTJS JwtAuthGuard VALIDATES & DECODES TOKEN                │
│    (Token comes from KAHA MAIN V3 / AUTH_DB)                    │
│                                                                  │
│    Decoded JWT contains:                                        │
│    {                                                            │
│      id: "user-123" → FROM AUTH_DB users table                 │
│      businessId: "business-456" → FROM AUTH_DB businesses table│
│      role: "customer" → FROM AUTH_DB business_users table      │
│    }                                                            │
└─────────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────────┐
│ 3. CONTROLLER EXTRACTS userId & businessId FROM JWT              │
│                                                                  │
│    @Post()                                                      │
│    @UseGuards(JwtAuthGuard)                                    │
│    async createOrder(@Req() req, @Body() body) {              │
│      const userId = req.user.id;           ← From JWT           │
│      const businessId = req.user.businessId; ← From JWT        │
│      return this.orderService.createOrder(userId, body);      │
│    }                                                            │
└─────────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────────┐
│ 4. SERVICE CREATES ORDER IN ORDER_DB                            │
│                                                                  │
│    async createOrder(body, userId) {                           │
│      const order = await this.orderRepository.save({          │
│        userId: userId,           ← Stored in ORDER_DB         │
│        businessId: businessId,   ← Stored in ORDER_DB         │
│        totalAmount: body.total,                               │
│      });                                                       │
│    }                                                            │
│                                                                  │
│    NOTE: userId & businessId are FOREIGN KEYS to AUTH_DB      │
│    (Not stored as duplicates, just references)                 │
└─────────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────────┐
│ 5. WHEN RETURNING ORDER DATA, FETCH DETAILS FROM KAHA MAIN V3   │
│                                                                  │
│    async findUserOrders(userId) {                              │
│      const orders = await this.orderRepository.find({         │
│        where: { userId }                                       │
│      });                                                       │
│                                                                │
│      return Promise.all(orders.map(async (order) => ({       │
│        ...order,                                              │
│        userInfo: await serviceCommunicationService.getUser(   │
│          order.userId  ← Make HTTP request to Kaha Main v3    │
│        ),                                                     │
│        businessInfo: await serviceCommunicationService        │
│          .getBusiness(order.businessId) ← HTTP to Kaha Main v3│
│      })));                                                    │
│    }                                                            │
└─────────────────────────────────────────────────────────────────┘
```

---

## 6. ROLE-BASED ACCESS CONTROL (RolesGuard)

```typescript
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private serviceCommunicationService: ServiceCommunicationService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredRoles = this.reflector.getAllAndOverride<UserRoleEnum[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()]
    );

    const req = context.switchToHttp().getRequest();
    const userId = req.user.id;           // ← From JWT (AUTH_DB)
    const businessId = req.user?.businessId; // ← From JWT (AUTH_DB)

    if (userId && businessId) {
      // Check staff permissions
      const businessUserRole = 
        await this.serviceCommunicationService.getBusinessUserRoles(
          businessId,  // ← Call Kaha Main v3 to check businessUser role
          userId
        );
      return requiredRoles.some(role => businessUserRole?.role === role);
    }

    // Otherwise check global user role
    const user = await this.serviceCommunicationService.getUserRoles(userId);
    return requiredRoles.some(role => user.role === role);
  }
}
```

---

## 7. COMPLETE USAGE MATRIX

| Component | userId Source | businessId Source | Used For |
|-----------|------|------|----------|
| **JWT Token** | AUTH_DB users.id | AUTH_DB businesses.id | Initial extraction from HTTP request |
| **CartEntity** | ✅ Stored | ❌ Not stored | User's cart identification |
| **OrderEntity** | ✅ Stored | ✅ Stored | Order-user & order-business linking |
| **OrderStatusEntity** | ✅ Stored as updatedBy | (inherited via OrderEntity) | Track which staff updated order |
| **MenuRatingEntity** | ✅ Stored as ratedBy | ✅ Stored | Isolate ratings per business & user |
| **MenuEntity** | ❌ Not stored | ✅ Stored | Menu belongs to specific business |
| **CategoryEntity** | ❌ Not stored | ✅ Stored | Categories belong to business |
| **ServiceCommunicationService** | ✅ Used to fetch from Kaha Main v3 | ✅ Used to fetch from Kaha Main v3 | Get detailed info from AUTH_DB |

---

## 8. CONFIGURATION: How Kaha Main v3 Endpoint is Set

### In `.env` file:
```env
KAH_API_V3_BASE_URL=https://api.kaha.com/v3  # ← Kaha Main v3 server
# OR for local development:
KAH_API_V3_BASE_URL=http://localhost:3001    # ← Local Kaha Main v3
```

### How It's Used:
```typescript
// In any method of ServiceCommunicationService
const baseUrl = process.env.KAH_API_V3_BASE_URL;
const url = `${baseUrl}/users/${userId}`;
const response = await this.httpService.get(url);
```

---

## 9. KAHA MAIN V3 INTEGRATION POINTS

### ServiceCommunicationService Endpoints Called:

| Method | Endpoint Called | AUTH_DB Table | Returns |
|--------|-----------------|---------------|---------|
| `getUserRoles(userId)` | `/users/{userId}` | users | User role (CUSTOMER, ADMIN, etc.) |
| `getBusinessUserRoles(businessId, userId)` | `/business-users/{businessId}/{userId}` | business_users | Staff role for specific business |
| `getUser(userId)` | `/users/{userId}` | users | User full data (name, email, avatar) |
| `getBusiness(businessId)` | `/businesses/{businessId}` | businesses | Business full data (name, address, category) |

---

## 10. KEY TAKEAWAYS

✅ **userId** appears in 4 entities:
- CartEntity
- OrderEntity
- OrderStatusEntity (as updatedBy)
- MenuRatingEntity (as ratedBy)

✅ **businessId** appears in 5 entities:
- MenuEntity
- CategoryEntity
- OrderEntity
- MenuRatingEntity
- (OrderStatusEntity via OrderEntity)

✅ **Extraction Points** (Where they come from):
1. **JWT Token** (HTTP Authorization header) → Contains userId & businessId claims
2. **ServiceCommunicationService** → Makes HTTP calls to **Kaha Main v3 API**

✅ **Kaha Main v3 Role**:
- Is the **central AUTH_DB**
- Provides user roles, business info, and permissions
- Is called via HTTP from this microservice
- Uses `KAH_API_V3_BASE_URL` environment variable

✅ **Multi-tenancy Implementation**:
- Each business has isolated data via businessId filter
- Users belong to businesses via JWT businessId claim
- Roles determine permissions within each business
