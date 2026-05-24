# Database Status Report

**Date:** May 20, 2026  
**Database:** kaha_restaurant_db  
**Status:** ✅ Created and Ready

---

## Database Configuration

**From .env file:**
```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=kaha_restaurant_db
DB_USER_NAME=postgres
DB_PASSWORD=postgres
```

---

## Database Status: ✅ EXISTS

**PostgreSQL Service:** ✅ Running  
**Database:** ✅ `kaha_restaurant_db` exists  
**Owner:** postgres  
**Encoding:** UTF8  
**Collation:** en_US.UTF-8

---

## Database Schema: ✅ CREATED

### Tables (15 total)

| # | Table Name | Purpose | Rows |
|---|------------|---------|------|
| 1 | `category` | Menu categories | 0 |
| 2 | `menu_entity` | Menu items | 0 |
| 3 | `menu_variant_entity` | Menu item variants (sizes, etc.) | 0 |
| 4 | `addon_group_entity` | Addon groups (e.g., "Toppings") | 0 |
| 5 | `add_on_entity` | Individual addons | 0 |
| 6 | `menu_entity_addon_groups_addon_group_entity` | Menu-AddonGroup relationship | 0 |
| 7 | `cart_entity` | Shopping carts | 0 |
| 8 | `cart_item_entity` | Items in cart | 0 |
| 9 | `cart_item_add_ons_entity` | Cart item addons | 0 |
| 10 | `order_entity` | Orders | 0 |
| 11 | `order_item_entity` | Items in order | 0 |
| 12 | `order_item_addon_entity` | Order item addons | 0 |
| 13 | `order_status_entity` | Order status history | 0 |
| 14 | `menu_rating_entity` | Menu item ratings | 0 |
| 15 | `migrations` | Database migrations | N/A |

---

## Data Status: ⚠️ EMPTY

**All tables are empty (0 rows)**

This is expected for a fresh installation. The database schema is created but no data has been seeded yet.

---

## Database Structure

### Core Entities

#### 1. Category System
```
category
├── id (UUID)
├── name
├── description
├── businessId
├── isActive
└── timestamps
```

#### 2. Menu System
```
menu_entity
├── id (UUID)
├── name
├── description
├── price
├── categoryId (FK)
├── businessId
├── isAvailable
└── timestamps

menu_variant_entity
├── id (UUID)
├── name
├── price
├── menuId (FK)
└── timestamps

addon_group_entity
├── id (UUID)
├── name
├── selectionType (SINGLE/MULTIPLE)
├── isRequired
└── timestamps

add_on_entity
├── id (UUID)
├── name
├── price
├── addonGroupId (FK)
└── timestamps
```

#### 3. Cart System
```
cart_entity
├── id (UUID)
├── userId
├── businessId
└── timestamps

cart_item_entity
├── id (UUID)
├── cartId (FK)
├── menuId (FK)
├── variantId (FK)
├── quantity
└── timestamps

cart_item_add_ons_entity
├── cartItemId (FK)
├── addonId (FK)
└── quantity
```

#### 4. Order System
```
order_entity
├── id (UUID)
├── userId
├── businessId
├── totalAmount
├── status
├── serviceType (DELIVERY/PICKUP/DINE_IN)
└── timestamps

order_item_entity
├── id (UUID)
├── orderId (FK)
├── menuId (FK)
├── variantId (FK)
├── quantity
├── price
└── timestamps

order_item_addon_entity
├── orderItemId (FK)
├── addonId (FK)
├── quantity
└── price

order_status_entity
├── id (UUID)
├── orderId (FK)
├── status
└── timestamp
```

#### 5. Rating System
```
menu_rating_entity
├── id (UUID)
├── menuId (FK)
├── userId
├── rating (1-5)
├── comment
└── timestamps
```

---

## Migrations Status

The database has been initialized with TypeORM migrations. All schema changes are tracked in the `migrations` table.

---

## Next Steps to Populate Database

### 1. Seed Categories
```sql
INSERT INTO category (id, name, description, "businessId", "isActive", "createdAt", "updatedAt")
VALUES 
  (gen_random_uuid(), 'Appetizers', 'Starters and small plates', 'business-uuid', true, NOW(), NOW()),
  (gen_random_uuid(), 'Main Course', 'Main dishes', 'business-uuid', true, NOW(), NOW()),
  (gen_random_uuid(), 'Desserts', 'Sweet treats', 'business-uuid', true, NOW(), NOW()),
  (gen_random_uuid(), 'Beverages', 'Drinks', 'business-uuid', true, NOW(), NOW());
```

### 2. Seed Menu Items
```sql
INSERT INTO menu_entity (id, name, description, price, "categoryId", "businessId", "isAvailable", "createdAt", "updatedAt")
VALUES 
  (gen_random_uuid(), 'Margherita Pizza', 'Classic pizza with tomato and mozzarella', 12.99, 'category-uuid', 'business-uuid', true, NOW(), NOW()),
  (gen_random_uuid(), 'Caesar Salad', 'Fresh romaine with caesar dressing', 8.99, 'category-uuid', 'business-uuid', true, NOW(), NOW());
```

### 3. Or Use API Endpoints

The application provides REST API endpoints to create data:
- `POST /api/v1/categories` - Create categories
- `POST /api/v1/menu` - Create menu items
- `POST /api/v1/addon-groups` - Create addon groups
- `POST /api/v1/addons` - Create addons

---

## Database Health Check

### Connection Test
```bash
PGPASSWORD=postgres psql -U postgres -h localhost -d kaha_restaurant_db -c "SELECT version();"
```

### Table Count
```bash
PGPASSWORD=postgres psql -U postgres -h localhost -d kaha_restaurant_db -c "\dt"
```

### Row Counts
```bash
PGPASSWORD=postgres psql -U postgres -h localhost -d kaha_restaurant_db -c "
SELECT 
  schemaname,
  tablename,
  n_live_tup as row_count
FROM pg_stat_user_tables
ORDER BY tablename;
"
```

---

## Database Backup

### Create Backup
```bash
pg_dump -U postgres -h localhost kaha_restaurant_db > backup_$(date +%Y%m%d).sql
```

### Restore Backup
```bash
psql -U postgres -h localhost kaha_restaurant_db < backup_20260520.sql
```

---

## Summary

✅ **Database Created:** kaha_restaurant_db exists  
✅ **Schema Initialized:** All 15 tables created  
✅ **Migrations Applied:** Database structure is up to date  
⚠️ **Data Status:** Empty (ready for seeding)  
✅ **Connection:** Working (localhost:5432)  
✅ **Ready for Use:** Application can connect and use database

**Status:** Database is ready for the application to start creating data through API endpoints or manual seeding.

