# Restaurant E-Commerce Database Architecture - Complete Breakdown

## 🎯 **THE BIG PICTURE**

Think of this database like a **real restaurant business** with 3 main areas:

```
┌─────────────────────────────────────────────────────────────┐
│                    RESTAURANT BUSINESS                       │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  1. MENU MANAGEMENT (What we sell)                          │
│     ├─ Categories (Pizza, Burgers, Salads)                  │
│     ├─ Menu Items (Margherita Pizza, Classic Burger)        │
│     ├─ Addons (Extra Cheese, Bacon)                         │
│     └─ Ratings (Customer reviews)                           │
│                                                              │
│  2. SHOPPING EXPERIENCE (Customer ordering)                  │
│     ├─ Cart (Shopping basket)                               │
│     ├─ Cart Items (Items in basket)                         │
│     └─ Cart Item Addons (Customizations)                    │
│                                                              │
│  3. ORDER MANAGEMENT (After checkout)                        │
│     ├─ Orders (Completed purchases)                         │
│     ├─ Order Items (What was ordered)                       │
│     ├─ Order Item Addons (Customizations in order)          │
│     └─ Order Status (Tracking: Pending → Delivered)         │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## 📚 **PART 1: MENU MANAGEMENT (The Restaurant's Catalog)**

### **1.1 CategoryEntity - Organizing the Menu**

```
Real-World Analogy: Restaurant Menu Sections

┌─────────────────────────────────────────┐
│         RESTAURANT MENU                 │
├─────────────────────────────────────────┤
│                                         │
│  🍕 PIZZA                               │  ← Category
│     ├─ Margherita                      │
│     ├─ Pepperoni                       │
│     └─ Veggie                          │
│                                         │
│  🍔 BURGERS                             │  ← Category
│     ├─ Classic                         │
│     ├─ Cheese                          │
│     └─ Bacon                           │
│                                         │
│  🥗 SALADS                              │  ← Category
│     ├─ Caesar                          │
│     └─ Greek                           │
│                                         │
└─────────────────────────────────────────┘
```

**Database Structure:**
```sql
category
├─ id (unique identifier)
├─ name ("Pizza", "Burgers", "Salads")
├─ description ("Delicious Italian pizzas")
├─ icon (image for the category)
├─ isActive (can turn on/off)
├─ position (display order: 1, 2, 3)
├─ businessId (which restaurant owns this)
└─ parent_id (for nested categories)
```

**Special Feature: Nested Categories (Hierarchy)**
```
Food
├─ Pizza
│  ├─ Vegetarian Pizza
│  └─ Meat Pizza
├─ Pasta
│  ├─ Red Sauce
│  └─ White Sauce
└─ Salads
   ├─ Green Salads
   └─ Protein Salads
```

**Why it matters:**
- Organizes menu items logically
- Customers can browse by category
- Can create sub-categories for better organization

---

### **1.2 AddOnEntity - Extra Items/Toppings**

```
Real-World Analogy: Customization Options

At a Pizza Shop:
┌─────────────────────────────────────────┐
│  "Would you like to add any extras?"    │
├─────────────────────────────────────────┤
│  ☐ Extra Cheese        +$2.00           │
│  ☐ Pepperoni          +$2.50           │
│  ☐ Mushrooms          +$1.50           │
│  ☐ Olives             +$1.50           │
│  ☐ Bacon              +$3.00           │
└─────────────────────────────────────────┘
```

**Database Structure:**
```sql
add_on_entity
├─ id (unique identifier)
├─ name ("Extra Cheese", "Bacon")
├─ price (2.00, 3.00)
├─ description ("Double portion of mozzarella")
└─ coverImg (image of the addon)
```

**Key Concept: Reusable Across Menu Items**
```
"Extra Cheese" addon can be added to:
├─ Margherita Pizza
├─ Pepperoni Pizza
├─ Classic Burger
├─ Cheese Burger
└─ Caesar Salad

One addon → Many menu items (Reusable!)
```

**Why it matters:**
- Increases revenue (upselling)
- Customers can customize orders
- Same addon works for multiple items

---

### **1.3 MenuEntity - The Actual Menu Items**

```
Real-World Analogy: Items on the Menu

┌─────────────────────────────────────────┐
│  Margherita Pizza                       │
│  ─────────────────────────────────      │
│  Fresh mozzarella, tomato sauce,        │
│  basil on thin crust                    │
│                                         │
│  Price: $12.00                          │
│  Category: Pizza                        │
│  Available: Yes                         │
│  Signature Item: Yes ⭐                 │
│                                         │
│  Customize with:                        │
│  ☐ Extra Cheese (+$2.00)                │
│  ☐ Pepperoni (+$2.50)                   │
│  ☐ Mushrooms (+$1.50)                   │
└─────────────────────────────────────────┘
```

**Database Structure:**
```sql
menu_entity
├─ id (unique identifier)
├─ name ("Margherita Pizza")
├─ description ("Fresh mozzarella...")
├─ images (array of photos)
├─ details (JSON: ingredients, allergens, etc.)
├─ price (12.00)
├─ discountedPrice (10.00 - if on sale)
├─ isAvailable (in stock?)
├─ isSignature (featured item?)
├─ isBarItem (is it a drink?)
├─ allowAddOns (can customize?)
├─ services (DINE_IN, TAKEAWAY, DELIVERY)
├─ businessId (which restaurant)
└─ category_id (belongs to which category)
```

**Relationships:**
```
MenuEntity connects to:
├─ 1 Category (belongs to one category)
├─ Many Addons (can have multiple addons)
├─ Many Ratings (customers can rate it)
├─ Many Cart Items (in multiple carts)
└─ Many Order Items (order history)
```

**Why it matters:**
- The core product catalog
- Contains all product information
- Flexible pricing and availability
- Supports multiple service types

---

### **1.4 menu_add_on_entity - Junction Table**

```
Real-World Analogy: Menu Item ↔ Addon Associations

Problem: How to connect menus and addons?
- One menu can have many addons
- One addon can be on many menus

Solution: Junction Table!

┌─────────────────────────────────────────┐
│  menu_add_on_entity (Junction Table)    │
├─────────────────────────────────────────┤
│  menu_id          │  add_on_id          │
├───────────────────┼─────────────────────┤
│  Margherita Pizza │  Extra Cheese       │
│  Margherita Pizza │  Pepperoni          │
│  Margherita Pizza │  Mushrooms          │
│  Pepperoni Pizza  │  Extra Cheese       │
│  Pepperoni Pizza  │  Pepperoni          │
│  Classic Burger   │  Extra Cheese       │
│  Classic Burger   │  Bacon              │
└─────────────────────────────────────────┘
```

**Why it matters:**
- Enables many-to-many relationships
- Flexible addon associations
- Easy to add/remove addons from menus

---

### **1.5 MenuRatingEntity - Customer Reviews**

```
Real-World Analogy: Product Reviews

┌─────────────────────────────────────────┐
│  Margherita Pizza                       │
│  ★★★★★ 4.5/5 (127 reviews)             │
├─────────────────────────────────────────┤
│  ★★★★★ John - "Best pizza ever!"       │
│  ★★★★☆ Sarah - "Very good, a bit salty"│
│  ★★★★★ Mike - "Love it!"                │
│  ★★★☆☆ Lisa - "Decent but overpriced"  │
└─────────────────────────────────────────┘
```

**Database Structure:**
```sql
menu_rating_entity
├─ id (unique identifier)
├─ rating (1-5 stars)
├─ comments ("Best pizza ever!")
├─ ratedBy (customer ID)
├─ businessId (which restaurant)
└─ menu_id (which menu item)
```

**Why it matters:**
- Social proof for customers
- Helps improve menu items
- Increases trust and sales

---

## 🛒 **PART 2: SHOPPING EXPERIENCE (Customer Journey)**

### **2.1 CartEntity - The Shopping Cart**

```
Real-World Analogy: Shopping Basket

┌─────────────────────────────────────────┐
│  🛒 John's Shopping Cart                │
│  ─────────────────────────────────      │
│  (Empty container, holds items)         │
└─────────────────────────────────────────┘
```

**Database Structure:**
```sql
cart_entity
├─ id (cart-123)
└─ userId (john-1)
```

**Simple Purpose:**
- One cart per customer
- Just a container for cart items
- Links customer to their cart

---

### **2.2 CartItemEntity - Items in Cart**

```
Real-World Analogy: Items in Shopping Basket

┌─────────────────────────────────────────┐
│  🛒 John's Shopping Cart                │
├─────────────────────────────────────────┤
│  📦 Margherita Pizza                    │
│     Quantity: 2                         │
│     Price: $12.00 each                  │
│                                         │
│  📦 Classic Burger                      │
│     Quantity: 1                         │
│     Price: $8.00 each                   │
│                                         │
│  📦 Caesar Salad                        │
│     Quantity: 1                         │
│     Price: $7.00 each                   │
└─────────────────────────────────────────┘
```

**Database Structure:**
```sql
cart_item_entity
├─ id (item-1, item-2, item-3)
├─ cartId (cart-123) ← belongs to which cart
├─ menuId (menu-pizza, menu-burger, menu-salad) ← which menu item
└─ quantity (2, 1, 1) ← how many
```

**Relationships:**
```
cart_item_entity connects to:
├─ 1 Cart (belongs to one cart)
├─ 1 Menu (references one menu item)
└─ Many Cart Item Addons (customizations)
```

---

### **2.3 CartItemAddOnsEntity - Customizations**

```
Real-World Analogy: Customizing Each Item

┌─────────────────────────────────────────┐
│  🛒 John's Shopping Cart                │
├─────────────────────────────────────────┤
│  📦 Margherita Pizza (x2)               │
│     ├─ ➕ Extra Cheese (+$2.00)         │
│     └─ ➕ Pepperoni (+$2.50)            │
│     Subtotal: $16.50 each               │
│                                         │
│  📦 Classic Burger (x1)                 │
│     ├─ ➕ Bacon (+$2.00)                │
│     ├─ ➕ Extra Patty (+$3.00)          │
│     └─ ➕ Cheese (+$1.00)               │
│     Subtotal: $14.00                    │
│                                         │
│  📦 Caesar Salad (x1)                   │
│     └─ ➕ Grilled Chicken (+$4.00)      │
│     Subtotal: $11.00                    │
│                                         │
│  TOTAL: $58.00                          │
└─────────────────────────────────────────┘
```

**Database Structure:**
```sql
cart_item_add_ons_entity
├─ id (addon-1, addon-2, ...)
├─ cartItemId (item-1) ← belongs to which cart item
├─ menuAddOnId (addon-cheese) ← which addon
└─ quantity (1) ← how many of this addon
```

**Key Concept: Each Item Has Its Own Addons**
```
Pizza #1 (item-1):
├─ Extra Cheese
└─ Pepperoni

Burger (item-2):
├─ Bacon
├─ Extra Patty
└─ Cheese

Salad (item-3):
└─ Grilled Chicken

Each item is customized independently!
```

---

## 📦 **PART 3: ORDER MANAGEMENT (After Checkout)**

### **3.1 OrderEntity - The Completed Order**

```
Real-World Analogy: Receipt/Order Ticket

┌─────────────────────────────────────────┐
│  ORDER #1234                            │
│  ─────────────────────────────────      │
│  Customer: John                         │
│  Restaurant: Tony's Pizzeria            │
│  Date: Jan 15, 2024 2:30 PM             │
│  Total: $58.00                          │
│  Special Instructions: "Extra napkins"  │
└─────────────────────────────────────────┘
```

**Database Structure:**
```sql
order_entity
├─ id (order-1234)
├─ userId (john-1)
├─ businessId (restaurant-1)
├─ totalAmount (58.00)
└─ remarks ("Extra napkins please")
```

**Why separate from cart?**
- Cart is temporary (can be cleared)
- Order is permanent (historical record)
- Order preserves prices at checkout time

---

### **3.2 OrderItemEntity - Items in Order**

```
Real-World Analogy: Order Details

┌─────────────────────────────────────────┐
│  ORDER #1234 - Items                    │
├─────────────────────────────────────────┤
│  1. Margherita Pizza (x2)               │
│     Price: $12.00 each                  │
│     Subtotal: $24.00                    │
│                                         │
│  2. Classic Burger (x1)                 │
│     Price: $8.00 each                   │
│     Subtotal: $8.00                     │
│                                         │
│  3. Caesar Salad (x1)                   │
│     Price: $7.00 each                   │
│     Subtotal: $7.00                     │
└─────────────────────────────────────────┘
```

**Database Structure:**
```sql
order_item_entity
├─ id (order-item-1, order-item-2, ...)
├─ orderId (order-1234) ← belongs to which order
├─ menuId (menu-pizza) ← which menu item
├─ quantity (2) ← how many
└─ price (12.00) ← price at order time (snapshot!)
```

**Important: Price Snapshot**
```
Why store price in order_item?

Today: Pizza costs $12.00
Customer orders → Stored as $12.00

Tomorrow: Pizza price changes to $15.00
Customer's order still shows $12.00 ✓

Historical accuracy preserved!
```

---

### **3.3 OrderItemAddonEntity - Addon History**

```
Real-World Analogy: Order Details with Customizations

┌─────────────────────────────────────────┐
│  ORDER #1234 - Detailed Breakdown       │
├─────────────────────────────────────────┤
│  1. Margherita Pizza (x2)               │
│     Base: $12.00 x 2 = $24.00           │
│     ├─ Extra Cheese: $2.00 x 2 = $4.00  │
│     └─ Pepperoni: $2.50 x 2 = $5.00     │
│     Item Total: $33.00                  │
│                                         │
│  2. Classic Burger (x1)                 │
│     Base: $8.00 x 1 = $8.00             │
│     ├─ Bacon: $2.00 x 1 = $2.00         │
│     ├─ Extra Patty: $3.00 x 1 = $3.00   │
│     └─ Cheese: $1.00 x 1 = $1.00        │
│     Item Total: $14.00                  │
│                                         │
│  3. Caesar Salad (x1)                   │
│     Base: $7.00 x 1 = $7.00             │
│     └─ Grilled Chicken: $4.00 x 1 = $4.00│
│     Item Total: $11.00                  │
│                                         │
│  ORDER TOTAL: $58.00                    │
└─────────────────────────────────────────┘
```

**Database Structure:**
```sql
order_item_addon_entity
├─ id (order-addon-1, ...)
├─ orderItemId (order-item-1) ← belongs to which order item
├─ addonId (addon-cheese) ← which addon
├─ quantity (1) ← how many
└─ price (2.00) ← price at order time (snapshot!)
```

**Why preserve addon prices?**
```
Today: Extra Cheese costs $2.00
Customer orders → Stored as $2.00

Tomorrow: Extra Cheese price changes to $3.00
Customer's order still shows $2.00 ✓

Customer sees what they actually paid!
```

---

### **3.4 OrderStatusEntity - Order Tracking**

```
Real-World Analogy: Order Status Updates

┌─────────────────────────────────────────┐
│  ORDER #1234 - Status Tracking          │
├─────────────────────────────────────────┤
│  ✓ 2:30 PM - PENDING                    │
│     Order received                      │
│                                         │
│  ✓ 2:35 PM - CONFIRMED                  │
│     Restaurant accepted order           │
│                                         │
│  ✓ 2:50 PM - PREPARING                  │
│     Kitchen is cooking                  │
│                                         │
│  ✓ 3:15 PM - READY                      │
│     Order ready for pickup              │
│                                         │
│  ✓ 3:30 PM - DELIVERED                  │
│     Order delivered to customer         │
└─────────────────────────────────────────┘
```

**Database Structure:**
```sql
order_status_entity
├─ id (status-1, status-2, ...)
├─ orderId (order-1234) ← belongs to which order
├─ status (PENDING, CONFIRMED, PREPARING, READY, DELIVERED)
├─ updatedBy (admin-1) ← who changed the status
└─ remarks ("Customer called to confirm address")
```

**Status Flow:**
```
PENDING → CONFIRMED → PREPARING → READY → DELIVERED
                                        ↓
                                   CANCELLED (if needed)
```

**Why multiple status records?**
- Track complete history
- See who made changes
- Audit trail for disputes
- Customer can see progress

---

## 🔄 **COMPLETE DATA FLOW: CUSTOMER ORDER JOURNEY**

### **Step 1: Restaurant Setup**
```
Admin creates:
1. Category: "Pizza"
2. Menu: "Margherita Pizza" ($12.00)
3. Addons: "Extra Cheese" ($2.00), "Pepperoni" ($2.50)
4. Associate addons with menu

Database:
├─ category (Pizza)
├─ menu_entity (Margherita Pizza)
├─ add_on_entity (Extra Cheese, Pepperoni)
└─ menu_add_on_entity (associations)
```

---

### **Step 2: Customer Browses**
```
Customer views:
1. Categories → Sees "Pizza"
2. Menu items in Pizza → Sees "Margherita Pizza"
3. Available addons → Sees "Extra Cheese", "Pepperoni"

Database queries:
├─ SELECT * FROM category
├─ SELECT * FROM menu_entity WHERE category_id = 'pizza'
└─ SELECT * FROM menu_add_on_entity JOIN add_on_entity
```

---

### **Step 3: Customer Adds to Cart**
```
Customer action:
"Add Margherita Pizza (x2) with Extra Cheese and Pepperoni"

Database creates:
1. cart_entity (if doesn't exist)
   └─ userId: john-1

2. cart_item_entity
   ├─ cartId: cart-123
   ├─ menuId: menu-pizza
   └─ quantity: 2

3. cart_item_add_ons_entity (2 records)
   ├─ Record 1: Extra Cheese
   └─ Record 2: Pepperoni
```

---

### **Step 4: Customer Checks Out**
```
Customer clicks "Place Order"

System:
1. Reads cart_entity with all items and addons
2. Calculates total: $33.00
3. Creates order_entity
4. Copies cart_item_entity → order_item_entity
5. Copies cart_item_add_ons_entity → order_item_addon_entity
6. Creates order_status_entity (PENDING)
7. Deletes cart_entity (clears cart)

Database:
├─ order_entity (order-1234, total: $33.00)
├─ order_item_entity (pizza x2, price: $12.00)
├─ order_item_addon_entity (cheese, pepperoni with prices)
└─ order_status_entity (PENDING)
```

---

### **Step 5: Restaurant Processes Order**
```
Restaurant updates status:

2:35 PM - Admin confirms order
└─ INSERT order_status_entity (CONFIRMED)

2:50 PM - Kitchen starts cooking
└─ INSERT order_status_entity (PREPARING)

3:15 PM - Order ready
└─ INSERT order_status_entity (READY)

3:30 PM - Delivered
└─ INSERT order_status_entity (DELIVERED)

Each status is a new record (history preserved!)
```

---

### **Step 6: Customer Reviews**
```
Customer rates the pizza:

Database creates:
└─ menu_rating_entity
   ├─ menuId: menu-pizza
   ├─ rating: 5
   ├─ comments: "Best pizza ever!"
   └─ ratedBy: john-1
```

---

## 🎯 **KEY ARCHITECTURAL DECISIONS**

### **1. Why Separate Cart and Order?**
```
Cart:
├─ Temporary (can be abandoned)
├─ Can be modified anytime
├─ Uses current prices
└─ Deleted after checkout

Order:
├─ Permanent (historical record)
├─ Cannot be modified (only cancelled)
├─ Preserves prices at checkout time
└─ Never deleted (soft delete only)
```

### **2. Why Store Prices in Orders?**
```
Problem: Menu prices change over time

Without price storage:
├─ Order shows current price
├─ Customer sees different price than paid
└─ Disputes and confusion

With price storage:
├─ Order shows price at order time
├─ Customer sees what they actually paid
└─ Historical accuracy
```

### **3. Why Junction Tables?**
```
Problem: Many-to-Many relationships

menu_entity ↔ add_on_entity
├─ One menu can have many addons
└─ One addon can be on many menus

Solution: menu_add_on_entity (junction table)
├─ Stores associations
├─ Flexible and scalable
└─ Easy to add/remove associations
```

### **4. Why Separate Addon Tables for Cart and Order?**
```
cart_item_add_ons_entity:
├─ Temporary addon selections
├─ Can be modified
└─ Deleted after checkout

order_item_addon_entity:
├─ Permanent addon history
├─ Cannot be modified
├─ Preserves prices
└─ Never deleted
```

---

## 📊 **DATABASE STATISTICS**

```
Total Tables: 12

Core Tables (Menu Management): 5
├─ category
├─ menu_entity
├─ add_on_entity
├─ menu_add_on_entity (junction)
└─ menu_rating_entity

Cart Tables (Shopping): 3
├─ cart_entity
├─ cart_item_entity
└─ cart_item_add_ons_entity

Order Tables (Order Management): 4
├─ order_entity
├─ order_item_entity
├─ order_item_addon_entity
└─ order_status_entity

Total Relationships: 13
├─ One-to-Many: 9
├─ Many-to-Many: 1
└─ Self-Referencing: 1
```

---

This architecture supports a complete restaurant e-commerce system with flexibility, scalability, and data integrity!
