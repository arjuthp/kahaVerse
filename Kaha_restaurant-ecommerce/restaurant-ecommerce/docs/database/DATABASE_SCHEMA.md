# Database Schema - Visual Diagram

## 📊 Complete Entity Relationship Diagram (ERD)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         RESTAURANT E-COMMERCE DATABASE                       │
└─────────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────────┐
│                              BASE ENTITY (Abstract)                           │
├──────────────────────────────────────────────────────────────────────────────┤
│ • id              UUID (PK)                                                   │
│ • createdAt       TIMESTAMP                                                   │
│ • updatedAt       TIMESTAMP                                                   │
│ • deletedAt       TIMESTAMP (nullable) - Soft Delete                          │
└──────────────────────────────────────────────────────────────────────────────┘
                                    ↑
                                    │ (All entities extend BaseEntity)
                                    │
        ┌───────────────────────────┼───────────────────────────┐
        │                           │                           │
        ↓                           ↓                           ↓


┌─────────────────────────┐         ┌─────────────────────────┐
│   CategoryEntity        │         │     AddOnEntity         │
│   (Self-Referencing)    │         │                         │
├─────────────────────────┤         ├─────────────────────────┤
│ • id (PK)               │         │ • id (PK)               │
│ • name (unique, indexed)│         │ • name                  │
│ • description           │         │ • price                 │
│ • icon                  │         │ • description           │
│ • isActive              │         │ • coverImg              │
│ • position              │         │ • createdAt             │
│ • businessId (indexed)  │         │ • updatedAt             │
│ • createdAt             │         │ • deletedAt             │
│ • updatedAt             │         └─────────────────────────┘
│ • deletedAt             │                    │
└─────────────────────────┘                    │
        │         ↑                            │
        │         │                            │
        │    ┌────┴─────┐                     │
        │    │ parent   │ (Self-Reference)    │
        │    │ childrens│                     │
        │    └──────────┘                     │
        │                                     │
        │ OneToMany                           │ ManyToMany
        ↓                                     ↓
┌─────────────────────────────────────────────────────────┐
│                    MenuEntity                            │
├─────────────────────────────────────────────────────────┤
│ • id (PK)                                                │
│ • name                                                   │
│ • description                                            │
│ • images (array)                                         │
│ • details (JSONB)                                        │
│ • isBarItem                                              │
│ • isAvailable                                            │
│ • services (enum array) [DINE_IN, TAKEAWAY, DELIVERY]   │
│ • price (numeric 12,2)                                   │
│ • discountedPrice (numeric 12,2)                         │
│ • businessId (indexed)                                   │
│ • isSignature                                            │
│ • allowAddOns                                            │
│ • createdAt                                              │
│ • updatedAt                                              │
│ • deletedAt                                              │
└─────────────────────────────────────────────────────────┘
        │                           │
        │ OneToMany                 │ ManyToOne
        ↓                           ↓
┌─────────────────────────┐   ┌─────────────────────────┐
│  MenuRatingEntity       │   │   Junction Table:       │
├─────────────────────────┤   │   menu_add_on_entity    │
│ • id (PK)               │   │   (Many-to-Many)        │
│ • rating (float)        │   ├─────────────────────────┤
│ • comments              │   │ • menuId (FK)           │
│ • ratedBy               │   │ • addOnId (FK)          │
│ • businessId            │   └─────────────────────────┘
│ • createdAt             │
│ • updatedAt             │
│ • deletedAt             │
└─────────────────────────┘


┌──────────────────────────────────────────────────────────────────────────────┐
│                            CART FLOW                                          │
└──────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────┐
│      CartEntity         │
├─────────────────────────┤
│ • id (PK)               │
│ • userId                │
│ • createdAt             │
│ • updatedAt             │
│ • deletedAt             │
└─────────────────────────┘
        │
        │ OneToMany
        ↓
┌─────────────────────────┐
│   CartItemEntity        │
├─────────────────────────┤
│ • id (PK)               │
│ • quantity              │
│ • cartId (FK)           │───┐ ManyToOne (CASCADE DELETE)
│ • menuId (FK)           │   │
│ • createdAt             │   │
│ • updatedAt             │   │
│ • deletedAt             │   │
└─────────────────────────┘   │
        │                     │
        │ OneToMany            │
        ↓                     │
┌─────────────────────────┐   │
│ CartItemAddOnsEntity    │   │
├─────────────────────────┤   │
│ • id (PK)               │   │
│ • quantity              │   │
│ • cartItemId (FK)       │───┘
│ • menuAddOnId (FK)      │───→ References AddOnEntity
│ • createdAt             │
│ • updatedAt             │
│ • deletedAt             │
└─────────────────────────┘


┌──────────────────────────────────────────────────────────────────────────────┐
│                           ORDER FLOW                                          │
└──────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────┐
│     OrderEntity         │
├─────────────────────────┤
│ • id (PK)               │
│ • userId                │
│ • businessId            │
│ • totalAmount (float)   │
│ • remarks               │
│ • createdAt             │
│ • updatedAt             │
│ • deletedAt             │
└─────────────────────────┘
        │              │
        │ OneToMany    │ OneToMany
        ↓              ↓
┌─────────────────────────┐    ┌─────────────────────────┐
│   OrderItemEntity       │    │  OrderStatusEntity      │
├─────────────────────────┤    ├─────────────────────────┤
│ • id (PK)               │    │ • id (PK)               │
│ • quantity              │    │ • orderId (FK)          │
│ • price                 │    │ • status (enum)         │
│ • orderId (FK)          │    │   - PENDING             │
│ • menuId (FK)           │    │   - CONFIRMED           │
│ • createdAt             │    │   - PREPARING           │
│ • updatedAt             │    │   - READY               │
│ • deletedAt             │    │   - DELIVERED           │
└─────────────────────────┘    │   - CANCELLED           │
        │                      │ • updatedBy             │
        │ OneToMany            │ • remarks               │
        ↓                      │ • createdAt             │
┌─────────────────────────┐    │ • updatedAt             │
│ OrderItemAddonEntity    │    │ • deletedAt             │
├─────────────────────────┤    └─────────────────────────┘
│ • id (PK)               │
│ • quantity              │
│ • price                 │
│ • orderItemId (FK)      │
│ • addonId (FK)          │───→ References AddOnEntity
│ • createdAt             │
│ • updatedAt             │
│ • deletedAt             │
└─────────────────────────┘
```

---

## 🔗 Relationship Summary

## 🔗 Relationship Summary

### VISUAL TABLE RELATIONSHIPS

#### 1. **category** 
```
                    ┌─────────────────────┐
                    │     category        │
                    │  (Self-Reference)   │
                    └─────────────────────┘
                         ↑           ↓
                    parent_id    childrens
                         │           │
                         └───────────┘
                              │
                              │ OneToMany
                              ↓
                    ┌─────────────────────┐
                    │    menu_entity      │
                    └─────────────────────┘
```

**Relationships:**
- **Self-Reference:** category.parent_id → category.id (parent/children hierarchy)
- **OneToMany:** category → menu_entity (one category has many menus)

---

#### 2. **add_on_entity**
```
                    ┌─────────────────────┐
                    │   add_on_entity     │
                    └─────────────────────┘
                         ↑     ↑     ↑
                         │     │     │
            ┌────────────┘     │     └────────────┐
            │                  │                  │
    ┌───────────────┐  ┌──────────────┐  ┌──────────────────┐
    │menu_add_on    │  │cart_item     │  │order_item_addon  │
    │_entity        │  │_add_ons      │  │_entity           │
    │(junction)     │  │_entity       │  │                  │
    └───────────────┘  └──────────────┘  └──────────────────┘
            │
            ↓
    ┌───────────────┐
    │  menu_entity  │
    └───────────────┘
```

**Relationships:**
- **ManyToMany:** add_on_entity ↔ menu_entity (via menu_add_on_entity junction)
- **Referenced by:** cart_item_add_ons_entity (cart addon selections)
- **Referenced by:** order_item_addon_entity (order addon history)

---

#### 3. **menu_entity**
```
                    ┌─────────────────────┐
                    │    category         │
                    └─────────────────────┘
                              │
                              │ ManyToOne
                              ↓
                    ┌─────────────────────┐
                    │    menu_entity      │
                    └─────────────────────┘
                         ↓     ↓     ↓     ↓
            ┌────────────┘     │     │     └────────────┐
            │                  │     │                  │
    ┌───────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐
    │menu_add_on    │  │menu_rating   │  │cart_item     │  │order_item    │
    │_entity        │  │_entity       │  │_entity       │  │_entity       │
    │(junction)     │  │              │  │              │  │              │
    └───────────────┘  └──────────────┘  └──────────────┘  └──────────────┘
            │
            ↓
    ┌───────────────┐
    │ add_on_entity │
    └───────────────┘
```

**Relationships:**
- **ManyToOne:** menu_entity → category (each menu belongs to one category)
- **ManyToMany:** menu_entity ↔ add_on_entity (via menu_add_on_entity junction)
- **OneToMany:** menu_entity → menu_rating_entity (one menu has many ratings)
- **Referenced by:** cart_item_entity (cart items reference menus)
- **Referenced by:** order_item_entity (order items reference menus)

---

#### 4. **menu_rating_entity**
```
                    ┌─────────────────────┐
                    │    menu_entity      │
                    └─────────────────────┘
                              │
                              │ OneToMany
                              ↓
                    ┌─────────────────────┐
                    │  menu_rating_entity │
                    └─────────────────────┘
```

**Relationships:**
- **ManyToOne:** menu_rating_entity → menu_entity (each rating belongs to one menu)

---

#### 5. **cart_entity**
```
                    ┌─────────────────────┐
                    │    cart_entity      │
                    └─────────────────────┘
                              │
                              │ OneToMany
                              │ (CASCADE DELETE)
                              ↓
                    ┌─────────────────────┐
                    │  cart_item_entity   │
                    └─────────────────────┘
```

**Relationships:**
- **OneToMany:** cart_entity → cart_item_entity (one cart has many items)
- **CASCADE DELETE:** Deleting cart deletes all cart items

---

#### 6. **cart_item_entity**
```
    ┌─────────────────────┐         ┌─────────────────────┐
    │    cart_entity      │         │    menu_entity      │
    └─────────────────────┘         └─────────────────────┘
              │                               │
              │ ManyToOne                     │ ManyToOne
              │ (CASCADE DELETE)              │
              ↓                               ↓
              └───────────┬───────────────────┘
                          ↓
                ┌─────────────────────┐
                │  cart_item_entity   │
                └─────────────────────┘
                          │
                          │ OneToMany
                          ↓
                ┌─────────────────────┐
                │ cart_item_add_ons   │
                │     _entity         │
                └─────────────────────┘
```

**Relationships:**
- **ManyToOne:** cart_item_entity → cart_entity (CASCADE DELETE)
- **ManyToOne:** cart_item_entity → menu_entity (references menu)
- **OneToMany:** cart_item_entity → cart_item_add_ons_entity (item has addons)

---

#### 7. **cart_item_add_ons_entity**
```
    ┌─────────────────────┐         ┌─────────────────────┐
    │  cart_item_entity   │         │   add_on_entity     │
    └─────────────────────┘         └─────────────────────┘
              │                               │
              │ ManyToOne                     │ ManyToOne
              ↓                               ↓
              └───────────┬───────────────────┘
                          ↓
                ┌─────────────────────┐
                │ cart_item_add_ons   │
                │     _entity         │
                └─────────────────────┘
```

**Relationships:**
- **ManyToOne:** cart_item_add_ons_entity → cart_item_entity (addon belongs to cart item)
- **ManyToOne:** cart_item_add_ons_entity → add_on_entity (references addon)

---

#### 8. **order_entity**
```
                    ┌─────────────────────┐
                    │    order_entity     │
                    └─────────────────────┘
                         ↓             ↓
                         │             │
            ┌────────────┘             └────────────┐
            │ OneToMany                             │ OneToMany
            ↓                                       ↓
    ┌─────────────────────┐           ┌─────────────────────┐
    │  order_item_entity  │           │ order_status_entity │
    └─────────────────────┘           └─────────────────────┘
```

**Relationships:**
- **OneToMany:** order_entity → order_item_entity (one order has many items)
- **OneToMany:** order_entity → order_status_entity (one order has many status updates)

---

#### 9. **order_item_entity**
```
    ┌─────────────────────┐         ┌─────────────────────┐
    │    order_entity     │         │    menu_entity      │
    └─────────────────────┘         └─────────────────────┘
              │                               │
              │ ManyToOne                     │ ManyToOne
              ↓                               ↓
              └───────────┬───────────────────┘
                          ↓
                ┌─────────────────────┐
                │  order_item_entity  │
                └─────────────────────┘
                          │
                          │ OneToMany
                          ↓
                ┌─────────────────────┐
                │ order_item_addon    │
                │     _entity         │
                └─────────────────────┘
```

**Relationships:**
- **ManyToOne:** order_item_entity → order_entity (item belongs to order)
- **ManyToOne:** order_item_entity → menu_entity (references menu)
- **OneToMany:** order_item_entity → order_item_addon_entity (item has addons)

---

#### 10. **order_item_addon_entity**
```
    ┌─────────────────────┐         ┌─────────────────────┐
    │  order_item_entity  │         │   add_on_entity     │
    └─────────────────────┘         └─────────────────────┘
              │                               │
              │ ManyToOne                     │ ManyToOne
              ↓                               ↓
              └───────────┬───────────────────┘
                          ↓
                ┌─────────────────────┐
                │ order_item_addon    │
                │     _entity         │
                └─────────────────────┘
```

**Relationships:**
- **ManyToOne:** order_item_addon_entity → order_item_entity (addon belongs to order item)
- **ManyToOne:** order_item_addon_entity → add_on_entity (references addon)

---

#### 11. **order_status_entity**
```
                    ┌─────────────────────┐
                    │    order_entity     │
                    └─────────────────────┘
                              │
                              │ OneToMany
                              ↓
                    ┌─────────────────────┐
                    │ order_status_entity │
                    └─────────────────────┘
```

**Relationships:**
- **ManyToOne:** order_status_entity → order_entity (status belongs to order)

---

#### 12. **menu_add_on_entity** (Junction Table)
```
    ┌─────────────────────┐         ┌─────────────────────┐
    │    menu_entity      │         │   add_on_entity     │
    └─────────────────────┘         └─────────────────────┘
              │                               │
              │ ManyToMany                    │ ManyToMany
              ↓                               ↓
              └───────────┬───────────────────┘
                          ↓
                ┌─────────────────────┐
                │  menu_add_on_entity │
                │   (Junction Table)  │
                └─────────────────────┘
```

**Relationships:**
- **Junction Table:** Connects menu_entity ↔ add_on_entity (ManyToMany)

---

## 📊 COMPLETE RELATIONSHIP MAP

```
                            ┌──────────────┐
                            │   category   │◄─┐
                            └──────────────┘  │
                                   │          │ (self-reference)
                                   │          │
                                   ↓          │
                            ┌──────────────┐  │
                    ┌──────►│ menu_entity  │  │
                    │       └──────────────┘  │
                    │              │          │
                    │              ├──────────┘
                    │              │
                    │              ├─────────────────┐
                    │              │                 │
                    │              ↓                 ↓
                    │       ┌──────────────┐  ┌──────────────┐
                    │       │menu_rating   │  │cart_item     │
                    │       │_entity       │  │_entity       │
                    │       └──────────────┘  └──────────────┘
                    │                                │
                    │                                ↓
                    │                         ┌──────────────┐
                    │                         │cart_item     │
                    │                         │_add_ons      │
                    │                         │_entity       │
                    │                         └──────────────┘
                    │                                │
┌──────────────┐    │                                │
│ add_on_entity│◄───┼────────────────────────────────┘
└──────────────┘    │                                │
       ↑            │                                │
       │            │                                ↓
       │            │                         ┌──────────────┐
       │            │                         │cart_entity   │
       │            │                         └──────────────┘
       │            │
       │            │                         ┌──────────────┐
       │            └────────────────────────►│order_item    │
       │                                      │_entity       │
       │                                      └──────────────┘
       │                                             │
       │                                             ↓
       │                                      ┌──────────────┐
       └──────────────────────────────────────│order_item    │
                                              │_addon_entity │
                                              └──────────────┘
                                                     │
                                                     ↓
                                              ┌──────────────┐
                                              │order_entity  │
                                              └──────────────┘
                                                     │
                                                     ↓
                                              ┌──────────────┐
                                              │order_status  │
                                              │_entity       │
                                              └──────────────┘
```

---

### TABLE-BY-TABLE RELATIONSHIPS

#### 1. **category** (CategoryEntity)
```
RELATES TO:
├─ category (Self)
│  ├─ parent_id → category.id (ManyToOne)
│  └─ id ← category.parent_id (OneToMany: childrens)
│
└─ menu_entity
   └─ id ← menu_entity.category_id (OneToMany: menu)

FOREIGN KEYS:
├─ parent_id → category.id (nullable)

REFERENCED BY:
├─ category.parent_id (self-reference)
└─ menu_entity.category_id
```

---

#### 2. **add_on_entity** (AddOnEntity)
```
RELATES TO:
└─ menu_entity (via junction table)
   └─ menu_add_on_entity (ManyToMany)

FOREIGN KEYS:
└─ None (no direct foreign keys)

REFERENCED BY:
├─ menu_add_on_entity.add_on_id (junction table)
├─ cart_item_add_ons_entity.menu_add_on_id
└─ order_item_addon_entity.addon_id
```

---

#### 3. **menu_entity** (MenuEntity)
```
RELATES TO:
├─ category
│  └─ category_id → category.id (ManyToOne: category)
│
├─ add_on_entity (via junction table)
│  └─ menu_add_on_entity (ManyToMany: addOns)
│
└─ menu_rating_entity
   └─ id ← menu_rating_entity.menu_id (OneToMany: menuRating)

FOREIGN KEYS:
└─ category_id → category.id

REFERENCED BY:
├─ menu_add_on_entity.menu_id (junction table)
├─ menu_rating_entity.menu_id
├─ cart_item_entity.menu_id
└─ order_item_entity.menu_id
```

---

#### 4. **menu_add_on_entity** (Junction Table)
```
RELATES TO:
├─ menu_entity
│  └─ menu_id → menu_entity.id
│
└─ add_on_entity
   └─ add_on_id → add_on_entity.id

FOREIGN KEYS:
├─ menu_id → menu_entity.id
└─ add_on_id → add_on_entity.id

REFERENCED BY:
└─ None (junction table)
```

---

#### 5. **menu_rating_entity** (MenuRatingEntity)
```
RELATES TO:
└─ menu_entity
   └─ menu_id → menu_entity.id (ManyToOne: menu)

FOREIGN KEYS:
└─ menu_id → menu_entity.id

REFERENCED BY:
└─ None
```

---

#### 6. **cart_entity** (CartEntity)
```
RELATES TO:
└─ cart_item_entity
   └─ id ← cart_item_entity.cart_id (OneToMany: cartItems)

FOREIGN KEYS:
└─ None

REFERENCED BY:
└─ cart_item_entity.cart_id (CASCADE DELETE)
```

---

#### 7. **cart_item_entity** (CartItemEntity)
```
RELATES TO:
├─ cart_entity
│  └─ cart_id → cart_entity.id (ManyToOne: cart) [CASCADE DELETE]
│
├─ menu_entity
│  └─ menu_id → menu_entity.id (ManyToOne: menu)
│
└─ cart_item_add_ons_entity
   └─ id ← cart_item_add_ons_entity.cart_item_id (OneToMany: addOns)

FOREIGN KEYS:
├─ cart_id → cart_entity.id (ON DELETE CASCADE)
└─ menu_id → menu_entity.id

REFERENCED BY:
└─ cart_item_add_ons_entity.cart_item_id
```

---

#### 8. **cart_item_add_ons_entity** (CartItemAddOnsEntity)
```
RELATES TO:
├─ cart_item_entity
│  └─ cart_item_id → cart_item_entity.id (ManyToOne: cartItem)
│
└─ add_on_entity
   └─ menu_add_on_id → add_on_entity.id (ManyToOne: menuAddOn)

FOREIGN KEYS:
├─ cart_item_id → cart_item_entity.id
└─ menu_add_on_id → add_on_entity.id

REFERENCED BY:
└─ None
```

---

#### 9. **order_entity** (OrderEntity)
```
RELATES TO:
├─ order_item_entity
│  └─ id ← order_item_entity.order_id (OneToMany: orderItems)
│
└─ order_status_entity
   └─ id ← order_status_entity.order_id (OneToMany: orderStatus)

FOREIGN KEYS:
└─ None

REFERENCED BY:
├─ order_item_entity.order_id
└─ order_status_entity.order_id
```

---

#### 10. **order_item_entity** (OrderItemEntity)
```
RELATES TO:
├─ order_entity
│  └─ order_id → order_entity.id (ManyToOne: order)
│
├─ menu_entity
│  └─ menu_id → menu_entity.id (ManyToOne: menu)
│
└─ order_item_addon_entity
   └─ id ← order_item_addon_entity.order_item_id (OneToMany: addons)

FOREIGN KEYS:
├─ order_id → order_entity.id
└─ menu_id → menu_entity.id

REFERENCED BY:
└─ order_item_addon_entity.order_item_id
```

---

#### 11. **order_item_addon_entity** (OrderItemAddonEntity)
```
RELATES TO:
├─ order_item_entity
│  └─ order_item_id → order_item_entity.id (ManyToOne: orderItem)
│
└─ add_on_entity
   └─ addon_id → add_on_entity.id (ManyToOne: addon)

FOREIGN KEYS:
├─ order_item_id → order_item_entity.id
└─ addon_id → add_on_entity.id

REFERENCED BY:
└─ None
```

---

#### 12. **order_status_entity** (OrderStatusEntity)
```
RELATES TO:
└─ order_entity
   └─ order_id → order_entity.id (ManyToOne: order)

FOREIGN KEYS:
└─ order_id → order_entity.id

REFERENCED BY:
└─ None
```

---

## 📊 QUICK REFERENCE TABLE

| Table | Has Foreign Keys To | Is Referenced By |
|-------|-------------------|------------------|
| **category** | category (self) | category (self), menu_entity |
| **add_on_entity** | None | menu_add_on_entity, cart_item_add_ons_entity, order_item_addon_entity |
| **menu_entity** | category | menu_add_on_entity, menu_rating_entity, cart_item_entity, order_item_entity |
| **menu_add_on_entity** | menu_entity, add_on_entity | None |
| **menu_rating_entity** | menu_entity | None |
| **cart_entity** | None | cart_item_entity |
| **cart_item_entity** | cart_entity, menu_entity | cart_item_add_ons_entity |
| **cart_item_add_ons_entity** | cart_item_entity, add_on_entity | None |
| **order_entity** | None | order_item_entity, order_status_entity |
| **order_item_entity** | order_entity, menu_entity | order_item_addon_entity |
| **order_item_addon_entity** | order_item_entity, add_on_entity | None |
| **order_status_entity** | order_entity | None |

---

## 🎯 TABLES BY DEPENDENCY LEVEL

### Level 0 (No Dependencies)
```
├─ category (can reference self, but nullable)
├─ add_on_entity
├─ cart_entity
└─ order_entity
```

### Level 1 (Depends on Level 0)
```
├─ menu_entity → category
├─ cart_item_entity → cart_entity, menu_entity
└─ order_item_entity → order_entity, menu_entity
```

### Level 2 (Depends on Level 1)
```
├─ menu_add_on_entity → menu_entity, add_on_entity
├─ menu_rating_entity → menu_entity
├─ cart_item_add_ons_entity → cart_item_entity, add_on_entity
├─ order_item_addon_entity → order_item_entity, add_on_entity
└─ order_status_entity → order_entity
```

---

## 🔄 WHO USES WHOM

### **add_on_entity** is used by:
```
1. menu_entity (via menu_add_on_entity junction)
2. cart_item_add_ons_entity (customer cart selections)
3. order_item_addon_entity (order history)
```

### **menu_entity** is used by:
```
1. menu_rating_entity (ratings)
2. cart_item_entity (shopping cart)
3. order_item_entity (orders)
```

### **category** is used by:
```
1. menu_entity (menu categorization)
2. category (self - hierarchical structure)
```

### **cart_entity** is used by:
```
1. cart_item_entity (cart contents)
```

### **cart_item_entity** is used by:
```
1. cart_item_add_ons_entity (addon selections)
```

### **order_entity** is used by:
```
1. order_item_entity (order contents)
2. order_status_entity (status tracking)
```

### **order_item_entity** is used by:
```
1. order_item_addon_entity (addon selections in order)
```

---

### 1. **Category ↔ Menu** (One-to-Many)
```
CategoryEntity (1) ──────→ (N) MenuEntity
- One category has many menu items
- Each menu item belongs to one category
- Eager loading enabled on Menu side
```

### 2. **Category ↔ Category** (Self-Referencing)
```
CategoryEntity (parent) ──────→ (N) CategoryEntity (children)
- Hierarchical structure
- Unlimited nesting depth
- Example: Food → Appetizers → Salads
```

### 3. **Menu ↔ AddOn** (Many-to-Many)
```
MenuEntity (N) ←──────→ (N) AddOnEntity
- Junction table: menu_add_on_entity
- One menu can have multiple addons
- One addon can be used in multiple menus
- Example: "Extra Cheese" addon on Pizza, Burger, Pasta
```

### 4. **Menu ↔ MenuRating** (One-to-Many)
```
MenuEntity (1) ──────→ (N) MenuRatingEntity
- One menu can have multiple ratings
- Each rating belongs to one menu
```

### 5. **Cart ↔ CartItem** (One-to-Many)
```
CartEntity (1) ──────→ (N) CartItemEntity
- One cart has many cart items
- Each cart item belongs to one cart
```

### 6. **CartItem ↔ Menu** (Many-to-One)
```
CartItemEntity (N) ──────→ (1) MenuEntity
- Many cart items can reference same menu
- Each cart item has one menu
```

### 7. **CartItem ↔ CartItemAddOns** (One-to-Many)
```
CartItemEntity (1) ──────→ (N) CartItemAddOnsEntity
- One cart item can have multiple addons
- Each addon selection belongs to one cart item
- CASCADE DELETE: Deleting cart item removes addon selections
```

### 8. **CartItemAddOns ↔ AddOn** (Many-to-One)
```
CartItemAddOnsEntity (N) ──────→ (1) AddOnEntity
- Many cart item addons reference same addon
- Each selection references one addon
```

### 9. **Order ↔ OrderItem** (One-to-Many)
```
OrderEntity (1) ──────→ (N) OrderItemEntity
- One order has many order items
- Each order item belongs to one order
```

### 10. **Order ↔ OrderStatus** (One-to-Many)
```
OrderEntity (1) ──────→ (N) OrderStatusEntity
- One order has multiple status updates
- Tracks order lifecycle
- Example: PENDING → CONFIRMED → PREPARING → READY → DELIVERED
```

### 11. **OrderItem ↔ Menu** (Many-to-One)
```
OrderItemEntity (N) ──────→ (1) MenuEntity
- Many order items can reference same menu
- Each order item has one menu
```

### 12. **OrderItem ↔ OrderItemAddon** (One-to-Many)
```
OrderItemEntity (1) ──────→ (N) OrderItemAddonEntity
- One order item can have multiple addons
- Preserves addon selections in order history
```

### 13. **OrderItemAddon ↔ AddOn** (Many-to-One)
```
OrderItemAddonEntity (N) ──────→ (1) AddOnEntity
- Many order item addons reference same addon
- Each addon selection references one addon
```

---

## 📋 Table Details

### Core Tables

#### 1. **category**
```sql
CREATE TABLE category (
  id                UUID PRIMARY KEY,
  name              VARCHAR UNIQUE NOT NULL,
  description       VARCHAR(1024),
  icon              VARCHAR,
  is_active         BOOLEAN DEFAULT true,
  position          INTEGER,
  business_id       VARCHAR NOT NULL,
  parent_id         UUID REFERENCES category(id),
  created_at        TIMESTAMP DEFAULT NOW(),
  updated_at        TIMESTAMP DEFAULT NOW(),
  deleted_at        TIMESTAMP
);

CREATE INDEX idx_category_name ON category(name);
CREATE INDEX idx_category_business_id ON category(business_id);
```

#### 2. **add_on_entity**
```sql
CREATE TABLE add_on_entity (
  id                UUID PRIMARY KEY,
  name              VARCHAR NOT NULL,
  price             NUMERIC NOT NULL,
  description       VARCHAR,
  cover_img         VARCHAR,
  created_at        TIMESTAMP DEFAULT NOW(),
  updated_at        TIMESTAMP DEFAULT NOW(),
  deleted_at        TIMESTAMP
);

-- ⚠️ MISSING: business_id column
-- ⚠️ MISSING: is_available column
-- ⚠️ MISSING: category column
```

#### 3. **menu_entity**
```sql
CREATE TABLE menu_entity (
  id                UUID PRIMARY KEY,
  name              VARCHAR NOT NULL,
  description       VARCHAR,
  images            VARCHAR[],
  details           JSONB,
  is_bar_item       BOOLEAN DEFAULT false,
  is_available      BOOLEAN DEFAULT true,
  services          VARCHAR[] DEFAULT ARRAY['DINE_IN'],
  price             NUMERIC(12,2) NOT NULL,
  discounted_price  NUMERIC(12,2),
  business_id       VARCHAR NOT NULL,
  is_signature      BOOLEAN DEFAULT false,
  allow_add_ons     BOOLEAN DEFAULT false,
  category_id       UUID REFERENCES category(id),
  created_at        TIMESTAMP DEFAULT NOW(),
  updated_at        TIMESTAMP DEFAULT NOW(),
  deleted_at        TIMESTAMP
);

CREATE INDEX idx_menu_business_id ON menu_entity(business_id);
```

#### 4. **menu_add_on_entity** (Junction Table)
```sql
CREATE TABLE menu_add_on_entity (
  menu_id           UUID REFERENCES menu_entity(id),
  add_on_id         UUID REFERENCES add_on_entity(id),
  PRIMARY KEY (menu_id, add_on_id)
);
```

#### 5. **menu_rating_entity**
```sql
CREATE TABLE menu_rating_entity (
  id                UUID PRIMARY KEY,
  rating            FLOAT NOT NULL,
  comments          VARCHAR NOT NULL,
  rated_by          VARCHAR NOT NULL,
  business_id       VARCHAR NOT NULL,
  menu_id           UUID REFERENCES menu_entity(id),
  created_at        TIMESTAMP DEFAULT NOW(),
  updated_at        TIMESTAMP DEFAULT NOW(),
  deleted_at        TIMESTAMP
);
```

### Cart Tables

#### 6. **cart_entity**
```sql
CREATE TABLE cart_entity (
  id                UUID PRIMARY KEY,
  user_id           VARCHAR NOT NULL,
  created_at        TIMESTAMP DEFAULT NOW(),
  updated_at        TIMESTAMP DEFAULT NOW(),
  deleted_at        TIMESTAMP
);
```

#### 7. **cart_item_entity**
```sql
CREATE TABLE cart_item_entity (
  id                UUID PRIMARY KEY,
  quantity          INTEGER NOT NULL,
  cart_id           UUID REFERENCES cart_entity(id) ON DELETE CASCADE,
  menu_id           UUID REFERENCES menu_entity(id),
  created_at        TIMESTAMP DEFAULT NOW(),
  updated_at        TIMESTAMP DEFAULT NOW(),
  deleted_at        TIMESTAMP
);
```

#### 8. **cart_item_add_ons_entity**
```sql
CREATE TABLE cart_item_add_ons_entity (
  id                UUID PRIMARY KEY,
  quantity          INTEGER,
  cart_item_id      UUID REFERENCES cart_item_entity(id),
  menu_add_on_id    UUID REFERENCES add_on_entity(id),
  created_at        TIMESTAMP DEFAULT NOW(),
  updated_at        TIMESTAMP DEFAULT NOW(),
  deleted_at        TIMESTAMP
);
```

### Order Tables

#### 9. **order_entity**
```sql
CREATE TABLE order_entity (
  id                UUID PRIMARY KEY,
  user_id           VARCHAR NOT NULL,
  business_id       VARCHAR NOT NULL,
  total_amount      FLOAT DEFAULT 0,
  remarks           VARCHAR,
  created_at        TIMESTAMP DEFAULT NOW(),
  updated_at        TIMESTAMP DEFAULT NOW(),
  deleted_at        TIMESTAMP
);
```

#### 10. **order_item_entity**
```sql
CREATE TABLE order_item_entity (
  id                UUID PRIMARY KEY,
  quantity          INTEGER NOT NULL,
  price             NUMERIC NOT NULL,
  order_id          UUID REFERENCES order_entity(id),
  menu_id           UUID REFERENCES menu_entity(id),
  created_at        TIMESTAMP DEFAULT NOW(),
  updated_at        TIMESTAMP DEFAULT NOW(),
  deleted_at        TIMESTAMP
);
```

#### 11. **order_item_addon_entity**
```sql
CREATE TABLE order_item_addon_entity (
  id                UUID PRIMARY KEY,
  quantity          INTEGER NOT NULL,
  price             NUMERIC NOT NULL,
  order_item_id     UUID REFERENCES order_item_entity(id),
  addon_id          UUID REFERENCES add_on_entity(id),
  created_at        TIMESTAMP DEFAULT NOW(),
  updated_at        TIMESTAMP DEFAULT NOW(),
  deleted_at        TIMESTAMP
);
```

#### 12. **order_status_entity**
```sql
CREATE TABLE order_status_entity (
  id                UUID PRIMARY KEY,
  order_id          UUID REFERENCES order_entity(id),
  status            VARCHAR NOT NULL, -- PENDING, CONFIRMED, PREPARING, READY, DELIVERED, CANCELLED
  updated_by        VARCHAR NOT NULL,
  remarks           VARCHAR,
  created_at        TIMESTAMP DEFAULT NOW(),
  updated_at        TIMESTAMP DEFAULT NOW(),
  deleted_at        TIMESTAMP
);
```

---

## 🔄 Data Flow Examples

### Example 1: Customer Orders Pizza with Addons

```
1. MENU SETUP
   ┌─────────────────────────────────────────────────────────┐
   │ Menu: Margherita Pizza ($12.00)                         │
   │ Category: Pizza                                         │
   │ Addons: Extra Cheese ($2.00), Pepperoni ($2.50)        │
   └─────────────────────────────────────────────────────────┘

2. CART PHASE
   ┌─────────────────────────────────────────────────────────┐
   │ cart_entity                                             │
   │ - id: cart-123                                          │
   │ - user_id: user-456                                     │
   └─────────────────────────────────────────────────────────┘
                    ↓
   ┌─────────────────────────────────────────────────────────┐
   │ cart_item_entity                                        │
   │ - id: cart-item-789                                     │
   │ - cart_id: cart-123                                     │
   │ - menu_id: menu-margherita                              │
   │ - quantity: 1                                           │
   └─────────────────────────────────────────────────────────┘
                    ↓
   ┌─────────────────────────────────────────────────────────┐
   │ cart_item_add_ons_entity                                │
   │ - cart_item_id: cart-item-789                           │
   │ - menu_add_on_id: addon-cheese (quantity: 1)            │
   │                                                         │
   │ - cart_item_id: cart-item-789                           │
   │ - menu_add_on_id: addon-pepperoni (quantity: 1)         │
   └─────────────────────────────────────────────────────────┘

3. ORDER PHASE (After Checkout)
   ┌─────────────────────────────────────────────────────────┐
   │ order_entity                                            │
   │ - id: order-999                                         │
   │ - user_id: user-456                                     │
   │ - business_id: business-111                             │
   │ - total_amount: 16.50                                   │
   └─────────────────────────────────────────────────────────┘
                    ↓
   ┌─────────────────────────────────────────────────────────┐
   │ order_item_entity                                       │
   │ - id: order-item-888                                    │
   │ - order_id: order-999                                   │
   │ - menu_id: menu-margherita                              │
   │ - quantity: 1                                           │
   │ - price: 12.00                                          │
   └─────────────────────────────────────────────────────────┘
                    ↓
   ┌─────────────────────────────────────────────────────────┐
   │ order_item_addon_entity                                 │
   │ - order_item_id: order-item-888                         │
   │ - addon_id: addon-cheese                                │
   │ - quantity: 1                                           │
   │ - price: 2.00                                           │
   │                                                         │
   │ - order_item_id: order-item-888                         │
   │ - addon_id: addon-pepperoni                             │
   │ - quantity: 1                                           │
   │ - price: 2.50                                           │
   └─────────────────────────────────────────────────────────┘
                    ↓
   ┌─────────────────────────────────────────────────────────┐
   │ order_status_entity                                     │
   │ - order_id: order-999                                   │
   │ - status: PENDING                                       │
   │ - updated_by: system                                    │
   └─────────────────────────────────────────────────────────┘
```

---

## ⚠️ Database Issues & Missing Features

### Critical Issues

1. **AddOnEntity - No Business Scoping**
   - ❌ Missing `business_id` column
   - ❌ All addons are global
   - ❌ Data leakage between businesses

2. **AddOnEntity - No Availability**
   - ❌ Missing `is_available` column
   - ❌ Cannot mark as out of stock
   - ❌ Must delete to remove

3. **No Foreign Key Constraints**
   - ❌ Some relations lack proper FK constraints
   - ❌ Referential integrity not enforced

4. **Soft Delete Implementation**
   - ✅ `deleted_at` column exists in BaseEntity
   - ❌ Not consistently used across all operations
   - ❌ Hard deletes still happening

### Missing Indexes

```sql
-- Recommended indexes for performance
CREATE INDEX idx_addon_business_id ON add_on_entity(business_id); -- MISSING
CREATE INDEX idx_addon_name ON add_on_entity(name); -- MISSING
CREATE INDEX idx_cart_user_id ON cart_entity(user_id); -- MISSING
CREATE INDEX idx_order_user_id ON order_entity(user_id); -- MISSING
CREATE INDEX idx_order_business_id ON order_entity(business_id); -- MISSING
CREATE INDEX idx_order_created_at ON order_entity(created_at); -- MISSING
```

---

## 📊 Database Statistics

```
Total Tables: 12
├─ Core Tables: 5 (category, menu, addon, menu_rating, menu_addon junction)
├─ Cart Tables: 3 (cart, cart_item, cart_item_addons)
└─ Order Tables: 4 (order, order_item, order_item_addon, order_status)

Total Relationships: 13
├─ One-to-Many: 9
├─ Many-to-Many: 1
└─ Self-Referencing: 1

Soft Delete Enabled: All tables (via BaseEntity)
Cascade Delete: 1 (cart → cart_item)
```

---

## 📦 MODULE-WISE DATABASE REFERENCES

### 1️⃣ **CATEGORY MODULE**

**Primary Table:** `category`

**Database References:**
```
category (Self-Referencing)
├─ References: category.parent_id → category.id
└─ Referenced by: menu_entity.category_id → category.id
```

**What Category Module Touches:**
```
READ Operations:
├─ category (all fields)
├─ category.childrens (nested categories)
└─ category.parent (parent category)

WRITE Operations:
├─ INSERT INTO category
├─ UPDATE category
└─ DELETE FROM category
```

**Relations Used:**
```typescript
// In CategoryEntity
@OneToMany(() => CategoryEntity, (category) => category.parent)
childrens: CategoryEntity[];  // Loads child categories

@ManyToOne(() => CategoryEntity, (category) => category.childrens)
parent: CategoryEntity;  // Loads parent category

@OneToMany(() => MenuEntity, (menu) => menu.category)
menu: MenuEntity[];  // ⚠️ Defined but NEVER loaded in current code
```

**Query Patterns:**
```sql
-- Get all root categories with nested children
SELECT * FROM category 
WHERE parent_id IS NULL 
  AND business_id = ?
  -- Includes relations: childrens.childrens (2 levels deep)

-- Get category by ID
SELECT * FROM category 
WHERE id = ?
  -- Includes relations: childrens (1 level)

-- Create category
INSERT INTO category (name, description, icon, business_id, parent_id, ...)
VALUES (?, ?, ?, ?, ?, ...)

-- Update category
UPDATE category 
SET name = ?, description = ?, icon = ?, is_active = ?, parent_id = ?
WHERE id = ? AND business_id = ?

-- Delete category
DELETE FROM category 
WHERE id = ? AND business_id = ?
```

**Impact on Other Modules:**
- ✅ Menu module reads categories
- ⚠️ Deleting category may orphan menu items (no cascade handling)

---

### 2️⃣ **ADDONS MODULE**

**Primary Table:** `add_on_entity`

**Database References:**
```
add_on_entity
├─ Referenced by: menu_add_on_entity.add_on_id → add_on_entity.id
├─ Referenced by: cart_item_add_ons_entity.menu_add_on_id → add_on_entity.id
└─ Referenced by: order_item_addon_entity.addon_id → add_on_entity.id
```

**What Addons Module Touches:**
```
READ Operations:
├─ add_on_entity (all fields)
└─ add_on_entity.menu (⚠️ relation exists but NEVER loaded)

WRITE Operations:
├─ INSERT INTO add_on_entity
├─ UPDATE add_on_entity
└─ DELETE FROM add_on_entity (hard delete)
```

**Relations Used:**
```typescript
// In AddOnEntity
@ManyToMany(() => MenuEntity, (menu) => menu.addOns)
menu: MenuEntity;  // ⚠️ Defined but NEVER loaded in current code
```

**Query Patterns:**
```sql
-- Get all addons (⚠️ NO business scoping!)
SELECT * FROM add_on_entity
-- Returns ALL addons from ALL businesses

-- Get addon by ID
SELECT * FROM add_on_entity 
WHERE id = ?

-- Check duplicate name (case-insensitive)
SELECT * FROM add_on_entity 
WHERE LOWER(name) = LOWER(?)

-- Create addon
INSERT INTO add_on_entity (name, price, description, cover_img)
VALUES (?, ?, ?, ?)

-- Update addon
UPDATE add_on_entity 
SET name = ?, price = ?, description = ?, cover_img = ?
WHERE id = ?

-- Delete addon
DELETE FROM add_on_entity 
WHERE id = ?
```

**Impact on Other Modules:**
- ✅ Menu module associates addons with menu items
- ✅ Cart module stores selected addons
- ✅ Order module preserves addon selections
- ⚠️ Deleting addon breaks references in all modules!

**Critical Issues:**
- ❌ No `business_id` column (global addons)
- ❌ No validation before delete (breaks references)
- ❌ Relations defined but never loaded

---

### 3️⃣ **MENU MODULE**

**Primary Table:** `menu_entity`

**Database References:**
```
menu_entity
├─ References: menu_entity.category_id → category.id
├─ Junction: menu_add_on_entity (menu_id, add_on_id)
├─ Referenced by: menu_rating_entity.menu_id → menu_entity.id
├─ Referenced by: cart_item_entity.menu_id → menu_entity.id
└─ Referenced by: order_item_entity.menu_id → menu_entity.id
```

**What Menu Module Touches:**
```
READ Operations:
├─ menu_entity (all fields)
├─ category (via menu.category - EAGER loaded)
├─ add_on_entity (via menu.addOns)
└─ menu_add_on_entity (junction table)

WRITE Operations:
├─ INSERT INTO menu_entity
├─ INSERT INTO menu_add_on_entity (when associating addons)
├─ UPDATE menu_entity
├─ UPDATE menu_add_on_entity (when updating addons)
└─ DELETE FROM menu_entity
```

**Relations Used:**
```typescript
// In MenuEntity
@ManyToOne(() => CategoryEntity, (category) => category.menu, { eager: true })
category: CategoryEntity;  // ✅ ALWAYS loaded (eager)

@ManyToMany(() => AddOnEntity, (addons) => addons.menu)
@JoinTable()
addOns: AddOnEntity[];  // ✅ Loaded when needed

@OneToMany(() => MenuRatingEntity, (menuRating) => menuRating.menu)
menuRating: MenuRatingEntity;  // ⚠️ Defined but rarely loaded
```

**Query Patterns:**
```sql
-- Get all menus with filters
SELECT m.*, c.* 
FROM menu_entity m
LEFT JOIN category c ON m.category_id = c.id
WHERE m.business_id = ?
  AND m.name LIKE ?
  AND m.price BETWEEN ? AND ?
  AND c.id = ?
LIMIT ? OFFSET ?

-- Get menu by ID with addons
SELECT m.*, c.*, a.*
FROM menu_entity m
LEFT JOIN category c ON m.category_id = c.id
LEFT JOIN menu_add_on_entity ma ON m.id = ma.menu_id
LEFT JOIN add_on_entity a ON ma.add_on_id = a.id
WHERE m.id = ?

-- Create menu with addons
INSERT INTO menu_entity (name, price, category_id, business_id, ...)
VALUES (?, ?, ?, ?, ...);

INSERT INTO menu_add_on_entity (menu_id, add_on_id)
VALUES (?, ?), (?, ?), ...;

-- Update menu addons (replace all)
DELETE FROM menu_add_on_entity WHERE menu_id = ?;
INSERT INTO menu_add_on_entity (menu_id, add_on_id)
VALUES (?, ?), (?, ?), ...;

-- Delete menu
DELETE FROM menu_entity WHERE id = ? AND business_id = ?;
-- ⚠️ What happens to menu_add_on_entity? (should cascade)
```

**Impact on Other Modules:**
- ✅ Category module provides categories
- ✅ Addons module provides addons
- ✅ Cart module references menus
- ✅ Order module references menus
- ✅ Menu Rating module rates menus

---

### 4️⃣ **MENU RATING MODULE**

**Primary Table:** `menu_rating_entity`

**Database References:**
```
menu_rating_entity
└─ References: menu_rating_entity.menu_id → menu_entity.id
```

**What Menu Rating Module Touches:**
```
READ Operations:
├─ menu_rating_entity (all fields)
└─ menu_entity (via rating.menu)

WRITE Operations:
├─ INSERT INTO menu_rating_entity
├─ UPDATE menu_rating_entity
└─ DELETE FROM menu_rating_entity
```

**Relations Used:**
```typescript
// In MenuRatingEntity
@ManyToOne(() => MenuEntity, (menu) => menu.menuRating)
menu: MenuEntity;  // References the rated menu
```

**Query Patterns:**
```sql
-- Get all ratings for a menu
SELECT * FROM menu_rating_entity
WHERE menu_id = ? AND business_id = ?

-- Get rating by ID
SELECT * FROM menu_rating_entity
WHERE id = ?

-- Create rating
INSERT INTO menu_rating_entity (rating, comments, rated_by, menu_id, business_id)
VALUES (?, ?, ?, ?, ?)

-- Update rating
UPDATE menu_rating_entity
SET rating = ?, comments = ?
WHERE id = ? AND rated_by = ?

-- Delete rating
DELETE FROM menu_rating_entity
WHERE id = ? AND rated_by = ?

-- Calculate average rating for menu
SELECT AVG(rating) as avg_rating, COUNT(*) as total_ratings
FROM menu_rating_entity
WHERE menu_id = ?
```

**Impact on Other Modules:**
- ✅ Menu module displays average ratings
- ❌ No impact on other modules

---

### 5️⃣ **CART MODULE**

**Primary Tables:** `cart_entity`, `cart_item_entity`, `cart_item_add_ons_entity`

**Database References:**
```
cart_entity
└─ Referenced by: cart_item_entity.cart_id → cart_entity.id (CASCADE DELETE)

cart_item_entity
├─ References: cart_item_entity.cart_id → cart_entity.id
├─ References: cart_item_entity.menu_id → menu_entity.id
└─ Referenced by: cart_item_add_ons_entity.cart_item_id → cart_item_entity.id

cart_item_add_ons_entity
├─ References: cart_item_add_ons_entity.cart_item_id → cart_item_entity.id
└─ References: cart_item_add_ons_entity.menu_add_on_id → add_on_entity.id
```

**What Cart Module Touches:**
```
READ Operations:
├─ cart_entity (user's cart)
├─ cart_item_entity (items in cart)
├─ cart_item_add_ons_entity (addon selections)
├─ menu_entity (via cart_item.menu)
└─ add_on_entity (via cart_item_addons.menuAddOn)

WRITE Operations:
├─ INSERT INTO cart_entity (create cart)
├─ INSERT INTO cart_item_entity (add item to cart)
├─ INSERT INTO cart_item_add_ons_entity (add addon to item)
├─ UPDATE cart_item_entity (update quantity)
├─ UPDATE cart_item_add_ons_entity (update addon quantity)
├─ DELETE FROM cart_item_entity (remove item)
├─ DELETE FROM cart_item_add_ons_entity (remove addon)
└─ DELETE FROM cart_entity (clear cart after order)
```

**Relations Used:**
```typescript
// In CartEntity
@OneToMany(() => CartItemEntity, (cartItem) => cartItem.cart)
cartItems: CartItemEntity[];  // ✅ Loaded to show cart contents

// In CartItemEntity
@ManyToOne(() => CartEntity, (cart) => cart.cartItems, { onDelete: "CASCADE" })
cart: CartEntity;  // ✅ CASCADE DELETE enabled

@ManyToOne(() => MenuEntity)
menu: MenuEntity;  // ✅ Loaded to show menu details

@OneToMany(() => CartItemAddOnsEntity, (addon) => addon.cartItem)
addOns: CartItemAddOnsEntity[];  // ✅ Loaded to show selected addons

// In CartItemAddOnsEntity
@ManyToOne(() => CartItemEntity, (cartItem) => cartItem.addOns)
cartItem: CartItemEntity;

@ManyToOne(() => AddOnEntity)
menuAddOn: AddOnEntity;  // ✅ Loaded to show addon details
```

**Query Patterns:**
```sql
-- Get user's cart with all items and addons
SELECT c.*, ci.*, m.*, cia.*, a.*
FROM cart_entity c
LEFT JOIN cart_item_entity ci ON c.id = ci.cart_id
LEFT JOIN menu_entity m ON ci.menu_id = m.id
LEFT JOIN cart_item_add_ons_entity cia ON ci.id = cia.cart_item_id
LEFT JOIN add_on_entity a ON cia.menu_add_on_id = a.id
WHERE c.user_id = ?

-- Add item to cart
INSERT INTO cart_item_entity (cart_id, menu_id, quantity)
VALUES (?, ?, ?)

-- Add addon to cart item
INSERT INTO cart_item_add_ons_entity (cart_item_id, menu_add_on_id, quantity)
VALUES (?, ?, ?)

-- Update cart item quantity
UPDATE cart_item_entity
SET quantity = ?
WHERE id = ? AND cart_id IN (SELECT id FROM cart_entity WHERE user_id = ?)

-- Remove item from cart (CASCADE deletes addons)
DELETE FROM cart_item_entity
WHERE id = ? AND cart_id IN (SELECT id FROM cart_entity WHERE user_id = ?)

-- Clear cart after order
DELETE FROM cart_entity WHERE user_id = ?
-- CASCADE deletes all cart_item_entity and cart_item_add_ons_entity
```

**Impact on Other Modules:**
- ✅ Menu module provides menu items
- ✅ Addons module provides addons
- ✅ Order module reads cart to create order
- ⚠️ If menu deleted, cart items have broken references
- ⚠️ If addon deleted, cart addon selections have broken references

---

### 6️⃣ **ORDER MODULE**

**Primary Tables:** `order_entity`, `order_item_entity`, `order_item_addon_entity`, `order_status_entity`

**Database References:**
```
order_entity
├─ Referenced by: order_item_entity.order_id → order_entity.id
└─ Referenced by: order_status_entity.order_id → order_entity.id

order_item_entity
├─ References: order_item_entity.order_id → order_entity.id
├─ References: order_item_entity.menu_id → menu_entity.id
└─ Referenced by: order_item_addon_entity.order_item_id → order_item_entity.id

order_item_addon_entity
├─ References: order_item_addon_entity.order_item_id → order_item_entity.id
└─ References: order_item_addon_entity.addon_id → add_on_entity.id

order_status_entity
└─ References: order_status_entity.order_id → order_entity.id
```

**What Order Module Touches:**
```
READ Operations:
├─ order_entity (order details)
├─ order_item_entity (items in order)
├─ order_item_addon_entity (addon selections)
├─ order_status_entity (order status history)
├─ menu_entity (via order_item.menu)
├─ add_on_entity (via order_item_addon.addon)
└─ cart_entity (to create order from cart)

WRITE Operations:
├─ INSERT INTO order_entity (create order)
├─ INSERT INTO order_item_entity (add items from cart)
├─ INSERT INTO order_item_addon_entity (preserve addon selections)
├─ INSERT INTO order_status_entity (initial status: PENDING)
├─ UPDATE order_entity (update total_amount)
├─ UPDATE order_status_entity (change order status)
└─ DELETE FROM cart_entity (clear cart after order created)
```

**Relations Used:**
```typescript
// In OrderEntity
@OneToMany(() => OrderItemEntity, (orderItem) => orderItem.order)
orderItems: OrderItemEntity[];  // ✅ Loaded to show order contents

@OneToMany(() => OrderStatusEntity, (status) => status.order)
orderStatus: OrderStatusEntity[];  // ✅ Loaded to show status history

// In OrderItemEntity
@ManyToOne(() => OrderEntity, (order) => order.orderItems)
order: OrderEntity;

@ManyToOne(() => MenuEntity)
menu: MenuEntity;  // ✅ Loaded to show menu details

@OneToMany(() => OrderItemAddonEntity, (addon) => addon.orderItem)
addons: OrderItemAddonEntity[];  // ✅ Loaded to show addon selections

// In OrderItemAddonEntity
@ManyToOne(() => OrderItemEntity, (orderItem) => orderItem.addons)
orderItem: OrderItemEntity;

@ManyToOne(() => AddOnEntity)
addon: AddOnEntity;  // ✅ Loaded to show addon details

// In OrderStatusEntity
@ManyToOne(() => OrderEntity, (order) => order.orderStatus)
order: OrderEntity;
```

**Query Patterns:**
```sql
-- Create order from cart
-- Step 1: Create order
INSERT INTO order_entity (user_id, business_id, total_amount, remarks)
VALUES (?, ?, ?, ?)

-- Step 2: Copy cart items to order items
INSERT INTO order_item_entity (order_id, menu_id, quantity, price)
SELECT ?, ci.menu_id, ci.quantity, m.price
FROM cart_item_entity ci
JOIN menu_entity m ON ci.menu_id = m.id
WHERE ci.cart_id = ?

-- Step 3: Copy cart addons to order addons
INSERT INTO order_item_addon_entity (order_item_id, addon_id, quantity, price)
SELECT oi.id, cia.menu_add_on_id, cia.quantity, a.price
FROM cart_item_add_ons_entity cia
JOIN add_on_entity a ON cia.menu_add_on_id = a.id
JOIN order_item_entity oi ON oi.menu_id = (
  SELECT menu_id FROM cart_item_entity WHERE id = cia.cart_item_id
)
WHERE oi.order_id = ?

-- Step 4: Create initial status
INSERT INTO order_status_entity (order_id, status, updated_by)
VALUES (?, 'PENDING', ?)

-- Step 5: Clear cart
DELETE FROM cart_entity WHERE user_id = ?

-- Get order with all details
SELECT o.*, oi.*, m.*, oia.*, a.*, os.*
FROM order_entity o
LEFT JOIN order_item_entity oi ON o.id = oi.order_id
LEFT JOIN menu_entity m ON oi.menu_id = m.id
LEFT JOIN order_item_addon_entity oia ON oi.id = oia.order_item_id
LEFT JOIN add_on_entity a ON oia.addon_id = a.id
LEFT JOIN order_status_entity os ON o.id = os.order_id
WHERE o.id = ?
ORDER BY os.created_at DESC

-- Update order status
INSERT INTO order_status_entity (order_id, status, updated_by, remarks)
VALUES (?, ?, ?, ?)

-- Get user's order history
SELECT * FROM order_entity
WHERE user_id = ?
ORDER BY created_at DESC
LIMIT ? OFFSET ?

-- Get business orders
SELECT * FROM order_entity
WHERE business_id = ?
  AND created_at >= ?
ORDER BY created_at DESC
```

**Impact on Other Modules:**
- ✅ Cart module provides data for order creation
- ✅ Menu module provides menu details
- ✅ Addons module provides addon details
- ⚠️ Order preserves snapshot of prices (good!)
- ⚠️ If menu/addon deleted, order history shows broken references

---

## 🔄 CROSS-MODULE DATA FLOW

### Flow 1: Menu Setup
```
1. Category Module
   ├─ CREATE category "Pizza"
   └─ category.id = "cat-123"

2. Addons Module
   ├─ CREATE addon "Extra Cheese" ($2.00)
   ├─ CREATE addon "Pepperoni" ($2.50)
   └─ addon.ids = ["addon-1", "addon-2"]

3. Menu Module
   ├─ CREATE menu "Margherita Pizza" ($12.00)
   ├─ SET menu.category_id = "cat-123"
   └─ INSERT INTO menu_add_on_entity
       ├─ (menu_id, addon-1)
       └─ (menu_id, addon-2)
```

### Flow 2: Customer Order Journey
```
1. Cart Module - Add to Cart
   ├─ INSERT cart_entity (user_id)
   ├─ INSERT cart_item_entity (cart_id, menu_id, quantity)
   └─ INSERT cart_item_add_ons_entity (cart_item_id, addon_id, quantity)

2. Cart Module - View Cart
   ├─ SELECT cart with relations
   ├─ JOIN cart_item_entity
   ├─ JOIN menu_entity (get menu details)
   ├─ JOIN cart_item_add_ons_entity
   └─ JOIN add_on_entity (get addon details)

3. Order Module - Checkout
   ├─ READ cart_entity with all items
   ├─ INSERT order_entity (user_id, business_id, total_amount)
   ├─ INSERT order_item_entity (copy from cart_item)
   ├─ INSERT order_item_addon_entity (copy from cart_item_addons)
   ├─ INSERT order_status_entity (status: PENDING)
   └─ DELETE cart_entity (clear cart)

4. Order Module - Status Updates
   ├─ INSERT order_status_entity (status: CONFIRMED)
   ├─ INSERT order_status_entity (status: PREPARING)
   ├─ INSERT order_status_entity (status: READY)
   └─ INSERT order_status_entity (status: DELIVERED)
```

### Flow 3: Menu Rating
```
1. Menu Rating Module
   ├─ Customer places order (Order Module)
   ├─ Order delivered
   ├─ INSERT menu_rating_entity (menu_id, rating, comments, rated_by)
   └─ Menu Module displays average rating
```

---

## ⚠️ REFERENTIAL INTEGRITY ISSUES

### Issue 1: Deleting Addon
```
Current State:
├─ Addon exists in: add_on_entity
├─ Referenced by: menu_add_on_entity (menu associations)
├─ Referenced by: cart_item_add_ons_entity (active carts)
└─ Referenced by: order_item_addon_entity (order history)

If Addon Deleted:
├─ menu_add_on_entity → Broken reference (menu shows missing addon)
├─ cart_item_add_ons_entity → Broken reference (cart fails)
└─ order_item_addon_entity → Broken reference (order history broken)

Solution Needed:
├─ Check usage before delete
├─ Prevent deletion if in use
└─ Or use soft delete (deletedAt)
```

### Issue 2: Deleting Menu
```
Current State:
├─ Menu exists in: menu_entity
├─ Referenced by: cart_item_entity (active carts)
├─ Referenced by: order_item_entity (order history)
└─ Referenced by: menu_rating_entity (ratings)

If Menu Deleted:
├─ cart_item_entity → Broken reference (cart fails)
├─ order_item_entity → Broken reference (order history broken)
└─ menu_rating_entity → Orphaned ratings

Solution Needed:
├─ Check usage before delete
├─ Prevent deletion if in active carts
└─ Soft delete for order history preservation
```

### Issue 3: Deleting Category
```
Current State:
├─ Category exists in: category
├─ Referenced by: menu_entity.category_id
└─ Referenced by: category.parent_id (child categories)

If Category Deleted:
├─ menu_entity → Orphaned menus (no category)
└─ category → Orphaned child categories

Solution Needed:
├─ Check if category has menus
├─ Check if category has children
└─ Prevent deletion or cascade properly
```

---

This comprehensive breakdown shows exactly what each module touches in the database and how they all interconnect!

