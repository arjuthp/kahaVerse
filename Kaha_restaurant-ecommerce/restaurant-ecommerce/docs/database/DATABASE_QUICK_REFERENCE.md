# Database Quick Reference Guide

## 🗄️ Database Summary

| Database | Tables | Primary Purpose | Service |
|----------|--------|-----------------|---------|
| **AUTH_DB** | 4 | Users, businesses, staff roles | Kaha Main v3 |
| **MENU_DB** | 4 | Menu items, add-ons, ratings | Restaurant E-commerce |
| **CATEGORY_DB** | 1 | Menu categories | Restaurant E-commerce |
| **CART_DB** | 3 | Shopping carts | Restaurant E-commerce |
| **ORDER_DB** | 4 | Orders, order history | Restaurant E-commerce |

---

## 📋 Table Cheat Sheet

### AUTH_DB (Kaha Main v3)
```
users                    - Customer & staff accounts
business                 - Restaurant/business profiles
business_user            - Staff-to-business assignments (M:N)
business_category        - Business types (Pizza, Burger, etc.)
```

### MENU_DB
```
menu_entity              - Menu items (food/drinks)
add_on_entity            - Toppings/extras
menu_add_on_junction     - Menu-to-addon mapping (M:N)
menu_rating_entity       - Customer reviews/ratings
```

### CATEGORY_DB
```
category_entity          - Menu categories (hierarchical tree)
```

### CART_DB
```
cart_entity              - User shopping carts
cart_item_entity         - Items in cart
cart_item_add_ons_entity - Add-ons for cart items
```

### ORDER_DB
```
order_entity             - Customer orders
order_item_entity        - Items in order
order_item_addon_entity  - Add-ons for order items
order_status_entity      - Order status history
```

---

## 🔑 Key Foreign Keys

### Cross-Database References (Logical)
```
AUTH_DB.users.id
  ↓ Used in:
  - CART_DB.cart_entity.user_id
  - ORDER_DB.order_entity.user_id
  - ORDER_DB.order_status_entity.updated_by
  - MENU_DB.menu_rating_entity.rated_by

AUTH_DB.business.id
  ↓ Used in:
  - MENU_DB.menu_entity.business_id
  - CATEGORY_DB.category_entity.business_id
  - ORDER_DB.order_entity.business_id
  - MENU_DB.menu_rating_entity.business_id

MENU_DB.menu_entity.id
  ↓ Used in:
  - CART_DB.cart_item_entity.menu_id
  - ORDER_DB.order_item_entity.menu_id
  - MENU_DB.menu_rating_entity.menu_id

MENU_DB.add_on_entity.id
  ↓ Used in:
  - CART_DB.cart_item_add_ons_entity.add_on_id
  - ORDER_DB.order_item_addon_entity.add_on_id

CATEGORY_DB.category_entity.id
  ↓ Used in:
  - MENU_DB.menu_entity.category_id
```

---

## 🔄 Common Query Patterns

### Get User's Cart with Items
```sql
SELECT c.*, ci.*, m.name, m.price
FROM cart_entity c
JOIN cart_item_entity ci ON c.id = ci.cart_id
JOIN menu_entity m ON ci.menu_id = m.id
WHERE c.user_id = 'user-uuid';
```

### Get Order with Latest Status
```sql
SELECT o.*, 
  (SELECT status FROM order_status_entity 
   WHERE order_id = o.id 
   ORDER BY created_at DESC LIMIT 1) as current_status
FROM order_entity o
WHERE o.user_id = 'user-uuid';
```

### Get Menu Items by Category
```sql
SELECT m.*, c.name as category_name
FROM menu_entity m
JOIN category_entity c ON m.category_id = c.id
WHERE m.business_id = 'business-uuid'
  AND m.is_available = true
ORDER BY c.position, m.name;
```

### Get Business Orders (Staff View)
```sql
SELECT o.*, 
  COUNT(oi.id) as item_count,
  (SELECT status FROM order_status_entity 
   WHERE order_id = o.id 
   ORDER BY created_at DESC LIMIT 1) as current_status
FROM order_entity o
LEFT JOIN order_item_entity oi ON o.id = oi.order_id
WHERE o.business_id = 'business-uuid'
  AND DATE(o.created_at) = CURRENT_DATE
GROUP BY o.id
ORDER BY o.created_at DESC;
```

---

## 📊 Index Strategy

### Always Index:
- ✅ Primary keys (automatic)
- ✅ Foreign keys
- ✅ `business_id` (multi-tenancy)
- ✅ `user_id` (user-specific queries)
- ✅ `created_at` (time-based queries)
- ✅ `is_active`, `is_available` (filtering)

### Composite Indexes:
```sql
CREATE INDEX idx_order_business_date 
ON order_entity(business_id, created_at);

CREATE INDEX idx_menu_business_category 
ON menu_entity(business_id, category_id);

CREATE INDEX idx_cart_user_active 
ON cart_entity(user_id) WHERE deleted_at IS NULL;
```

---

## 🎯 Data Flow Patterns

### Customer Order Flow
```
1. Browse Menu (MENU_DB + CATEGORY_DB)
2. Add to Cart (CART_DB)
3. Checkout → Create Order (ORDER_DB)
4. Clear Cart (CART_DB)
5. Track Status (ORDER_DB.order_status_entity)
```

### Staff Order Management Flow
```
1. View Orders (ORDER_DB filtered by business_id)
2. Update Status (ORDER_DB.order_status_entity)
3. View Order Details (ORDER_DB + MENU_DB)
```

### Menu Management Flow
```
1. Create Category (CATEGORY_DB)
2. Create Menu Item (MENU_DB)
3. Link Add-ons (MENU_DB.menu_add_on_junction)
4. Customers Rate (MENU_DB.menu_rating_entity)
```

---

## 🔐 Security Best Practices

### Row-Level Security
```sql
-- Users can only see their own carts
WHERE cart_entity.user_id = current_user_id

-- Staff can only see their business orders
WHERE order_entity.business_id = current_business_id

-- Customers can only see their own orders
WHERE order_entity.user_id = current_user_id
```

### Soft Deletes
```sql
-- Always filter out deleted records
WHERE deleted_at IS NULL
```

---

## 📈 Performance Tips

1. **Use Pagination**: Always limit large result sets
2. **Cache Frequently**: Menu items, categories, business info
3. **Avoid N+1**: Use JOINs or eager loading
4. **Index Properly**: All foreign keys and filter columns
5. **Archive Old Data**: Move old orders to archive tables

---

## 🚀 Quick Commands

### Create All Databases
```bash
createdb auth_db
createdb menu_db
createdb category_db
createdb cart_db
createdb order_db
```

### Run Migrations
```bash
npm run migration:run
```

### Seed Data
```bash
npm run seed
```

### Backup All Databases
```bash
./scripts/backup-all-databases.sh
```

---

## 📞 Need Help?

- **Full Documentation**: See `DATABASE_DESIGN_COMPLETE.md`
- **Visual Diagram**: See `DATABASE_SCHEMA_COMPLETE.dbml` (use dbdiagram.io)
- **Architecture**: See `MICROSERVICES_ARCHITECTURE.md`
- **Relationships**: See `AUTH_DB_RELATIONSHIPS.md`
