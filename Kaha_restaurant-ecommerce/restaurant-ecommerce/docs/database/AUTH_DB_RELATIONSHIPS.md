# AUTH Database Relationships - Complete Analysis

## 🔗 How AUTH_DB Connects to All Other Databases

Your system uses **AUTH_DB as the central hub** that connects all other databases. Here's how:

---

## 📊 Architecture Diagram

```
┌──────────────────────────────────┐
│         AUTH_DB                  │
│  ┌────────────────────────────┐ │
│  │ user (id, email, role...)  │ │
│  │ business (id, name...)     │ │
│  │ business_user (M:N)        │ │
│  └────────────────────────────┘ │
└──────────────────────────────────┘
      │         │         │         │
      │         │         │         │
      ▼         ▼         ▼         ▼
  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐
  │MENU_DB │ │CART_DB │ │ORDER_DB│ │CAT_DB  │
  └────────┘ └────────┘ └────────┘ └────────┘
```

---

## 🔑 Foreign Key Relationships

### **1. user.id references (Used by all DBs)**

```typescript
// From your entity files:

// CART_DB - Uses user.id
CartEntity:
  userId: UUID → references user.id from AUTH_DB

// ORDER_DB - Uses user.id  
OrderEntity:
  userId: UUID → references user.id from AUTH_DB

// MENU_DB - Uses user.id
MenuRatingEntity:
  ratedBy: UUID → references user.id from AUTH_DB

// ORDER_DB - Uses user.id
OrderStatusEntity:
  updatedBy: UUID → references user.id from AUTH_DB
```

### **2. business.id references (Used by all DBs)**

```typescript
// MENU_DB - Uses business.id
CategoryEntity:
  businessId: UUID → references business.id from AUTH_DB

MenuEntity:
  businessId: UUID → references business.id from AUTH_DB

MenuRatingEntity:
  businessId: UUID → references business.id from AUTH_DB

// ORDER_DB - Uses business.id
OrderEntity:
  businessId: UUID → references business.id from AUTH_DB
```

### **3. business_user M:N junction**

```typescript
// Links users to businesses with roles
BusinessUserEntity:
  user_id: UUID → references user.id from AUTH_DB
  business_id: UUID → references business.id from AUTH_DB
  role: "STAFF" | "MANAGER" | "ADMIN"
```

---

## 🗺️ Complete Relationship Map

```
┌─────────────────────────────────────────────────────────────────────┐
│                        AUTH_DB                                      │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  USER TABLE                                                         │
│  ├─ id (UUID) [PK]                                                 │
│  ├─ email, password, firstName, lastName                           │
│  ├─ role: CUSTOMER | STAFF | ADMIN                                 │
│  └─ isActive, lastLogin, createdAt, etc.                          │
│                                                                      │
│  BUSINESS TABLE                                                     │
│  ├─ id (UUID) [PK]                                                 │
│  ├─ name, email, phone, address                                    │
│  ├─ city, state, zipCode, country                                  │
│  ├─ isActive, subscriptionType                                     │
│  └─ createdAt, updatedAt, deletedAt                               │
│                                                                      │
│  BUSINESS_USER TABLE (M:N Junction)                                │
│  ├─ business_id (UUID) → business.id                              │
│  ├─ user_id (UUID) → user.id                                      │
│  ├─ role (STAFF, MANAGER, ADMIN per business)                    │
│  └─ createdAt, updatedAt                                          │
│                                                                      │
└──────┬──────────┬──────────┬──────────┬──────────────────────────────┘
       │          │          │          │
       │          │          │          │
       ▼          ▼          ▼          ▼
  ┌────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐
  │MENU_DB │ │CART_DB   │ │ORDER_DB  │ │CATEGORY_ │
  └────────┘ └──────────┘ └──────────┘ │DB        │
       │          │          │          └──────────┘
       │          │          │                │
       ├─ category      ├─ cart_entity   ├─ order_entity
       │   businessId   │   userId       │   userId
       │   (auth_db)    │   (auth_db)    │   (auth_db)
       │                │                │   businessId
       ├─ menu_entity   └─ cart_item...  │   (auth_db)
       │   businessId                    │
       │   (auth_db)    ┌─────────────┐  ├─ order_status
       │                │  USER ROLE  │  │   updatedBy
       ├─ menu_rating   │  CHECK      │  │   (auth_db)
       │   ratedBy      └─────────────┘  │
       │   (auth_db)       CUSTOMER:     └─ order_item...
       │   businessId      └─ Browse
       │   (auth_db)       └─ Rate items
       │                   └─ Add to cart
       │     STAFF:
       └─ add_on_entity └─ Manage menu
                        └─ Update orders
```

---

## 💾 How Data Flows Through AUTH_DB

### **Scenario 1: Customer Registration to Order**

```
STEP 1: User Registration (AUTH_DB)
├─ User fills form (email, password, name)
├─ AUTH SERVICE stores in user table
├─ user.id = abc-123, role = "CUSTOMER"
└─ user.isActive = true

STEP 2: Browse Menu (MENU_DB)
├─ MENU SERVICE queries:
│  SELECT * FROM menu_entity 
│  WHERE businessId = (any business)
├─ Returns menu items
└─ USER references come from AUTH_DB (implicit)

STEP 3: Add to Cart (CART_DB)
├─ CART SERVICE checks:
│  ├─ Verify user exists: SELECT * FROM user WHERE id = 'abc-123'
│  └─ Location: AUTH_DB (cross-database call)
├─ Creates cart_entity
│  └─ userId = 'abc-123' (links to AUTH_DB user)
└─ Returns cart

STEP 4: Rate Item (MENU_DB)
├─ USER clicks "Rate" on menu item
├─ MENU SERVICE checks:
│  ├─ Verify user exists & active
│  ├─ Query: SELECT * FROM user WHERE id = 'abc-123'
│  └─ Location: AUTH_DB (cross-database call)
├─ Creates menu_rating_entity
│  ├─ ratedBy = 'abc-123' (links to AUTH_DB user)
│  └─ businessId = (links to AUTH_DB business)
└─ Saves rating

STEP 5: Checkout → Order (ORDER_DB)
├─ CART SERVICE publishes: ORDER_CREATED event
├─ ORDER SERVICE:
│  ├─ Verify user: SELECT FROM user WHERE id = 'abc-123' (AUTH_DB)
│  ├─ Verify business: SELECT FROM business WHERE id = 'xyz-789' (AUTH_DB)
│  ├─ Creates order_entity
│  │  ├─ userId = 'abc-123' (links to AUTH_DB)
│  │  └─ businessId = 'xyz-789' (links to AUTH_DB)
│  └─ Status = PENDING
└─ Order created
```

### **Scenario 2: Staff Operations**

```
STEP 1: Staff Login (AUTH_DB)
├─ Staff enters email/password
├─ AUTH SERVICE verifies in user table
├─ user.id = staff-456, role = "STAFF"
├─ Check business_user junction:
│  └─ SELECT * FROM business_user 
│     WHERE user_id = 'staff-456'
│     → Returns: [businessId = 'pizza-palace-1']
└─ Staff is assigned to "Pizza Palace"

STEP 2: Manage Menu (MENU_DB)
├─ Staff wants to add new menu item
├─ MENU SERVICE queries:
│  ├─ Verify staff exists:
│  │  SELECT FROM user WHERE id = 'staff-456' (AUTH_DB)
│  ├─ Verify staff access to business:
│  │  SELECT FROM business_user 
│  │  WHERE user_id = 'staff-456' 
│  │  AND business_id = 'pizza-palace-1' (AUTH_DB)
│  └─ Access: GRANTED
├─ Creates menu_entity
│  └─ businessId = 'pizza-palace-1' (links to AUTH_DB business)
└─ Menu added to "Pizza Palace"

STEP 3: Update Order Status (ORDER_DB)
├─ Staff marks order as CONFIRMED
├─ ORDER SERVICE:
│  ├─ Verify staff:
│  │  SELECT FROM user WHERE id = 'staff-456' (AUTH_DB)
│  ├─ Verify authorization:
│  │  SELECT FROM business_user 
│  │  WHERE user_id = 'staff-456' 
│  │  AND role IN ['STAFF', 'MANAGER', 'ADMIN'] (AUTH_DB)
│  └─ Authorization: OK
├─ Creates order_status_entity
│  ├─ updatedBy = 'staff-456' (links to AUTH_DB user)
│  └─ status = 'CONFIRMED'
└─ Status updated, staff name recorded
```

---

## 🔐 Database Permission Model

```
┌──────────────────────────────────────────────────────┐
│           ROLE-BASED ACCESS CONTROL                  │
├──────────────────────────────────────────────────────┤

CUSTOMER (User role = "CUSTOMER")
├─ Can query: categories, menu_entity (public)
├─ Can create: cart_entity (own only)
├─ Can create: menu_rating_entity (own only)
├─ Can create: order_entity (own only)
├─ Cannot: modify menu, manage business
└─ Auth check: Lookup role in AUTH_DB user table

STAFF (business_user.role = "STAFF")
├─ Can query: menu_entity (their business only)
├─ Can query: order_entity (their business only)
├─ Can create: order_status_entity
├─ Can update: category, menu_entity (their business)
├─ Cannot: modify other business items
├─ Cannot: delete menu_entity
└─ Auth check: Lookup in AUTH_DB business_user junction

MANAGER (business_user.role = "MANAGER")
├─ Can do everything STAFF can do
├─ Can delete: menu_entity (their business)
├─ Can manage: staff (business_user table)
├─ Can view: business analytics
└─ Auth check: Lookup in AUTH_DB business_user junction

ADMIN (User role = "ADMIN")
├─ Full system access
├─ Can manage all businesses
├─ Can manage all users
├─ Can view all data
└─ Auth check: Check role in AUTH_DB user table
```

---

## 📝 Code Examples from Your Repository

### **From your actual entities:**

```typescript
// CART_DB - CartEntity references AUTH_DB user
@Entity()
export class CartEntity extends BaseEntity {
  @Column()
  public userId: string;  // ← Points to user.id in AUTH_DB
  
  @OneToMany(() => CartItemEntity, (cartItem) => cartItem.cart)
  public cartItems: CartItemEntity[];
}

// ORDER_DB - OrderEntity references AUTH_DB
@Entity()
export class OrderEntity extends BaseEntity {
  @Column()
  userId: string;  // ← Points to user.id in AUTH_DB
  
  @Column()
  businessId: string;  // ← Points to business.id in AUTH_DB
  
  @Column({ type: "float", default: 0 })
  totalAmount?: number;
  
  @OneToMany(() => OrderItemEntity, (orderItem) => orderItem.order)
  orderItems: OrderItemEntity[];
  
  @OneToMany(() => OrderStatusEntity, (status) => status.order)
  orderStatus: OrderStatusEntity[];
}

// MENU_DB - MenuRatingEntity references AUTH_DB
@Entity()
export class MenuRatingEntity extends BaseEntity {
  @Column()
  rating: number;
  
  @Column()
  comments: string;
  
  @Column()
  ratedBy: string;  // ← Points to user.id in AUTH_DB
  
  @Column()
  businessId: string;  // ← Points to business.id in AUTH_DB
  
  @ManyToOne(() => MenuEntity, (menu) => menu.menuRating)
  @JoinColumn()
  menu: MenuEntity;
}

// MENU_DB - MenuEntity references AUTH_DB
@Entity()
export class MenuEntity extends BaseEntity {
  @Column()
  name: string;
  
  @Column()
  businessId: string;  // ← Points to business.id in AUTH_DB
  
  @ManyToOne(() => CategoryEntity, (category) => category.menu)
  @JoinColumn()
  category: CategoryEntity;
  
  @OneToMany(() => MenuRatingEntity, (menuRating) => menuRating.menu)
  menuRating: MenuRatingEntity;
}

// ORDER_DB - OrderStatusEntity references AUTH_DB
@Entity()
export class OrderStatusEntity extends BaseEntity {
  @ManyToOne(() => OrderEntity, (order) => order.orderStatus)
  @JoinColumn()
  order: OrderEntity;
  
  @Column({
    type: "enum",
    enum: OrderStatusEnum,
    default: OrderStatusEnum.PENDING,
  })
  status: OrderStatusEnum;
  
  @Column()
  updatedBy: string;  // ← Points to user.id in AUTH_DB (staff member)
  
  @Column({ nullable: true })
  remarks?: string;
}
```

---

## 🌐 Multi-Tenancy Implementation (via AUTH_DB)

```
AUTH_DB Makes Your System Multi-Tenant:

Business A ("Pizza Palace")
├─ business.id = 'pizza-palace-1'
├─ Staff: John (user.id = 'user-123'), Mike (user.id = 'user-124')
│  └─ Linked via business_user table
├─ Categories: Italian, Fast Food
├─ Menu Items: Margherita, Pepperoni, Caesar Salad
├─ Orders: 150 orders this month
└─ Ratings: 4.5⭐ average

Business B ("Burger King")  
├─ business.id = 'burger-king-1'
├─ Staff: Sarah (user.id = 'user-200'), David (user.id = 'user-201')
│  └─ Linked via business_user table
├─ Categories: Burgers, Drinks, Sides
├─ Menu Items: Classic Burger, Chicken Burger
├─ Orders: 200 orders this month
└─ Ratings: 4.7⭐ average

SAME DATABASE CONTAINS BOTH:
- But each business's data is isolated via businessId
- Staff can only see their business's data
- Customers can browse both but orders are per-business
```

---

## 🔗 Dependency Chain

```
When a service needs data, it checks AUTH_DB first:

MENU SERVICE needs to create menu_entity
├─ Check: Does business exist?
│  └─ Query AUTH_DB: SELECT FROM business WHERE id = 'xyz'
├─ Check: Does staff user exist?
│  └─ Query AUTH_DB: SELECT FROM user WHERE id = 'user-123'
├─ Check: Does staff have permission?
│  └─ Query AUTH_DB: SELECT FROM business_user 
│     WHERE business_id = 'xyz' AND user_id = 'user-123'
└─ If all checks pass → Create menu_entity in MENU_DB

CART SERVICE needs to create cart_entity
├─ Check: Does customer exist?
│  └─ Query AUTH_DB: SELECT FROM user WHERE id = 'cust-456'
├─ Check: Is customer active?
│  └─ Check user.isActive in AUTH_DB
└─ If valid → Create cart_entity in CART_DB

ORDER SERVICE needs to create order_entity
├─ Check: Does customer exist?
│  └─ Query AUTH_DB: SELECT FROM user WHERE id = 'cust-456'
├─ Check: Does business exist?
│  └─ Query AUTH_DB: SELECT FROM business WHERE id = 'xyz'
├─ Verify: Customer is not blocked by business
│  └─ Query AUTH_DB for blacklist (if applicable)
└─ If valid → Create order_entity in ORDER_DB
```

---

## 📊 Summary Table

| Database | Tables | References AUTH_DB | Purpose |
|----------|--------|-------------------|---------|
| **AUTH_DB** | user, business, business_user | - | Central auth hub |
| **MENU_DB** | menu_entity, category, add_on_entity, menu_rating_entity | businessId (business), ratedBy (user) | Menu management |
| **CATEGORY_DB** | category | businessId (business) | Category management |
| **CART_DB** | cart_entity, cart_item_entity, cart_item_add_ons_entity | userId (user) | Shopping carts |
| **ORDER_DB** | order_entity, order_item_entity, order_status_entity | userId (user), businessId (business), updatedBy (user) | Order management |

---

## 🎯 Key Takeaways

1. **AUTH_DB is the Source of Truth** for:
   - User identities (who is ordering)
   - Business identities (who is serving)
   - Role/permissions (who can do what)

2. **All other DBs reference AUTH_DB** via:
   - `userId` → Links to user.id
   - `businessId` → Links to business.id
   - `updatedBy` → Links to staff user.id

3. **No Cross-Database Transactions**:
   - If AUTH_DB is down, some operations may fail
   - But each service's core functionality remains isolated

4. **Multi-Tenancy is Achieved Through**:
   - `businessId` field in all service databases
   - `business_user` junction in AUTH_DB for staff assignment
   - Role-based access control via AUTH_DB roles

5. **Data Validation Flow**:
   - Always check AUTH_DB first (user/business exists?)
   - Then perform operation in respective service database
   - Event-driven communication via message queue for async operations
