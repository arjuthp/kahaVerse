# Restaurant E-Commerce Microservices Architecture

## 🏗️ System Overview

Your application uses a **Microservices Architecture** where each module is a separate service with its own responsibility.

```
┌────────────────────────────────────────────────────────────────┐
│                    CLIENT (Frontend/Mobile)                    │
└────────────────────────────────────────────────────────────────┘
                              │
                    ┌─────────┴─────────┐
                    ▼                   ▼
        ┌──────────────────┐  ┌──────────────────┐
        │   API Gateway    │  │  Load Balancer   │
        └──────────────────┘  └──────────────────┘
                    │
        ┌───────────┼───────────┬───────────┬───────────┐
        │           │           │           │           │
        ▼           ▼           ▼           ▼           ▼
    ┌─────────┐ ┌────────┐ ┌────────┐ ┌────────┐ ┌──────────┐
    │  AUTH   │ │ MENU   │ │ CART   │ │ ORDER  │ │ CATEGORY │
    │SERVICE  │ │SERVICE │ │SERVICE │ │SERVICE │ │ SERVICE  │
    └─────────┘ └────────┘ └────────┘ └────────┘ └──────────┘
        │           │           │           │           │
        ▼           ▼           ▼           ▼           ▼
    ┌─────────┐ ┌────────┐ ┌────────┐ ┌────────┐ ┌──────────┐
    │AUTH_DB  │ │MENU_DB │ │CART_DB │ │ORDER_DB│ │CATEGORY_ │
    │(User,   │ │(Items, │ │(Carts) │ │(Orders)│ │DB(Catego │
    │Business)│ │Ratings)│ │        │ │        │ │ries)     │
    └─────────┘ └────────┘ └────────┘ └────────┘ └──────────┘
        │           │           │           │           │
        └───────────┴───────────┴───────────┴───────────┘
                    │
                    ▼
        ┌──────────────────────────┐
        │ SERVICE-COMMUNICATION    │
        │ (Event Bus/Message Queue)│
        │ RabbitMQ / Redis / Kafka │
        └──────────────────────────┘
```

---

## 📦 Microservices Breakdown

### **1. AUTH SERVICE** (Independent)
```
┌─────────────────────────────────────────┐
│          AUTH SERVICE                   │
├─────────────────────────────────────────┤
│ Responsibility:                         │
│ • User registration & login             │
│ • JWT token generation                  │
│ • Business/Restaurant management        │
│ • Staff role assignment                 │
│                                         │
│ Database: AUTH_DB (PostgreSQL)          │
│ Tables:                                 │
│ ├─ user                                 │
│ ├─ business                             │
│ └─ business_user (M:N junction)         │
│                                         │
│ API Endpoints:                          │
│ POST   /auth/register                   │
│ POST   /auth/login                      │
│ POST   /auth/refresh-token              │
│ GET    /businesses/:id                  │
│ POST   /businesses/:id/staff            │
└─────────────────────────────────────────┘
```

### **2. MENU SERVICE**
```
┌─────────────────────────────────────────┐
│          MENU SERVICE                   │
├─────────────────────────────────────────┤
│ Responsibility:                         │
│ • Menu item CRUD operations             │
│ • Menu item ratings/reviews             │
│ • Add-on management                     │
│ • Search & filter menu items            │
│                                         │
│ Database: MENU_DB (PostgreSQL)          │
│ Tables:                                 │
│ ├─ menu_entity                          │
│ ├─ add_on_entity                        │
│ ├─ menu_rating_entity                   │
│ ├─ menu_add_on_junction (M:N)           │
│ └─ category (self-referencing)          │
│                                         │
│ API Endpoints:                          │
│ GET    /menus/:businessId               │
│ POST   /menus                           │
│ PUT    /menus/:id                       │
│ DELETE /menus/:id                       │
│ GET    /menus/:id/ratings               │
│ POST   /menus/:id/rate                  │
│ GET    /add-ons                         │
│ POST   /add-ons                         │
└─────────────────────────────────────────┘
```

### **3. CATEGORY SERVICE**
```
┌─────────────────────────────────────────┐
│        CATEGORY SERVICE                 │
├─────────────────────────────────────────┤
│ Responsibility:                         │
│ • Manage menu categories                │
│ • Nested category hierarchy             │
│ • Category activation/deactivation      │
│ • Category ordering                     │
│                                         │
│ Database: CATEGORY_DB (PostgreSQL)      │
│ Tables:                                 │
│ └─ category (self-referencing via      │
│    parent_id)                           │
│                                         │
│ API Endpoints:                          │
│ GET    /categories/:businessId          │
│ POST   /categories                      │
│ PUT    /categories/:id                  │
│ DELETE /categories/:id                  │
│ GET    /categories/:id/items            │
│ PATCH  /categories/:id/position         │
└─────────────────────────────────────────┘
```

### **4. CART SERVICE**
```
┌─────────────────────────────────────────┐
│          CART SERVICE                   │
├─────────────────────────────────────────┤
│ Responsibility:                         │
│ • Shopping cart management              │
│ • Add/remove items from cart            │
│ • Update quantities                     │
│ • Add customizations (add-ons)          │
│ • Cart checkout → Order conversion      │
│                                         │
│ Database: CART_DB (PostgreSQL)          │
│ Tables:                                 │
│ ├─ cart_entity                          │
│ ├─ cart_item_entity                     │
│ └─ cart_item_add_ons_entity             │
│                                         │
│ API Endpoints:                          │
│ GET    /carts/:userId                   │
│ POST   /carts/:userId/items             │
│ PUT    /carts/:userId/items/:itemId     │
│ DELETE /carts/:userId/items/:itemId     │
│ POST   /carts/:userId/checkout          │
│                                         │
│ Emits Events:                           │
│ → ORDER_CREATED (to Order Service)      │
└─────────────────────────────────────────┘
```

### **5. ORDER SERVICE**
```
┌─────────────────────────────────────────┐
│          ORDER SERVICE                  │
├─────────────────────────────────────────┤
│ Responsibility:                         │
│ • Create orders from carts              │
│ • Order item management                 │
│ • Order history tracking                │
│ • Calculate totals                      │
│ • Handle order cancellations            │
│                                         │
│ Database: ORDER_DB (PostgreSQL)         │
│ Tables:                                 │
│ ├─ order_entity                         │
│ ├─ order_item_entity                    │
│ └─ order_item_addon_entity              │
│                                         │
│ API Endpoints:                          │
│ GET    /orders/:userId                  │
│ GET    /orders/:businessId/all          │
│ GET    /orders/:id                      │
│ POST   /orders                          │
│ DELETE /orders/:id/cancel               │
│                                         │
│ Listens to Events:                      │
│ ← ORDER_CREATED (from Cart)             │
│ ← ORDER_STATUS_UPDATED                  │
└─────────────────────────────────────────┘
```

### **6. ORDER-STATUS SERVICE** (Sub-part of Order)
```
┌─────────────────────────────────────────┐
│      ORDER-STATUS SERVICE               │
├─────────────────────────────────────────┤
│ Responsibility:                         │
│ • Update order statuses                 │
│ • Track order progress                  │
│ • Notify customers of status changes    │
│ • Staff order management                │
│                                         │
│ Database: ORDER_DB (PostgreSQL)         │
│ Tables:                                 │
│ └─ order_status_entity                  │
│                                         │
│ Status Flow:                            │
│ PENDING → CONFIRMED → PREPARING         │
│    → READY → DELIVERED (or CANCELLED)   │
│                                         │
│ API Endpoints:                          │
│ GET    /orders/:id/status               │
│ PUT    /orders/:id/status               │
│ GET    /orders/:businessId/pending      │
│                                         │
│ Emits Events:                           │
│ → ORDER_CONFIRMED                       │
│ → ORDER_READY                           │
│ → ORDER_DELIVERED                       │
│ → ORDER_CANCELLED                       │
└─────────────────────────────────────────┘
```

### **7. MENU-RATING SERVICE** (Sub-part of Menu)
```
┌─────────────────────────────────────────┐
│     MENU-RATING SERVICE                 │
├─────────────────────────────────────────┤
│ Responsibility:                         │
│ • Customer ratings & reviews            │
│ • Calculate average ratings             │
│ • Filter by rating                      │
│ • Top-rated items                       │
│                                         │
│ Database: MENU_DB (PostgreSQL)          │
│ Tables:                                 │
│ └─ menu_rating_entity                   │
│                                         │
│ API Endpoints:                          │
│ GET    /menus/:id/ratings               │
│ GET    /menus/:id/average-rating        │
│ POST   /menus/:id/rate                  │
│ GET    /businesses/:id/top-rated        │
│ DELETE /ratings/:id                     │
└─────────────────────────────────────────┘
```

### **8. ADDONS SERVICE**
```
┌─────────────────────────────────────────┐
│         ADDONS SERVICE                  │
├─────────────────────────────────────────┤
│ Responsibility:                         │
│ • Manage toppings/extras                │
│ • Add-on CRUD operations                │
│ • Link add-ons to menu items            │
│ • Pricing management                    │
│                                         │
│ Database: MENU_DB (PostgreSQL)          │
│ Tables:                                 │
│ ├─ add_on_entity                        │
│ └─ menu_add_on_junction (M:N)           │
│                                         │
│ API Endpoints:                          │
│ GET    /add-ons                         │
│ POST   /add-ons                         │
│ PUT    /add-ons/:id                     │
│ DELETE /add-ons/:id                     │
│ POST   /menus/:menuId/add-ons/:addonId  │
│ DELETE /menus/:menuId/add-ons/:addonId  │
└─────────────────────────────────────────┘
```

### **9. SERVICE-COMMUNICATION MODULE**
```
┌─────────────────────────────────────────┐
│   SERVICE-COMMUNICATION (Event Bus)     │
├─────────────────────────────────────────┤
│ Responsibility:                         │
│ • Inter-service communication           │
│ • Event publishing & subscribing        │
│ • Asynchronous processing               │
│ • Service decoupling                    │
│                                         │
│ Technology: RabbitMQ / Redis / Kafka    │
│ (Message Queue)                         │
│                                         │
│ Event Examples:                         │
│ ├─ ORDER_CREATED (Cart → Order)         │
│ ├─ ORDER_CONFIRMED (Order → Notification)
│ ├─ ORDER_READY (Order → Delivery)       │
│ ├─ MENU_UPDATED (Menu → Cache)          │
│ ├─ USER_REGISTERED (Auth → Email)       │
│ └─ ORDER_CANCELLED (Order → Refund)     │
│                                         │
│ No Database (just message broker)       │
└─────────────────────────────────────────┘
```

---

## 🗄️ Database Architecture

### **Total Databases: 5 Independent Databases**

```
┌─────────────────────────────────────────────────────────────┐
│                   DATABASE TOPOLOGY                         │
├─────────────────────────────────────────────────────────────┤

1. AUTH_DB (PostgreSQL)
   └─ Tables: user, business, business_user
   └─ Owned by: AUTH SERVICE
   └─ Size: Small (user profiles, business info)

2. MENU_DB (PostgreSQL)
   └─ Tables: menu_entity, add_on_entity, menu_rating_entity, 
              menu_add_on_junction
   └─ Owned by: MENU SERVICE + ADDONS SERVICE + MENU-RATING SERVICE
   └─ Size: Medium (menu items, ratings, add-ons)

3. CATEGORY_DB (PostgreSQL)
   └─ Tables: category (self-referencing)
   └─ Owned by: CATEGORY SERVICE
   └─ Size: Small (categories only)

4. CART_DB (PostgreSQL)
   └─ Tables: cart_entity, cart_item_entity, cart_item_add_ons_entity
   └─ Owned by: CART SERVICE
   └─ Size: Medium (temporary, cleared after checkout)

5. ORDER_DB (PostgreSQL)
   └─ Tables: order_entity, order_item_entity, 
              order_item_addon_entity, order_status_entity
   └─ Owned by: ORDER SERVICE + ORDER-STATUS SERVICE
   └─ Size: Large (historical data, grows with time)

6. SERVICE-COMMUNICATION (Message Queue)
   └─ Technology: RabbitMQ / Redis / Kafka
   └─ No persistent database
   └─ Handles event publishing/subscribing
```

---

## 🔄 How Services Communicate

### **Synchronous (Direct API Calls)**
```
Client Request
    ↓
┌────────────────────────────────────────┐
│     Service A (Menu Service)           │
│     GET /menus/menu-123                │
└────────────────────────────────────────┘
    ↓
┌────────────────────────────────────────┐
│     Service B (Category Service)       │
│     Verify category exists             │
└────────────────────────────────────────┘
    ↓
Response back to Service A
    ↓
Response to Client
```

### **Asynchronous (Event-Driven via Message Queue)**
```
Cart Service
    │
    ├─ User adds items to cart
    │
    ├─ User clicks CHECKOUT
    │
    └─→ Publishes: ORDER_CREATED Event
          ↓
        ┌─────────────────────────────┐
        │ SERVICE-COMMUNICATION (MQ)  │
        │ Event Queue                 │
        └─────────────────────────────┘
          ↓
        ┌──────────────┬──────────────┬──────────────┐
        ↓              ↓              ↓              ↓
    Order Service  Notification   Delivery      Analytics
                   Service        Service       Service
    
    Updates DB    Sends SMS      Assigns      Logs data
    Creates Order Email         Driver
```

---

## 📊 Data Flow Example: Customer Places Order

```
1. CUSTOMER BROWSING
   ├─ AUTH SERVICE: Authenticate user
   ├─ CATEGORY SERVICE: Get categories
   └─ MENU SERVICE: Get menu items per category
   
2. CUSTOMER ADDS TO CART
   └─ CART SERVICE: Store items locally
   
3. CUSTOMER CHECKOUT
   ├─ CART SERVICE: Validate cart
   ├─ MENU SERVICE: Verify items still available
   ├─ CATEGORY SERVICE: Check categories still active
   └─ Publish Event: CART_CHECKOUT_INITIATED
   
4. ORDER CREATION
   ├─ ORDER SERVICE: Creates order from cart
   ├─ Publish Event: ORDER_CREATED
   └─ Response to client with order ID
   
5. ASYNC PROCESSING (via Message Queue)
   ├─ NOTIFICATION SERVICE: Sends "Order Confirmed" SMS/Email
   ├─ DELIVERY SERVICE: Assigns delivery partner
   ├─ KITCHEN SERVICE: Sends order to kitchen display
   └─ ANALYTICS SERVICE: Logs order metrics
   
6. ORDER STATUS UPDATES
   ├─ STAFF (via ORDER-STATUS SERVICE): Marks CONFIRMED
   ├─ KITCHEN: Marks PREPARING
   ├─ STAFF: Marks READY
   ├─ DRIVER: Marks DELIVERED
   └─ Each update publishes event to Message Queue
```

---

## 🎯 Advantages of This Architecture

| Advantage | Explanation |
|-----------|-------------|
| **Independent Scaling** | Scale MENU service separately if heavy traffic |
| **Technology Flexibility** | Each service can use different tech stack |
| **Fault Isolation** | If CART service fails, MENU still works |
| **Parallel Development** | Teams can work on different services |
| **Easy Maintenance** | Small, focused codebase per service |
| **Rapid Deployment** | Deploy individual services without full rebuild |
| **Better Performance** | Small databases, faster queries |
| **Easy to Test** | Each service has unit/integration tests |

---

## 📋 Service Dependencies Map

```
External Client (Browser/Mobile)
    ↓
API Gateway (Routes requests)
    ↓
┌─────────────────────────────────────────┐
│         AUTH SERVICE (Entry Point)      │
│ (Must authenticate first)               │
└──────┬──────────────────────────────────┘
       │
       ├──→ CATEGORY SERVICE ──→ CATEGORY_DB
       │
       ├──→ MENU SERVICE ───────→ MENU_DB
       │    ├─ needs CATEGORY
       │    ├─ needs ADDONS
       │    └─ needs RATINGS
       │
       ├──→ CART SERVICE ────────→ CART_DB
       │    ├─ needs MENU (verify items)
       │    └─ needs AUTH (user verify)
       │
       ├──→ ORDER SERVICE ──────→ ORDER_DB
       │    ├─ needs CART (create from cart)
       │    ├─ needs MENU (item validation)
       │    └─ needs AUTH (user verify)
       │
       └──→ SERVICE-COMMUNICATION (Message Queue)
            (All services publish/subscribe here)
```

---

## 🚀 Deployment Architecture

```
┌──────────────────────────────────────────────────────────┐
│                   DOCKER COMPOSE SETUP                   │
├──────────────────────────────────────────────────────────┤Services (Containerized):

├─ auth-service:3000

├─ menu-service:3001

├─ cart-service:3002

├─ order-service:3003

├─ category-service:3004

├─ addons-service:3005

└─ menu-rating-service:3006

Databases (Containerized):

├─ auth_db (PostgreSQL:5432)

├─ menu_db (PostgreSQL:5433)

├─ cart_db (PostgreSQL:5434)

├PostgreSQL:5435)

└─ category_db (PostgreSQL:5436)why the services and dbs btoh

Services (Containerized):
├─ auth-service:3000
├─ menu-service:3001
├─ cart-service:3002
├─ order-service:3003
├─ category-service:3004
├─ addons-service:3005
└─ menu-rating-service:3006

Databases (Containerized):
├─ auth_db (PostgreSQL:5432)
├─ menu_db (PostgreSQL:5433)
├─ cart_db (PostgreSQL:5434)
├─ order_db (PostgreSQL:5435)
└─ category_db (PostgreSQL:5436)

Message Queue:
├─ RabbitMQ:5672 (or Redis/Kafka)

Infrastructure:
├─ Nginx (Load Balancer)
├─ Redis (Caching)
└─ Elasticsearch (Logging)
```

---

## 📝 Summary

**Your System has:**
- ✅ 5 Independent Databases (one per major service)
- ✅ 8 Microservices (AUTH, MENU, CART, ORDER, CATEGORY, ADDONS, MENU-RATING, SERVICE-COMMUNICATION)
- ✅ Event-Driven Architecture (via Message Queue)
- ✅ Scalable & Fault-Tolerant Design
- ✅ Clear Service Boundaries & Responsibilities

**Database Strategy:**
- Each service owns its database (Database per Service Pattern)
- No cross-database transactions (loosely coupled)
- Event-driven for inter-service communication
- PostgreSQL for all databases (consistent choice)
