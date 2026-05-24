# Complete Database Design - Restaurant E-Commerce System

## 🏗️ Database Architecture Overview

This system uses a **microservices architecture** with **5 separate databases**:

1. **AUTH_DB** - User authentication & business management (Kaha Main v3)
2. **MENU_DB** - Menu items, add-ons, and ratings
3. **CATEGORY_DB** - Menu categories (hierarchical)
4. **CART_DB** - Shopping carts
5. **ORDER_DB** - Orders and order history

---

## 📊 Database 1: AUTH_DB (Kaha Main v3)

**Purpose**: Central authentication, user management, and business management

**Location**: `kahamain-v3/kaha-main-api-v3`

### Tables:

#### 1. `users` table
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  full_name VARCHAR(200),
  contact_number VARCHAR(20),
  avatar TEXT,
  role VARCHAR(50) DEFAULT 'CUSTOMER', -- CUSTOMER, STAFF, ADMIN
  is_active BOOLEAN DEFAULT true,
  is_verified BOOLEAN DEFAULT false,
  last_login TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  deleted_at TIMESTAMP
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_is_active ON users(is_active);
```


#### 2. `business` table
```sql
CREATE TABLE business (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  phone VARCHAR(20),
  address TEXT,
  city VARCHAR(100),
  state VARCHAR(100),
  zip_code VARCHAR(20),
  country VARCHAR(100),
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  avatar TEXT,
  cover_image TEXT,
  description TEXT,
  category_id UUID, -- References business_category
  is_active BOOLEAN DEFAULT true,
  subscription_type VARCHAR(50), -- FREE, BASIC, PREMIUM
  subscription_expires_at TIMESTAMP,
  opening_time TIME,
  closing_time TIME,
  working_days JSONB, -- {"monday": true, "tuesday": true, ...}
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  deleted_at TIMESTAMP
);

CREATE INDEX idx_business_name ON business(name);
CREATE INDEX idx_business_city ON business(city);
CREATE INDEX idx_business_is_active ON business(is_active);
CREATE INDEX idx_business_category ON business(category_id);
```

#### 3. `business_user` table (Junction Table)
```sql
CREATE TABLE business_user (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID NOT NULL REFERENCES business(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role VARCHAR(50) NOT NULL, -- STAFF, MANAGER, ADMIN
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(business_id, user_id)
);

CREATE INDEX idx_business_user_business ON business_user(business_id);
CREATE INDEX idx_business_user_user ON business_user(user_id);
CREATE INDEX idx_business_user_role ON business_user(role);
```

#### 4. `business_category` table
```sql
CREATE TABLE business_category (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) UNIQUE NOT NULL,
  description TEXT,
  icon TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```


---

## 📊 Database 2: MENU_DB

**Purpose**: Menu items, add-ons, and ratings

**Location**: `restaurant-ecommerce` service

### Tables:

#### 1. `menu_entity` table
```sql
CREATE TABLE menu_entity (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  images TEXT[], -- Array of image URLs
  details JSONB, -- {"spice_level": "medium", "calories": "500"}
  is_bar_item BOOLEAN DEFAULT false,
  is_available BOOLEAN DEFAULT true,
  services VARCHAR(50)[] DEFAULT ARRAY['DINE_IN'], -- DINE_IN, TAKEAWAY, DELIVERY
  price NUMERIC(12, 2) NOT NULL,
  discounted_price NUMERIC(12, 2),
  business_id UUID NOT NULL, -- FK to AUTH_DB.business.id
  is_signature BOOLEAN DEFAULT false,
  allow_add_ons BOOLEAN DEFAULT false,
  category_id UUID REFERENCES category_entity(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  deleted_at TIMESTAMP
);

CREATE INDEX idx_menu_business ON menu_entity(business_id);
CREATE INDEX idx_menu_category ON menu_entity(category_id);
CREATE INDEX idx_menu_is_available ON menu_entity(is_available);
CREATE INDEX idx_menu_price ON menu_entity(price);
```

#### 2. `add_on_entity` table
```sql
CREATE TABLE add_on_entity (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  price NUMERIC(12, 2) NOT NULL,
  cover_img TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  deleted_at TIMESTAMP
);

CREATE INDEX idx_addon_name ON add_on_entity(name);
```

#### 3. `menu_add_on_junction` table (Many-to-Many)
```sql
CREATE TABLE menu_add_on_junction (
  menu_id UUID NOT NULL REFERENCES menu_entity(id) ON DELETE CASCADE,
  add_on_id UUID NOT NULL REFERENCES add_on_entity(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW(),
  
  PRIMARY KEY (menu_id, add_on_id)
);

CREATE INDEX idx_menu_addon_menu ON menu_add_on_junction(menu_id);
CREATE INDEX idx_menu_addon_addon ON menu_add_on_junction(add_on_id);
```

#### 4. `menu_rating_entity` table
```sql
CREATE TABLE menu_rating_entity (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  rating FLOAT NOT NULL CHECK (rating >= 0 AND rating <= 5),
  comments TEXT,
  rated_by UUID NOT NULL, -- FK to AUTH_DB.users.id
  business_id UUID NOT NULL, -- FK to AUTH_DB.business.id
  menu_id UUID NOT NULL REFERENCES menu_entity(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  deleted_at TIMESTAMP
);

CREATE INDEX idx_rating_menu ON menu_rating_entity(menu_id);
CREATE INDEX idx_rating_user ON menu_rating_entity(rated_by);
CREATE INDEX idx_rating_business ON menu_rating_entity(business_id);
CREATE INDEX idx_rating_value ON menu_rating_entity(rating);
```


---

## 📊 Database 3: CATEGORY_DB

**Purpose**: Hierarchical menu categories

**Location**: `restaurant-ecommerce` service

### Tables:

#### 1. `category_entity` table (Self-Referencing)
```sql
CREATE TABLE category_entity (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) UNIQUE NOT NULL,
  description VARCHAR(1024),
  icon TEXT,
  is_active BOOLEAN DEFAULT true,
  position INTEGER, -- For ordering categories
  business_id UUID NOT NULL, -- FK to AUTH_DB.business.id
  parent_id UUID REFERENCES category_entity(id), -- Self-reference for hierarchy
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  deleted_at TIMESTAMP
);

CREATE INDEX idx_category_name ON category_entity(name);
CREATE INDEX idx_category_business ON category_entity(business_id);
CREATE INDEX idx_category_parent ON category_entity(parent_id);
CREATE INDEX idx_category_is_active ON category_entity(is_active);
CREATE INDEX idx_category_position ON category_entity(position);
```

**Category Hierarchy Example:**
```
Food (parent_id: NULL)
├── Appetizers (parent_id: Food.id)
│   ├── Salads (parent_id: Appetizers.id)
│   └── Soups (parent_id: Appetizers.id)
├── Main Course (parent_id: Food.id)
└── Desserts (parent_id: Food.id)

Beverages (parent_id: NULL)
├── Hot Drinks (parent_id: Beverages.id)
└── Cold Drinks (parent_id: Beverages.id)
```


---

## 📊 Database 4: CART_DB

**Purpose**: Shopping cart management

**Location**: `restaurant-ecommerce` service

### Tables:

#### 1. `cart_entity` table
```sql
CREATE TABLE cart_entity (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL, -- FK to AUTH_DB.users.id
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  deleted_at TIMESTAMP
);

CREATE INDEX idx_cart_user ON cart_entity(user_id);
CREATE UNIQUE INDEX idx_cart_user_unique ON cart_entity(user_id) WHERE deleted_at IS NULL;
```

#### 2. `cart_item_entity` table
```sql
CREATE TABLE cart_item_entity (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  cart_id UUID NOT NULL REFERENCES cart_entity(id) ON DELETE CASCADE,
  menu_id UUID NOT NULL, -- FK to MENU_DB.menu_entity.id
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  deleted_at TIMESTAMP
);

CREATE INDEX idx_cart_item_cart ON cart_item_entity(cart_id);
CREATE INDEX idx_cart_item_menu ON cart_item_entity(menu_id);
```

#### 3. `cart_item_add_ons_entity` table
```sql
CREATE TABLE cart_item_add_ons_entity (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  cart_item_id UUID NOT NULL REFERENCES cart_item_entity(id) ON DELETE CASCADE,
  add_on_id UUID NOT NULL, -- FK to MENU_DB.add_on_entity.id
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  deleted_at TIMESTAMP
);

CREATE INDEX idx_cart_addon_item ON cart_item_add_ons_entity(cart_item_id);
CREATE INDEX idx_cart_addon_addon ON cart_item_add_ons_entity(add_on_id);
```


---

## 📊 Database 5: ORDER_DB

**Purpose**: Order management and history

**Location**: `restaurant-ecommerce` service

### Tables:

#### 1. `order_entity` table
```sql
CREATE TABLE order_entity (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL, -- FK to AUTH_DB.users.id
  business_id UUID NOT NULL, -- FK to AUTH_DB.business.id
  total_amount NUMERIC(12, 2) DEFAULT 0,
  remarks TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  deleted_at TIMESTAMP
);

CREATE INDEX idx_order_user ON order_entity(user_id);
CREATE INDEX idx_order_business ON order_entity(business_id);
CREATE INDEX idx_order_created ON order_entity(created_at);
CREATE INDEX idx_order_total ON order_entity(total_amount);
```

#### 2. `order_item_entity` table
```sql
CREATE TABLE order_item_entity (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  price NUMERIC(12, 2) NOT NULL, -- Snapshot of price at order time
  order_id UUID NOT NULL REFERENCES order_entity(id) ON DELETE CASCADE,
  menu_id UUID NOT NULL, -- FK to MENU_DB.menu_entity.id
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  deleted_at TIMESTAMP
);

CREATE INDEX idx_order_item_order ON order_item_entity(order_id);
CREATE INDEX idx_order_item_menu ON order_item_entity(menu_id);
```

#### 3. `order_item_addon_entity` table
```sql
CREATE TABLE order_item_addon_entity (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  price NUMERIC(12, 2) NOT NULL, -- Snapshot of addon price at order time
  order_item_id UUID NOT NULL REFERENCES order_item_entity(id) ON DELETE CASCADE,
  add_on_id UUID NOT NULL, -- FK to MENU_DB.add_on_entity.id
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  deleted_at TIMESTAMP
);

CREATE INDEX idx_order_addon_item ON order_item_addon_entity(order_item_id);
CREATE INDEX idx_order_addon_addon ON order_item_addon_entity(add_on_id);
```

#### 4. `order_status_entity` table
```sql
CREATE TABLE order_status_entity (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES order_entity(id) ON DELETE CASCADE,
  status VARCHAR(50) NOT NULL, -- PENDING, CONFIRMED, PREPARING, READY, DELIVERED, CANCELLED
  updated_by UUID NOT NULL, -- FK to AUTH_DB.users.id (staff who updated)
  remarks TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  deleted_at TIMESTAMP
);

CREATE INDEX idx_order_status_order ON order_status_entity(order_id);
CREATE INDEX idx_order_status_status ON order_status_entity(status);
CREATE INDEX idx_order_status_updated_by ON order_status_entity(updated_by);
CREATE INDEX idx_order_status_created ON order_status_entity(created_at);
```

**Order Status Flow:**
```
PENDING → CONFIRMED → PREPARING → READY → DELIVERED
                                        ↓
                                   CANCELLED (can happen at any stage)
```


---

## 🔗 Foreign Key Relationships Across Databases

### Cross-Database References (Logical, not enforced by DB)

```
AUTH_DB.users.id
  ↓ Referenced by:
  ├─ CART_DB.cart_entity.user_id
  ├─ ORDER_DB.order_entity.user_id
  ├─ ORDER_DB.order_status_entity.updated_by
  └─ MENU_DB.menu_rating_entity.rated_by

AUTH_DB.business.id
  ↓ Referenced by:
  ├─ MENU_DB.menu_entity.business_id
  ├─ CATEGORY_DB.category_entity.business_id
  ├─ ORDER_DB.order_entity.business_id
  └─ MENU_DB.menu_rating_entity.business_id

MENU_DB.menu_entity.id
  ↓ Referenced by:
  ├─ CART_DB.cart_item_entity.menu_id
  ├─ ORDER_DB.order_item_entity.menu_id
  └─ MENU_DB.menu_rating_entity.menu_id

MENU_DB.add_on_entity.id
  ↓ Referenced by:
  ├─ CART_DB.cart_item_add_ons_entity.add_on_id
  └─ ORDER_DB.order_item_addon_entity.add_on_id

CATEGORY_DB.category_entity.id
  ↓ Referenced by:
  └─ MENU_DB.menu_entity.category_id
```

**Note**: These are **logical foreign keys** only. Since tables are in different databases, referential integrity is maintained at the application level, not the database level.


---

## 📐 Entity Relationship Diagram (ERD)

### Complete System ERD

```
┌─────────────────────────────────────────────────────────────────────┐
│                          AUTH_DB                                    │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌──────────────┐         ┌──────────────────┐                     │
│  │    users     │         │    business      │                     │
│  ├──────────────┤         ├──────────────────┤                     │
│  │ id (PK)      │         │ id (PK)          │                     │
│  │ email        │         │ name             │                     │
│  │ password     │         │ email            │                     │
│  │ first_name   │         │ phone            │                     │
│  │ last_name    │         │ address          │                     │
│  │ role         │         │ city             │                     │
│  │ is_active    │         │ category_id (FK) │                     │
│  └──────────────┘         │ is_active        │                     │
│         │                 └──────────────────┘                     │
│         │                          │                               │
│         │                          │                               │
│         └──────────┬───────────────┘                               │
│                    │                                                │
│         ┌──────────▼──────────┐                                    │
│         │   business_user     │                                    │
│         ├─────────────────────┤                                    │
│         │ id (PK)             │                                    │
│         │ business_id (FK)    │                                    │
│         │ user_id (FK)        │                                    │
│         │ role                │                                    │
│         └─────────────────────┘                                    │
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘
         │                          │
         │ (HTTP API Calls)         │
         ▼                          ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    RESTAURANT E-COMMERCE SERVICES                    │
└─────────────────────────────────────────────────────────────────────┘

┌──────────────────────┐  ┌──────────────────────┐  ┌─────────────────┐
│    CATEGORY_DB       │  │      MENU_DB         │  │    CART_DB      │
├──────────────────────┤  ├──────────────────────┤  ├─────────────────┤
│                      │  │                      │  │                 │
│ ┌──────────────────┐ │  │ ┌──────────────────┐ │  │ ┌─────────────┐ │
│ │ category_entity  │ │  │ │  menu_entity     │ │  │ │ cart_entity │ │
│ ├──────────────────┤ │  │ ├──────────────────┤ │  │ ├─────────────┤ │
│ │ id (PK)          │ │  │ │ id (PK)          │ │  │ │ id (PK)     │ │
│ │ name             │ │  │ │ name             │ │  │ │ user_id     │ │
│ │ business_id      │◄┼──┼─│ category_id (FK) │ │  │ └─────────────┘ │
│ │ parent_id (FK)   │ │  │ │ business_id      │ │  │       │         │
│ │ is_active        │ │  │ │ price            │ │  │       │         │
│ └──────────────────┘ │  │ │ is_available     │ │  │ ┌─────▼───────┐ │
│                      │  │ └──────────────────┘ │  │ │cart_item    │ │
└──────────────────────┘  │          │           │  │ │_entity      │ │
                          │          │           │  │ ├─────────────┤ │
                          │ ┌────────▼─────────┐ │  │ │ id (PK)     │ │
                          │ │ add_on_entity    │ │  │ │ cart_id(FK) │ │
                          │ ├──────────────────┤ │  │ │ menu_id     │ │
                          │ │ id (PK)          │ │  │ │ quantity    │ │
                          │ │ name             │ │  │ └─────────────┘ │
                          │ │ price            │ │  │       │         │
                          │ └──────────────────┘ │  │ ┌─────▼───────┐ │
                          │          │           │  │ │cart_item    │ │
                          │ ┌────────▼─────────┐ │  │ │_add_ons     │ │
                          │ │menu_add_on       │ │  │ │_entity      │ │
                          │ │_junction         │ │  │ ├─────────────┤ │
                          │ ├──────────────────┤ │  │ │ id (PK)     │ │
                          │ │ menu_id (FK)     │ │  │ │ cart_item   │ │
                          │ │ add_on_id (FK)   │ │  │ │ _id (FK)    │ │
                          │ └──────────────────┘ │  │ │ add_on_id   │ │
                          │                      │  │ │ quantity    │ │
                          │ ┌──────────────────┐ │  │ └─────────────┘ │
                          │ │menu_rating       │ │  │                 │
                          │ │_entity           │ │  └─────────────────┘
                          │ ├──────────────────┤ │
                          │ │ id (PK)          │ │
                          │ │ menu_id (FK)     │ │
                          │ │ rated_by         │ │
                          │ │ business_id      │ │
                          │ │ rating           │ │
                          │ │ comments         │ │
                          │ └──────────────────┘ │
                          │                      │
                          └──────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│                          ORDER_DB                                    │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌──────────────────┐                                               │
│  │  order_entity    │                                               │
│  ├──────────────────┤                                               │
│  │ id (PK)          │                                               │
│  │ user_id          │                                               │
│  │ business_id      │                                               │
│  │ total_amount     │                                               │
│  │ remarks          │                                               │
│  └──────────────────┘                                               │
│         │                                                            │
│         ├──────────────┬──────────────┐                             │
│         │              │              │                             │
│  ┌──────▼──────────┐   │   ┌──────────▼──────────┐                 │
│  │ order_item      │   │   │ order_status        │                 │
│  │ _entity         │   │   │ _entity             │                 │
│  ├─────────────────┤   │   ├─────────────────────┤                 │
│  │ id (PK)         │   │   │ id (PK)             │                 │
│  │ order_id (FK)   │   │   │ order_id (FK)       │                 │
│  │ menu_id         │   │   │ status              │                 │
│  │ quantity        │   │   │ updated_by          │                 │
│  │ price           │   │   │ remarks             │                 │
│  └─────────────────┘   │   │ created_at          │                 │
│         │              │   └─────────────────────┘                 │
│         │              │                                            │
│  ┌──────▼──────────┐   │                                            │
│  │ order_item      │   │                                            │
│  │ _addon_entity   │   │                                            │
│  ├─────────────────┤   │                                            │
│  │ id (PK)         │   │                                            │
│  │ order_item_id   │   │                                            │
│  │ add_on_id       │   │                                            │
│  │ quantity        │   │                                            │
│  │ price           │   │                                            │
│  └─────────────────┘   │                                            │
│                        │                                            │
└────────────────────────┴────────────────────────────────────────────┘
```


---

## 🔄 Data Flow Examples

### Example 1: Customer Places an Order

```sql
-- Step 1: Customer browses menu (MENU_DB)
SELECT m.*, c.name as category_name
FROM menu_entity m
JOIN category_entity c ON m.category_id = c.id
WHERE m.business_id = 'pizza-palace-uuid'
  AND m.is_available = true;

-- Step 2: Customer adds items to cart (CART_DB)
INSERT INTO cart_entity (user_id) 
VALUES ('customer-uuid')
RETURNING id;

INSERT INTO cart_item_entity (cart_id, menu_id, quantity)
VALUES ('cart-uuid', 'pizza-margherita-uuid', 2);

INSERT INTO cart_item_add_ons_entity (cart_item_id, add_on_id, quantity)
VALUES ('cart-item-uuid', 'extra-cheese-uuid', 1);

-- Step 3: Customer checks out (ORDER_DB)
INSERT INTO order_entity (user_id, business_id, total_amount, remarks)
VALUES ('customer-uuid', 'pizza-palace-uuid', 25.99, 'Extra napkins please')
RETURNING id;

INSERT INTO order_item_entity (order_id, menu_id, quantity, price)
VALUES ('order-uuid', 'pizza-margherita-uuid', 2, 10.99);

INSERT INTO order_item_addon_entity (order_item_id, add_on_id, quantity, price)
VALUES ('order-item-uuid', 'extra-cheese-uuid', 1, 2.00);

INSERT INTO order_status_entity (order_id, status, updated_by)
VALUES ('order-uuid', 'PENDING', 'customer-uuid');

-- Step 4: Clear cart after order (CART_DB)
DELETE FROM cart_entity WHERE user_id = 'customer-uuid';
```

### Example 2: Staff Updates Order Status

```sql
-- Staff marks order as CONFIRMED (ORDER_DB)
INSERT INTO order_status_entity (order_id, status, updated_by, remarks)
VALUES ('order-uuid', 'CONFIRMED', 'staff-uuid', 'Order received by kitchen');

-- Later: Staff marks as PREPARING
INSERT INTO order_status_entity (order_id, status, updated_by)
VALUES ('order-uuid', 'PREPARING', 'staff-uuid');

-- Later: Staff marks as READY
INSERT INTO order_status_entity (order_id, status, updated_by)
VALUES ('order-uuid', 'READY', 'staff-uuid');

-- Finally: Delivery marks as DELIVERED
INSERT INTO order_status_entity (order_id, status, updated_by)
VALUES ('order-uuid', 'DELIVERED', 'delivery-staff-uuid');
```

### Example 3: Get Order History with Latest Status

```sql
-- Get user's orders with latest status (ORDER_DB)
SELECT 
  o.id,
  o.total_amount,
  o.created_at,
  (
    SELECT status 
    FROM order_status_entity 
    WHERE order_id = o.id 
    ORDER BY created_at DESC 
    LIMIT 1
  ) as current_status
FROM order_entity o
WHERE o.user_id = 'customer-uuid'
ORDER BY o.created_at DESC;
```


---

## 🎯 Database Design Principles

### 1. **Database per Service Pattern**
- Each microservice owns its database
- No direct database access between services
- Communication via HTTP APIs or message queues

### 2. **Eventual Consistency**
- Cross-database operations are not atomic
- Use saga pattern for distributed transactions
- Handle failures gracefully

### 3. **Data Denormalization**
- Store snapshots of prices in orders (not references)
- Prevents historical data corruption if menu prices change
- Example: `order_item_entity.price` stores price at order time

### 4. **Soft Deletes**
- All tables have `deleted_at` timestamp
- Never hard delete data (for audit trail)
- Use `WHERE deleted_at IS NULL` in queries

### 5. **Indexing Strategy**
- Index all foreign keys
- Index frequently queried columns (business_id, user_id)
- Index date columns for time-based queries
- Composite indexes for common query patterns

### 6. **Multi-Tenancy via business_id**
- Every business-specific table has `business_id`
- Isolates data per restaurant
- Enables SaaS model


---

## 📊 Database Size Estimates

### Expected Data Volume (per business)

| Table | Estimated Rows | Growth Rate | Notes |
|-------|---------------|-------------|-------|
| **AUTH_DB** |
| users | 10,000 - 100,000 | Medium | Customers + staff |
| business | 100 - 10,000 | Low | One per restaurant |
| business_user | 500 - 5,000 | Low | Staff assignments |
| **MENU_DB** |
| menu_entity | 50 - 500 | Low | Menu items per business |
| add_on_entity | 20 - 100 | Low | Toppings/extras |
| menu_rating_entity | 1,000 - 100,000 | High | Customer reviews |
| **CATEGORY_DB** |
| category_entity | 10 - 50 | Low | Categories per business |
| **CART_DB** |
| cart_entity | 100 - 10,000 | Medium | Active carts (cleared after order) |
| cart_item_entity | 500 - 50,000 | High | Temporary data |
| **ORDER_DB** |
| order_entity | 10,000 - 1,000,000 | Very High | Historical orders |
| order_item_entity | 50,000 - 5,000,000 | Very High | Order details |
| order_status_entity | 50,000 - 5,000,000 | Very High | Status history |

### Storage Recommendations

- **AUTH_DB**: 10-50 GB (grows slowly)
- **MENU_DB**: 5-20 GB (moderate growth)
- **CATEGORY_DB**: 1-5 GB (minimal growth)
- **CART_DB**: 2-10 GB (temporary, can be purged)
- **ORDER_DB**: 50-500 GB (grows continuously, needs archiving)


---

## 🔐 Security Considerations

### 1. **Row-Level Security (RLS)**
```sql
-- Example: Users can only see their own carts
CREATE POLICY cart_user_policy ON cart_entity
  FOR ALL
  USING (user_id = current_setting('app.current_user_id')::uuid);

-- Example: Staff can only see orders for their business
CREATE POLICY order_business_policy ON order_entity
  FOR ALL
  USING (business_id = current_setting('app.current_business_id')::uuid);
```

### 2. **Sensitive Data Encryption**
- Encrypt passwords using bcrypt (AUTH_DB)
- Hash payment information (if stored)
- Use SSL/TLS for database connections

### 3. **Access Control**
- Database users per service (principle of least privilege)
- Read-only replicas for analytics
- Separate credentials for each environment

### 4. **Audit Logging**
- Track all order status changes
- Log user authentication attempts
- Monitor failed transactions


---

## 🚀 Migration Strategy

### Initial Setup

```bash
# 1. Create databases
createdb auth_db
createdb menu_db
createdb category_db
createdb cart_db
createdb order_db

# 2. Run migrations for each database
npm run migration:run -- --database=auth
npm run migration:run -- --database=menu
npm run migration:run -- --database=category
npm run migration:run -- --database=cart
npm run migration:run -- --database=order

# 3. Seed initial data
npm run seed:auth      # Create admin user, sample businesses
npm run seed:menu      # Create sample menu items
npm run seed:category  # Create default categories
```

### Migration Files Structure

```
src/migrations/
├── auth/
│   ├── 001_create_users_table.ts
│   ├── 002_create_business_table.ts
│   └── 003_create_business_user_table.ts
├── menu/
│   ├── 001_create_menu_entity.ts
│   ├── 002_create_addon_entity.ts
│   └── 003_create_menu_rating_entity.ts
├── category/
│   └── 001_create_category_entity.ts
├── cart/
│   ├── 001_create_cart_entity.ts
│   └── 002_create_cart_item_entity.ts
└── order/
    ├── 001_create_order_entity.ts
    ├── 002_create_order_item_entity.ts
    └── 003_create_order_status_entity.ts
```


---

## 📈 Performance Optimization

### 1. **Query Optimization**

```sql
-- Bad: N+1 query problem
SELECT * FROM order_entity WHERE user_id = 'user-uuid';
-- Then for each order:
SELECT * FROM order_item_entity WHERE order_id = 'order-uuid';

-- Good: Use JOIN
SELECT o.*, oi.*
FROM order_entity o
LEFT JOIN order_item_entity oi ON o.id = oi.order_id
WHERE o.user_id = 'user-uuid';
```

### 2. **Caching Strategy**

```typescript
// Cache frequently accessed data
- Menu items (Redis, TTL: 1 hour)
- Categories (Redis, TTL: 24 hours)
- Business info (Redis, TTL: 1 hour)
- User profiles (Redis, TTL: 30 minutes)

// Invalidate cache on updates
await redis.del(`menu:${businessId}`);
await redis.del(`category:${businessId}`);
```

### 3. **Database Connection Pooling**

```typescript
// TypeORM configuration
{
  type: 'postgres',
  host: 'localhost',
  port: 5432,
  database: 'menu_db',
  poolSize: 20,           // Max connections
  maxQueryExecutionTime: 1000, // Log slow queries
  logging: ['error', 'warn'],
}
```

### 4. **Pagination**

```sql
-- Always paginate large result sets
SELECT * FROM order_entity
WHERE business_id = 'business-uuid'
ORDER BY created_at DESC
LIMIT 20 OFFSET 0;
```

### 5. **Materialized Views for Analytics**

```sql
-- Create materialized view for business analytics
CREATE MATERIALIZED VIEW business_order_stats AS
SELECT 
  business_id,
  COUNT(*) as total_orders,
  SUM(total_amount) as total_revenue,
  AVG(total_amount) as avg_order_value,
  DATE(created_at) as order_date
FROM order_entity
GROUP BY business_id, DATE(created_at);

-- Refresh periodically
REFRESH MATERIALIZED VIEW business_order_stats;
```


---

## 🔧 Backup and Recovery

### Backup Strategy

```bash
# Daily full backups
pg_dump -h localhost -U postgres auth_db > auth_db_backup_$(date +%Y%m%d).sql
pg_dump -h localhost -U postgres menu_db > menu_db_backup_$(date +%Y%m%d).sql
pg_dump -h localhost -U postgres category_db > category_db_backup_$(date +%Y%m%d).sql
pg_dump -h localhost -U postgres cart_db > cart_db_backup_$(date +%Y%m%d).sql
pg_dump -h localhost -U postgres order_db > order_db_backup_$(date +%Y%m%d).sql

# Incremental backups using WAL archiving
archive_mode = on
archive_command = 'cp %p /backup/archive/%f'
```

### Recovery Procedures

```bash
# Restore from backup
psql -h localhost -U postgres -d auth_db < auth_db_backup_20260513.sql

# Point-in-time recovery
pg_restore -h localhost -U postgres -d order_db order_db_backup.dump
```

### Retention Policy

- **Daily backups**: Keep for 30 days
- **Weekly backups**: Keep for 3 months
- **Monthly backups**: Keep for 1 year
- **Critical data** (orders, payments): Keep indefinitely


---

## 📝 Summary

### Database Overview

| Database | Tables | Purpose | Service Owner |
|----------|--------|---------|---------------|
| **AUTH_DB** | 4 | User authentication, business management | Kaha Main v3 |
| **MENU_DB** | 4 | Menu items, add-ons, ratings | Restaurant E-commerce |
| **CATEGORY_DB** | 1 | Menu categories (hierarchical) | Restaurant E-commerce |
| **CART_DB** | 3 | Shopping carts | Restaurant E-commerce |
| **ORDER_DB** | 4 | Orders and order history | Restaurant E-commerce |

### Key Design Decisions

✅ **Microservices Architecture**: Each service owns its database
✅ **Logical Foreign Keys**: Cross-database references via application logic
✅ **Multi-Tenancy**: Isolated data per business via `business_id`
✅ **Soft Deletes**: Audit trail with `deleted_at` timestamps
✅ **Price Snapshots**: Store prices at order time (not references)
✅ **Event-Driven**: Services communicate via HTTP APIs
✅ **Scalability**: Independent scaling per service
✅ **Data Integrity**: Application-level validation and constraints

### Total Tables: 16

- AUTH_DB: 4 tables
- MENU_DB: 4 tables
- CATEGORY_DB: 1 table
- CART_DB: 3 tables
- ORDER_DB: 4 tables

---

## 🎓 Next Steps

1. **Review and validate** this design with your team
2. **Create TypeORM entities** matching this schema
3. **Write migration files** for each database
4. **Set up database connections** in each service
5. **Implement service communication** layer
6. **Add caching** for frequently accessed data
7. **Set up monitoring** and alerting
8. **Plan backup strategy** and test recovery
9. **Document API contracts** between services
10. **Load test** with realistic data volumes

---

**Document Version**: 1.0  
**Last Updated**: May 13, 2026  
**Author**: Database Design Team
