# Module-by-Module Database Architecture

## 📦 **MODULE 1: CATEGORY MODULE**

### **Table: category**

#### **Fields:**
```
┌─────────────────────────────────────────┐
│ category                                │
├─────────────────────────────────────────┤
│ • id (PK) - UUID                        │
│ • name - VARCHAR (unique, indexed)      │
│ • description - VARCHAR(1024)           │
│ • icon - VARCHAR                        │
│ • isActive - BOOLEAN                    │
│ • position - INTEGER                    │
│ • businessId - VARCHAR (indexed)        │
│ • parent_id - UUID (FK) ← Self         │
│ • createdAt - TIMESTAMP                 │
│ • updatedAt - TIMESTAMP                 │
│ • deletedAt - TIMESTAMP                 │
└─────────────────────────────────────────┘
```

#### **Foreign Keys (What it references):**
```
category.parent_id → category.id (Self-Reference)
└─ Nullable: Yes
└─ Purpose: Hierarchical categories (parent/child)
```

#### **Referenced By (What references it):**
```
1. category.parent_id → category.id (Self)
   └─ Type: OneToMany (childrens)
   └─ Purpose: Child categories

2. menu_entity.category_id → category.id
   └─ Type: OneToMany (menu)
   └─ Purpose: Menu items in this category
```

#### **Relations in Code:**
```typescript
@Entity()
export class CategoryEntity extends BaseEntity {
  // Self-referencing relations
  @OneToMany(() => CategoryEntity, (category) => category.parent)
  childrens?: CategoryEntity[];  // Child categories
  
  @ManyToOne(() => CategoryEntity, (category) => category.childrens)
  parent: CategoryEntity;  // Parent category
  
  // External relations
  @OneToMany(() => MenuEntity, (menu) => menu.category)
  menu: MenuEntity[];  // Menu items in this category
}
```

#### **Complete Architecture:**
```
                    ┌─────────────┐
                    │  category   │
                    │   (Self)    │
                    └─────────────┘
                         ↑   ↓
                    parent_id │ childrens
                         │   │
                         └───┘
                            │
                            │ OneToMany
                            ↓
                    ┌─────────────┐
                    │menu_entity  │
                    └─────────────┘
```

#### **Cardinality:**
- **1 Category** → **Many Child Categories** (0 to N)
- **1 Category** → **Many Menu Items** (0 to N)
- **1 Menu Item** → **1 Category** (required)

---

## 📦 **MODULE 2: ADDONS MODULE**

### **Table: add_on_entity**

#### **Fields:**
```
┌─────────────────────────────────────────┐
│ add_on_entity                           │
├─────────────────────────────────────────┤
│ • id (PK) - UUID                        │
│ • name - VARCHAR                        │
│ • price - NUMERIC                       │
│ • description - VARCHAR                 │
│ • coverImg - VARCHAR                    │
│ • createdAt - TIMESTAMP                 │
│ • updatedAt - TIMESTAMP                 │
│ • deletedAt - TIMESTAMP                 │
│                                         │
│ ⚠️ MISSING: businessId                  │
│ ⚠️ MISSING: isAvailable                 │
│ ⚠️ MISSING: category                    │
└─────────────────────────────────────────┘
```

#### **Foreign Keys (What it references):**
```
NONE - No direct foreign keys
└─ Connected via junction tables
```

#### **Referenced By (What references it):**
```
1. menu_add_on_entity.add_on_id → add_on_entity.id
   └─ Type: ManyToMany (via junction)
   └─ Purpose: Which menus can have this addon

2. cart_item_add_ons_entity.menu_add_on_id → add_on_entity.id
   └─ Type: ManyToOne
   └─ Purpose: Addon selections in cart

3. order_item_addon_entity.addon_id → add_on_entity.id
   └─ Type: ManyToOne
   └─ Purpose: Addon selections in orders
```

#### **Relations in Code:**
```typescript
@Entity()
export class AddOnEntity extends BaseEntity {
  @ManyToMany(() => MenuEntity, (menu) => menu.addOns)
  menu: MenuEntity;  // Which menus use this addon
  
  // ⚠️ Note: Relation defined but NEVER loaded in current code
}
```

#### **Complete Architecture:**
```
                    ┌─────────────┐
                    │add_on_entity│
                    └─────────────┘
                         ↑  ↑  ↑
                         │  │  │
        ┌────────────────┘  │  └────────────────┐
        │                   │                   │
┌───────────────┐  ┌────────────────┐  ┌────────────────┐
│menu_add_on    │  │cart_item       │  │order_item      │
│_entity        │  │_add_ons_entity │  │_addon_entity   │
│(junction)     │  │                │  │                │
└───────────────┘  └────────────────┘  └────────────────┘
        │
        ↓
┌───────────────┐
│  menu_entity  │
└───────────────┘
```

#### **Cardinality:**
- **1 Addon** → **Many Menus** (via junction) (0 to N)
- **1 Addon** → **Many Cart Item Addons** (0 to N)
- **1 Addon** → **Many Order Item Addons** (0 to N)

---

## 📦 **MODULE 3: MENU MODULE**

### **Table: menu_entity**

#### **Fields:**
```
┌─────────────────────────────────────────┐
│ menu_entity                             │
├─────────────────────────────────────────┤
│ • id (PK) - UUID                        │
│ • name - VARCHAR                        │
│ • description - VARCHAR                 │
│ • images - VARCHAR[]                    │
│ • details - JSONB                       │
│ • isBarItem - BOOLEAN                   │
│ • isAvailable - BOOLEAN                 │
│ • services - ENUM[]                     │
│ • price - NUMERIC(12,2)                 │
│ • discountedPrice - NUMERIC(12,2)       │
│ • businessId - VARCHAR (indexed)        │
│ • isSignature - BOOLEAN                 │
│ • allowAddOns - BOOLEAN                 │
│ • category_id (FK) → category           │
│ • createdAt - TIMESTAMP                 │
│ • updatedAt - TIMESTAMP                 │
│ • deletedAt - TIMESTAMP                 │
└─────────────────────────────────────────┘
```

#### **Foreign Keys (What it references):**
```
menu_entity.category_id → category.id
└─ Nullable: No (required)
└─ Purpose: Menu belongs to one category
└─ Eager Loading: Yes (always loaded)
```

#### **Referenced By (What references it):**
```
1. menu_add_on_entity.menu_id → menu_entity.id
   └─ Type: ManyToMany (via junction)
   └─ Purpose: Which addons available for this menu

2. menu_rating_entity.menu_id → menu_entity.id
   └─ Type: OneToMany
   └─ Purpose: Ratings for this menu

3. cart_item_entity.menu_id → menu_entity.id
   └─ Type: ManyToOne
   └─ Purpose: Menu items in carts

4. order_item_entity.menu_id → menu_entity.id
   └─ Type: ManyToOne
   └─ Purpose: Menu items in orders
```

#### **Relations in Code:**
```typescript
@Entity()
export class MenuEntity extends BaseEntity {
  // Foreign key relations
  @ManyToOne(() => CategoryEntity, (category) => category.menu, { eager: true })
  @JoinColumn()
  category: CategoryEntity;  // ✅ EAGER loaded (always fetched)
  
  // Many-to-many relations
  @JoinTable()
  @ManyToMany(() => AddOnEntity, (addons) => addons.menu)
  addOns: AddOnEntity[];  // Available addons
  
  // One-to-many relations
  @OneToMany(() => MenuRatingEntity, (menuRating) => menuRating.menu)
  menuRating: MenuRatingEntity;  // Ratings for this menu
}
```

#### **Complete Architecture:**
```
┌─────────────┐
│  category   │
└─────────────┘
       │
       │ ManyToOne (eager)
       ↓
┌─────────────┐         ┌─────────────┐
│menu_entity  │◄───────►│add_on_entity│
└─────────────┘         └─────────────┘
       │                (ManyToMany via junction)
       │
       ├──────────────┬──────────────┬──────────────┐
       │              │              │              │
       ↓              ↓              ↓              ↓
┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐
│menu_     │  │cart_item │  │order_item│  │menu_     │
│rating    │  │_entity   │  │_entity   │  │add_on    │
│_entity   │  │          │  │          │  │_entity   │
└──────────┘  └──────────┘  └──────────┘  └──────────┘
```

#### **Cardinality:**
- **1 Menu** → **1 Category** (required)
- **1 Menu** → **Many Addons** (via junction) (0 to N)
- **1 Menu** → **Many Ratings** (0 to N)
- **1 Menu** → **Many Cart Items** (0 to N)
- **1 Menu** → **Many Order Items** (0 to N)

---

## 📦 **MODULE 4: MENU RATING MODULE**

### **Table: menu_rating_entity**

#### **Fields:**
```
┌─────────────────────────────────────────┐
│ menu_rating_entity                      │
├─────────────────────────────────────────┤
│ • id (PK) - UUID                        │
│ • rating - FLOAT                        │
│ • comments - VARCHAR                    │
│ • ratedBy - VARCHAR                     │
│ • businessId - VARCHAR                  │
│ • menu_id (FK) → menu_entity            │
│ • createdAt - TIMESTAMP                 │
│ • updatedAt - TIMESTAMP                 │
│ • deletedAt - TIMESTAMP                 │
└─────────────────────────────────────────┘
```

#### **Foreign Keys (What it references):**
```
menu_rating_entity.menu_id → menu_entity.id
└─ Nullable: No (required)
└─ Purpose: Rating belongs to one menu
```

#### **Referenced By (What references it):**
```
NONE - No other tables reference this
```

#### **Relations in Code:**
```typescript
@Entity()
export class MenuRatingEntity extends BaseEntity {
  @ManyToOne(() => MenuEntity, (menu) => menu.menuRating)
  @JoinColumn()
  menu: MenuEntity;  // Which menu this rating is for
}
```

#### **Complete Architecture:**
```
┌─────────────┐
│menu_entity  │
└─────────────┘
       │
       │ OneToMany
       ↓
┌─────────────┐
│menu_rating  │
│_entity      │
└─────────────┘
```

#### **Cardinality:**
- **1 Menu** → **Many Ratings** (0 to N)
- **1 Rating** → **1 Menu** (required)

---

## 📦 **MODULE 5: CART MODULE**

### **Tables: cart_entity, cart_item_entity, cart_item_add_ons_entity**

#### **Table 1: cart_entity**

**Fields:**
```
┌─────────────────────────────────────────┐
│ cart_entity                             │
├─────────────────────────────────────────┤
│ • id (PK) - UUID                        │
│ • userId - VARCHAR                      │
│ • createdAt - TIMESTAMP                 │
│ • updatedAt - TIMESTAMP                 │
│ • deletedAt - TIMESTAMP                 │
└─────────────────────────────────────────┘
```

**Foreign Keys:** NONE

**Referenced By:**
```
cart_item_entity.cart_id → cart_entity.id
└─ Type: OneToMany
└─ Cascade: DELETE (deleting cart deletes all items)
```

**Relations:**
```typescript
@Entity()
export class CartEntity extends BaseEntity {
  @OneToMany(() => CartItemEntity, (cartItem) => cartItem.cart)
  cartItems: CartItemEntity[];  // Items in this cart
}
```

---

#### **Table 2: cart_item_entity**

**Fields:**
```
┌─────────────────────────────────────────┐
│ cart_item_entity                        │
├─────────────────────────────────────────┤
│ • id (PK) - UUID                        │
│ • quantity - INTEGER                    │
│ • cart_id (FK) → cart_entity            │
│ • menu_id (FK) → menu_entity            │
│ • createdAt - TIMESTAMP                 │
│ • updatedAt - TIMESTAMP                 │
│ • deletedAt - TIMESTAMP                 │
└─────────────────────────────────────────┘
```

**Foreign Keys:**
```
1. cart_item_entity.cart_id → cart_entity.id
   └─ Nullable: No (required)
   └─ Cascade: DELETE
   └─ Purpose: Item belongs to one cart

2. cart_item_entity.menu_id → menu_entity.id
   └─ Nullable: No (required)
   └─ Purpose: Item references one menu
```

**Referenced By:**
```
cart_item_add_ons_entity.cart_item_id → cart_item_entity.id
└─ Type: OneToMany
└─ Purpose: Addon selections for this item
```

**Relations:**
```typescript
@Entity()
export class CartItemEntity extends BaseEntity {
  @ManyToOne(() => CartEntity, (cart) => cart.cartItems, { onDelete: "CASCADE" })
  @JoinColumn()
  cart: CartEntity;  // Which cart this item belongs to
  
  @ManyToOne(() => MenuEntity)
  @JoinColumn()
  menu: MenuEntity;  // Which menu item this is
  
  @OneToMany(() => CartItemAddOnsEntity, (addon) => addon.cartItem)
  addOns: CartItemAddOnsEntity[];  // Addon selections
}
```

---

#### **Table 3: cart_item_add_ons_entity**

**Fields:**
```
┌─────────────────────────────────────────┐
│ cart_item_add_ons_entity                │
├─────────────────────────────────────────┤
│ • id (PK) - UUID                        │
│ • quantity - INTEGER                    │
│ • cart_item_id (FK) → cart_item_entity  │
│ • menu_add_on_id (FK) → add_on_entity   │
│ • createdAt - TIMESTAMP                 │
│ • updatedAt - TIMESTAMP                 │
│ • deletedAt - TIMESTAMP                 │
└─────────────────────────────────────────┘
```

**Foreign Keys:**
```
1. cart_item_add_ons_entity.cart_item_id → cart_item_entity.id
   └─ Nullable: No (required)
   └─ Purpose: Addon belongs to one cart item

2. cart_item_add_ons_entity.menu_add_on_id → add_on_entity.id
   └─ Nullable: No (required)
   └─ Purpose: References which addon
```

**Referenced By:** NONE

**Relations:**
```typescript
@Entity()
export class CartItemAddOnsEntity extends BaseEntity {
  @ManyToOne(() => CartItemEntity, (cartItem) => cartItem.addOns)
  cartItem: CartItemEntity;  // Which cart item
  
  @ManyToOne(() => AddOnEntity)
  @JoinColumn()
  menuAddOn: AddOnEntity;  // Which addon
}
```

---

#### **Complete Cart Architecture:**
```
┌─────────────┐
│cart_entity  │
└─────────────┘
       │
       │ OneToMany (CASCADE DELETE)
       ↓
┌─────────────┐         ┌─────────────┐
│cart_item    │────────►│menu_entity  │
│_entity      │         └─────────────┘
└─────────────┘         (ManyToOne)
       │
       │ OneToMany
       ↓
┌─────────────┐         ┌─────────────┐
│cart_item    │────────►│add_on_entity│
│_add_ons     │         └─────────────┘
│_entity      │         (ManyToOne)
└─────────────┘
```

#### **Cardinality:**
- **1 Cart** → **Many Cart Items** (0 to N)
- **1 Cart Item** → **1 Cart** (required)
- **1 Cart Item** → **1 Menu** (required)
- **1 Cart Item** → **Many Cart Item Addons** (0 to N)
- **1 Cart Item Addon** → **1 Cart Item** (required)
- **1 Cart Item Addon** → **1 Addon** (required)

---

## 📦 **MODULE 6: ORDER MODULE**

### **Tables: order_entity, order_item_entity, order_item_addon_entity, order_status_entity**

#### **Table 1: order_entity**

**Fields:**
```
┌─────────────────────────────────────────┐
│ order_entity                            │
├─────────────────────────────────────────┤
│ • id (PK) - UUID                        │
│ • userId - VARCHAR                      │
│ • businessId - VARCHAR                  │
│ • totalAmount - FLOAT                   │
│ • remarks - VARCHAR                     │
│ • createdAt - TIMESTAMP                 │
│ • updatedAt - TIMESTAMP                 │
│ • deletedAt - TIMESTAMP                 │
└─────────────────────────────────────────┘
```

**Foreign Keys:** NONE

**Referenced By:**
```
1. order_item_entity.order_id → order_entity.id
   └─ Type: OneToMany
   └─ Purpose: Items in this order

2. order_status_entity.order_id → order_entity.id
   └─ Type: OneToMany
   └─ Purpose: Status history for this order
```

**Relations:**
```typescript
@Entity()
export class OrderEntity extends BaseEntity {
  @OneToMany(() => OrderItemEntity, (orderItem) => orderItem.order)
  orderItems: OrderItemEntity[];  // Items in order
  
  @OneToMany(() => OrderStatusEntity, (status) => status.order)
  orderStatus: OrderStatusEntity[];  // Status history
}
```

---

#### **Table 2: order_item_entity**

**Fields:**
```
┌─────────────────────────────────────────┐
│ order_item_entity                       │
├─────────────────────────────────────────┤
│ • id (PK) - UUID                        │
│ • quantity - INTEGER                    │
│ • price - NUMERIC (snapshot!)           │
│ • order_id (FK) → order_entity          │
│ • menu_id (FK) → menu_entity            │
│ • createdAt - TIMESTAMP                 │
│ • updatedAt - TIMESTAMP                 │
│ • deletedAt - TIMESTAMP                 │
└─────────────────────────────────────────┘
```

**Foreign Keys:**
```
1. order_item_entity.order_id → order_entity.id
   └─ Nullable: No (required)
   └─ Purpose: Item belongs to one order

2. order_item_entity.menu_id → menu_entity.id
   └─ Nullable: No (required)
   └─ Purpose: References which menu item
```

**Referenced By:**
```
order_item_addon_entity.order_item_id → order_item_entity.id
└─ Type: OneToMany
└─ Purpose: Addon selections for this order item
```

**Relations:**
```typescript
@Entity()
export class OrderItemEntity extends BaseEntity {
  @ManyToOne(() => OrderEntity, (order) => order.orderItems)
  @JoinColumn()
  order: OrderEntity;  // Which order
  
  @ManyToOne(() => MenuEntity)
  @JoinColumn()
  menu: MenuEntity;  // Which menu item
  
  @OneToMany(() => OrderItemAddonEntity, (addon) => addon.orderItem)
  addons?: OrderItemAddonEntity[];  // Addon selections
}
```

---

#### **Table 3: order_item_addon_entity**

**Fields:**
```
┌─────────────────────────────────────────┐
│ order_item_addon_entity                 │
├─────────────────────────────────────────┤
│ • id (PK) - UUID                        │
│ • quantity - INTEGER                    │
│ • price - NUMERIC (snapshot!)           │
│ • order_item_id (FK) → order_item       │
│ • addon_id (FK) → add_on_entity         │
│ • createdAt - TIMESTAMP                 │
│ • updatedAt - TIMESTAMP                 │
│ • deletedAt - TIMESTAMP                 │
└─────────────────────────────────────────┘
```

**Foreign Keys:**
```
1. order_item_addon_entity.order_item_id → order_item_entity.id
   └─ Nullable: No (required)
   └─ Purpose: Addon belongs to one order item

2. order_item_addon_entity.addon_id → add_on_entity.id
   └─ Nullable: No (required)
   └─ Purpose: References which addon
```

**Referenced By:** NONE

**Relations:**
```typescript
@Entity()
export class OrderItemAddonEntity extends BaseEntity {
  @ManyToOne(() => OrderItemEntity, (orderItem) => orderItem.addons)
  @JoinColumn()
  orderItem: OrderItemEntity;  // Which order item
  
  @ManyToOne(() => AddOnEntity)
  @JoinColumn()
  addon: AddOnEntity;  // Which addon
}
```

---

#### **Table 4: order_status_entity**

**Fields:**
```
┌─────────────────────────────────────────┐
│ order_status_entity                     │
├─────────────────────────────────────────┤
│ • id (PK) - UUID                        │
│ • order_id (FK) → order_entity          │
│ • status - ENUM                         │
│ • updatedBy - VARCHAR                   │
│ • remarks - VARCHAR                     │
│ • createdAt - TIMESTAMP                 │
│ • updatedAt - TIMESTAMP                 │
│ • deletedAt - TIMESTAMP                 │
└─────────────────────────────────────────┘
```

**Foreign Keys:**
```
order_status_entity.order_id → order_entity.id
└─ Nullable: No (required)
└─ Purpose: Status belongs to one order
```

**Referenced By:** NONE

**Relations:**
```typescript
@Entity()
export class OrderStatusEntity extends BaseEntity {
  @ManyToOne(() => OrderEntity, (order) => order.orderStatus)
  @JoinColumn()
  order: OrderEntity;  // Which order
}
```

---

#### **Complete Order Architecture:**
```
┌─────────────┐
│order_entity │
└─────────────┘
       │    │
       │    │ OneToMany
       │    ↓
       │  ┌─────────────┐
       │  │order_status │
       │  │_entity      │
       │  └─────────────┘
       │
       │ OneToMany
       ↓
┌─────────────┐         ┌─────────────┐
│order_item   │────────►│menu_entity  │
│_entity      │         └─────────────┘
└─────────────┘         (ManyToOne)
       │
       │ OneToMany
       ↓
┌─────────────┐         ┌─────────────┐
│order_item   │────────►│add_on_entity│
│_addon_entity│         └─────────────┘
└─────────────┘         (ManyToOne)
```

#### **Cardinality:**
- **1 Order** → **Many Order Items** (1 to N)
- **1 Order** → **Many Order Statuses** (1 to N)
- **1 Order Item** → **1 Order** (required)
- **1 Order Item** → **1 Menu** (required)
- **1 Order Item** → **Many Order Item Addons** (0 to N)
- **1 Order Item Addon** → **1 Order Item** (required)
- **1 Order Item Addon** → **1 Addon** (required)
- **1 Order Status** → **1 Order** (required)

---

## 📊 **COMPLETE FOREIGN KEY SUMMARY**

| Table | Foreign Keys | References |
|-------|-------------|------------|
| **category** | parent_id | category.id (self) |
| **add_on_entity** | NONE | - |
| **menu_entity** | category_id | category.id |
| **menu_add_on_entity** | menu_id, add_on_id | menu_entity.id, add_on_entity.id |
| **menu_rating_entity** | menu_id | menu_entity.id |
| **cart_entity** | NONE | - |
| **cart_item_entity** | cart_id, menu_id | cart_entity.id, menu_entity.id |
| **cart_item_add_ons_entity** | cart_item_id, menu_add_on_id | cart_item_entity.id, add_on_entity.id |
| **order_entity** | NONE | - |
| **order_item_entity** | order_id, menu_id | order_entity.id, menu_entity.id |
| **order_item_addon_entity** | order_item_id, addon_id | order_item_entity.id, add_on_entity.id |
| **order_status_entity** | order_id | order_entity.id |

---

## 🎯 **MODULE DEPENDENCY HIERARCHY**

```
Level 0 (No Dependencies):
├─ category (can reference self)
├─ add_on_entity
├─ cart_entity
└─ order_entity

Level 1 (Depends on Level 0):
├─ menu_entity (depends on category)
├─ cart_item_entity (depends on cart_entity, menu_entity)
└─ order_item_entity (depends on order_entity, menu_entity)

Level 2 (Depends on Level 1):
├─ menu_add_on_entity (depends on menu_entity, add_on_entity)
├─ menu_rating_entity (depends on menu_entity)
├─ cart_item_add_ons_entity (depends on cart_item_entity, add_on_entity)
├─ order_item_addon_entity (depends on order_item_entity, add_on_entity)
└─ order_status_entity (depends on order_entity)
```

---

This breakdown shows the complete database architecture for each module with all foreign keys, relations, and dependencies!
