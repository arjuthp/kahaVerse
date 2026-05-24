# 🔄 Module Flow Diagrams - Restaurant E-Commerce Platform

## 📋 Table of Contents
1. [Menu Module Flow](#menu-module-flow)
2. [Cart Module Flow](#cart-module-flow)
3. [Order Module Flow](#order-module-flow)
4. [Category Module Flow](#category-module-flow)
5. [Add-ons Module Flow](#add-ons-module-flow)
6. [Menu Rating Module Flow](#menu-rating-module-flow)

---

## 🍽️ Menu Module Flow

### 1. Create Menu Item Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    CREATE MENU ITEM                             │
└─────────────────────────────────────────────────────────────────┘

Client Request
     │
     │  POST /menu
     │  Headers: { Authorization: Bearer <JWT> }
     │  Body: {
     │    name, description, images[], price,
     │    discountedPrice, categoryId, addOnIds[],
     │    isBarItem, allowAddOns, services[]
     │  }
     │
     ▼
┌─────────────────────────────────────────┐
│  MenuController.createMenu()            │
│  - Extract businessId from JWT token    │
└────────────┬────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────┐
│  MenuService.createMenu()               │
└────────────┬────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────┐
│  Step 1: Check Duplicate Name           │
│  MenuRepository.findOne({               │
│    name: ILike(body.name),              │
│    businessId                           │
│  })                                     │
└────────────┬────────────────────────────┘
             │
             ├─── Exists? ──► ConflictException
             │                "Menu with same name exists"
             │
             ▼ Not Exists
┌─────────────────────────────────────────┐
│  Step 2: Validate Category              │
│  CategoryRepository.findOne({           │
│    id: categoryId                       │
│  })                                     │
└────────────┬────────────────────────────┘
             │
             ├─── Not Found? ──► NotFoundException
             │                   "Category not found"
             │
             ▼ Found
┌─────────────────────────────────────────┐
│  Step 3: Fetch Add-ons (if provided)    │
│  AddonsRepository.find({                │
│    id: In(addOnIds)                     │
│  })                                     │
└────────────┬────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────┐
│  Step 4: Save Menu Entity               │
│  MenuRepository.save({                  │
│    ...menuData,                         │
│    businessId,                          │
│    category: categoryEntity,            │
│    addOns: addOnEntities                │
│  })                                     │
└────────────┬────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────┐
│  Response: 200 OK                       │
│  { message: "Menu created successfully" }│
└─────────────────────────────────────────┘
```



### 2. Find All Menu Items Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    FIND ALL MENU ITEMS                          │
└─────────────────────────────────────────────────────────────────┘

Client Request
     │
     │  GET /menu/:businessId?page=1&take=10&name=burger
     │                       &categoryId=xxx&minPrice=5&maxPrice=20
     │                       &groupBy=category
     │
     ▼
┌─────────────────────────────────────────┐
│  MenuController.findAllMenu()           │
└────────────┬────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────┐
│  MenuService.findAllMenu()              │
└────────────┬────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────┐
│  Step 1: Parse Query Parameters         │
│  - page (default: 1)                    │
│  - take (default: 10)                   │
│  - name (optional filter)               │
│  - categoryId (optional filter)         │
│  - minPrice, maxPrice (optional range)  │
│  - groupBy (optional: "category")       │
└────────────┬────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────┐
│  Step 2: Build Where Clause             │
│  whereClause = { businessId }           │
│                                         │
│  if (categoryId)                        │
│    whereClause["category.id"] = id      │
│                                         │
│  if (name)                              │
│    whereClause["menu.name"] = Like(%)   │
│                                         │
│  if (minPrice && maxPrice)              │
│    whereClause["menu.price"] =          │
│      Between(min, max)                  │
└────────────┬────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────┐
│  Step 3: Execute Query                  │
│  MenuRepository.findAndCount({          │
│    where: whereClause,                  │
│    relations: {                         │
│      category: true,                    │
│      addOns: true                       │
│    },                                   │
│    skip: (page - 1) * limit,            │
│    take: limit                          │
│  })                                     │
└────────────┬────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────┐
│  Step 4: Transform Results              │
│  - Map each menu to response format     │
│  - Include category info                │
│  - Include add-ons info                 │
└────────────┬────────────────────────────┘
             │
             ├──── groupBy === "category"?
             │
             │ YES
             │     ▼
             │  ┌──────────────────────────┐
             │  │ Group by Category Name   │
             │  │ {                        │
             │  │   "Burgers": [...],      │
             │  │   "Drinks": [...],       │
             │  │   "Desserts": [...]      │
             │  │ }                        │
             │  └──────────────────────────┘
             │
             │ NO
             │     ▼
             │  ┌──────────────────────────┐
             │  │ Return Paginated List    │
             │  │ {                        │
             │  │   metaData: {            │
             │  │     currentPage,         │
             │  │     totalPages,          │
             │  │     totalCount,          │
             │  │     perPage              │
             │  │   },                     │
             │  │   data: [...]            │
             │  │ }                        │
             │  └──────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────┐
│  Response: 200 OK                       │
│  Menu list with metadata                │
└─────────────────────────────────────────┘
```



### 3. Update Menu Item Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    UPDATE MENU ITEM                             │
└─────────────────────────────────────────────────────────────────┘

Client Request
     │
     │  PATCH /menu/:id
     │  Headers: { Authorization: Bearer <JWT> }
     │  Body: { name, price, categoryId, isAvailable, ... }
     │
     ▼
┌─────────────────────────────────────────┐
│  MenuController.updateMenu()            │
│  - Extract businessId from JWT          │
└────────────┬────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────┐
│  MenuService.updateMenu()               │
└────────────┬────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────┐
│  Step 1: Find Existing Menu             │
│  MenuRepository.findOne({               │
│    id, businessId                       │
│  })                                     │
└────────────┬────────────────────────────┘
             │
             ├─── Not Found? ──► NotFoundException
             │
             ▼ Found
┌─────────────────────────────────────────┐
│  Step 2: Check Name Change              │
│  if (existingMenu.name !== newName)     │
└────────────┬────────────────────────────┘
             │
             ▼ Name Changed
┌─────────────────────────────────────────┐
│  Step 3: Check Duplicate Name           │
│  MenuRepository.findOne({               │
│    name: ILike(newName),                │
│    businessId                           │
│  })                                     │
└────────────┬────────────────────────────┘
             │
             ├─── Exists? ──► ConflictException
             │                "Menu with same name exists"
             │
             ▼ Unique
┌─────────────────────────────────────────┐
│  Step 4: Update Menu                    │
│  MenuRepository.update(                 │
│    { id, businessId },                  │
│    {                                    │
│      ...updateData,                     │
│      category: { id: categoryId }       │
│    }                                    │
│  )                                      │
└────────────┬────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────┐
│  Response: 200 OK                       │
│  { message: "Menu updated successfully" }│
└─────────────────────────────────────────┘
```

### 4. Toggle Signature Menu Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    TOGGLE SIGNATURE MENU                        │
└─────────────────────────────────────────────────────────────────┘

Client Request
     │
     │  PATCH /menu/toggle-signature/:id
     │  Headers: { Authorization: Bearer <JWT> }
     │  Body: { isSignature: true }
     │
     ▼
┌─────────────────────────────────────────┐
│  MenuController.toggleSignatureMenu()   │
└────────────┬────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────┐
│  MenuService.toggleSignatureMenu()      │
└────────────┬────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────┐
│  Step 1: Find Menu                      │
│  MenuRepository.findOne({               │
│    id: menuId, businessId               │
│  })                                     │
└────────────┬────────────────────────────┘
             │
             ├─── Not Found? ──► NotFoundException
             │
             ▼ Found
┌─────────────────────────────────────────┐
│  Step 2: Check if Setting to Signature  │
│  if (isSignature === true)              │
└────────────┬────────────────────────────┘
             │
             ▼ YES
┌─────────────────────────────────────────┐
│  Step 3: Check Already Signature        │
│  if (existingMenu.isSignature === true) │
└────────────┬────────────────────────────┘
             │
             ├─── Already Signature? ──► BadRequestException
             │                           "Already signature"
             │
             ▼ Not Signature
┌─────────────────────────────────────────┐
│  Step 4: Count Signature Products       │
│  MenuRepository.count({                 │
│    businessId,                          │
│    isSignature: true                    │
│  })                                     │
└────────────┬────────────────────────────┘
             │
             ├─── Count >= 3? ──► BadRequestException
             │                    "Max limit reached (3)"
             │
             ▼ Can Add
┌─────────────────────────────────────────┐
│  Step 5: Update Menu                    │
│  MenuRepository.update(                 │
│    { id: menuId, businessId },          │
│    { isSignature }                      │
│  )                                      │
└────────────┬────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────┐
│  Response: 200 OK                       │
│  { message: "Marked as signature" or    │
│             "Removed from signature" }  │
└─────────────────────────────────────────┘
```



### 5. Update Menu Add-ons Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    UPDATE MENU ADD-ONS                          │
└─────────────────────────────────────────────────────────────────┘

Client Request
     │
     │  PATCH /menu/update-addons/:id
     │  Headers: { Authorization: Bearer <JWT> }
     │  Body: { addOnsIds: ["addon-1", "addon-2", "addon-3"] }
     │
     ▼
┌─────────────────────────────────────────┐
│  MenuController.updateAddonExistingMenu()│
└────────────┬────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────┐
│  MenuService.updateMenuAddons()         │
└────────────┬────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────┐
│  Step 1: Find Menu with Current Add-ons │
│  MenuRepository.findOne({               │
│    where: { id, businessId },           │
│    relations: { addOns: true }          │
│  })                                     │
└────────────┬────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────┐
│  Step 2: Fetch New Add-ons              │
│  AddonsRepository.find({                │
│    where: { id: In(addOnsIds) }         │
│  })                                     │
└────────────┬────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────┐
│  Step 3: Replace Add-ons                │
│  menu.addOns = newAddons                │
│                                         │
│  (TypeORM handles many-to-many update)  │
└────────────┬────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────┐
│  Step 4: Save Menu                      │
│  MenuRepository.save(menu)              │
└────────────┬────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────┐
│  Response: 200 OK                       │
│  { message: "Menu addons updated" }     │
└─────────────────────────────────────────┘
```

### 6. Delete Menu Item Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    DELETE MENU ITEM                             │
└─────────────────────────────────────────────────────────────────┘

Client Request
     │
     │  DELETE /menu/:id
     │  Headers: { Authorization: Bearer <JWT> }
     │
     ▼
┌─────────────────────────────────────────┐
│  MenuController.deleteMenu()            │
│  - Extract businessId from JWT          │
└────────────┬────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────┐
│  MenuService.deleteMenu()               │
└────────────┬────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────┐
│  Soft Delete Menu                       │
│  MenuRepository.delete({                │
│    id: menuId,                          │
│    businessId                           │
│  })                                     │
│                                         │
│  (Sets deletedAt timestamp)             │
└────────────┬────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────┐
│  Response: 200 OK                       │
│  { message: "Menu deleted successfully" }│
└─────────────────────────────────────────┘
```

---

## 🛒 Cart Module Flow

### 1. Create Cart Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    CREATE CART                                  │
└─────────────────────────────────────────────────────────────────┘

Client Request
     │
     │  POST /cart
     │  Headers: { Authorization: Bearer <JWT> }
     │
     ▼
┌─────────────────────────────────────────┐
│  CartController.createCart()            │
│  - Extract userId from JWT              │
└────────────┬────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────┐
│  CartService.createCart()               │
└────────────┬────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────┐
│  Step 1: Check Existing Cart            │
│  CartRepository.findOne({               │
│    where: { userId }                    │
│  })                                     │
└────────────┬────────────────────────────┘
             │
             ├─── Exists? ──► ConflictException
             │                "Cart already exists"
             │
             ▼ Not Exists
┌─────────────────────────────────────────┐
│  Step 2: Create Cart                    │
│  CartRepository.save({ userId })        │
└────────────┬────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────┐
│  Response: 200 OK                       │
│  { id, userId, createdAt }              │
└─────────────────────────────────────────┘
```



### 2. Add Item to Cart Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    ADD ITEM TO CART                             │
└─────────────────────────────────────────────────────────────────┘

Client Request
     │
     │  POST /cart/item
     │  Headers: { Authorization: Bearer <JWT> }
     │  Body: {
     │    menuId: "menu-123",
     │    quantity: 2,
     │    addonInfo: [
     │      { addonsId: "addon-1", quantity: 1 },
     │      { addonsId: "addon-2", quantity: 2 }
     │    ]
     │  }
     │
     ▼
┌─────────────────────────────────────────┐
│  CartController.createCartItem()        │
│  - Extract userId from JWT              │
└────────────┬────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────┐
│  CartService.createCartItem()           │
└────────────┬────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────┐
│  Step 1: Find or Create Cart            │
│  CartRepository.findOne({               │
│    where: { userId },                   │
│    relations: {                         │
│      cartItems: { menu: true }          │
│    }                                    │
│  })                                     │
└────────────┬────────────────────────────┘
             │
             ├─── Not Found?
             │      │
             │      ▼
             │  ┌──────────────────────────┐
             │  │ Create New Cart          │
             │  │ createCart(userId)       │
             │  └──────────────────────────┘
             │
             ▼ Cart Exists/Created
┌─────────────────────────────────────────┐
│  Step 2: Create Cart Item               │
│  CartItemRepository.save({              │
│    quantity,                            │
│    cart: existingCart,                  │
│    menu: { id: menuId }                 │
│  })                                     │
└────────────┬────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────┐
│  Step 3: Add Add-ons (if provided)      │
│  if (addonInfo?.length)                 │
└────────────┬────────────────────────────┘
             │
             ▼ Has Add-ons
┌─────────────────────────────────────────┐
│  Step 4: Create CartItemAddOns          │
│  Promise.all(                           │
│    addonInfo.map(({ addonsId, qty }) => │
│      CartItemAddOnsRepository.save({    │
│        cartItem,                        │
│        menuAddOn: { id: addonsId },     │
│        quantity: qty                    │
│      })                                 │
│    )                                    │
│  )                                      │
└────────────┬────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────┐
│  Response: 200 OK                       │
│  { message: "CartItem created" }        │
└─────────────────────────────────────────┘

DATABASE STATE AFTER:
┌─────────────────────────────────────────┐
│  Cart                                   │
│  ├─ id: "cart-1"                        │
│  └─ userId: "user-1"                    │
│                                         │
│  CartItem                               │
│  ├─ id: "cartitem-1"                    │
│  ├─ cartId: "cart-1"                    │
│  ├─ menuId: "menu-123"                  │
│  └─ quantity: 2                         │
│                                         │
│  CartItemAddOns                         │
│  ├─ cartItemId: "cartitem-1"            │
│  ├─ menuAddOnId: "addon-1"              │
│  └─ quantity: 1                         │
│                                         │
│  CartItemAddOns                         │
│  ├─ cartItemId: "cartitem-1"            │
│  ├─ menuAddOnId: "addon-2"              │
│  └─ quantity: 2                         │
└─────────────────────────────────────────┘
```



### 3. View Cart Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    VIEW USER CART                               │
└─────────────────────────────────────────────────────────────────┘

Client Request
     │
     │  GET /cart?groupBy=business
     │  Headers: { Authorization: Bearer <JWT> }
     │
     ▼
┌─────────────────────────────────────────┐
│  CartController.findAllCarts()          │
│  - Extract userId from JWT              │
└────────────┬────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────┐
│  CartService.findUserCart()             │
└────────────┬────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────┐
│  Step 1: Find User Cart with Relations  │
│  CartRepository.findOne({               │
│    where: { userId },                   │
│    relations: {                         │
│      cartItems: {                       │
│        menu: true,                      │
│        addOns: { menuAddOn: true }      │
│      }                                  │
│    }                                    │
│  })                                     │
└────────────┬────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────┐
│  Step 2: Check groupBy Parameter        │
└────────────┬────────────────────────────┘
             │
             ├──── groupBy === "business"?
             │
             │ YES
             │     ▼
             │  ┌──────────────────────────────────┐
             │  │ Group Cart Items by businessId   │
             │  │                                  │
             │  │ cartItems.reduce((acc, item) => {│
             │  │   businessId = item.menu.businessId│
             │  │   acc[businessId].push(item)     │
             │  │ })                               │
             │  │                                  │
             │  │ Response:                        │
             │  │ {                                │
             │  │   cartId,                        │
             │  │   userId,                        │
             │  │   business: {                    │
             │  │     "business-1": [items...],    │
             │  │     "business-2": [items...]     │
             │  │   }                              │
             │  │ }                                │
             │  └──────────────────────────────────┘
             │
             │ NO
             │     ▼
             │  ┌──────────────────────────────────┐
             │  │ Return Flat Cart Structure       │
             │  │                                  │
             │  │ Response:                        │
             │  │ {                                │
             │  │   id,                            │
             │  │   userId,                        │
             │  │   cartItemsInfo: [               │
             │  │     {                            │
             │  │       id,                        │
             │  │       name,                      │
             │  │       quantity,                  │
             │  │       menu: { name, price },     │
             │  │       addOns: [...],             │
             │  │       itemTotal,                 │
             │  │       addonsTotal,               │
             │  │       grandTotal                 │
             │  │     }                            │
             │  │   ]                              │
             │  │ }                                │
             │  └──────────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────┐
│  Response: 200 OK                       │
│  Cart data with calculated totals       │
└─────────────────────────────────────────┘

CALCULATION LOGIC:
┌─────────────────────────────────────────┐
│  For Each Cart Item:                    │
│                                         │
│  itemTotal = menu.price × quantity      │
│                                         │
│  For Each Add-on:                       │
│    addonTotal = addon.price × qty       │
│    addonsTotal += addonTotal            │
│                                         │
│  grandTotal = itemTotal + addonsTotal   │
└─────────────────────────────────────────┘
```



### 4. Update Cart Item Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    UPDATE CART ITEM                             │
└─────────────────────────────────────────────────────────────────┘

Client Request
     │
     │  PATCH /cart/:itemId
     │  Headers: { Authorization: Bearer <JWT> }
     │  Body: {
     │    quantity: 3,
     │    addonInfo: [
     │      { addOnId: "addon-3", quantity: 1 }
     │    ]
     │  }
     │
     ▼
┌─────────────────────────────────────────┐
│  CartController.updateCartItem()        │
│  - Extract userId from JWT              │
└────────────┬────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────┐
│  CartService.updateCartItem()           │
└────────────┬────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────┐
│  Step 1: Validate Quantity              │
│  if (quantity < 1)                      │
└────────────┬────────────────────────────┘
             │
             ├─── Invalid? ──► BadRequestException
             │                 "Quantity must be >= 1"
             │
             ▼ Valid
┌─────────────────────────────────────────┐
│  Step 2: Find Cart Item                 │
│  CartItemRepository.findOne({           │
│    where: {                             │
│      id: cartItemId,                    │
│      cart: { userId }                   │
│    },                                   │
│    relations: { addOns: true }          │
│  })                                     │
└────────────┬────────────────────────────┘
             │
             ├─── Not Found? ──► NotFoundException
             │
             ▼ Found
┌─────────────────────────────────────────┐
│  Step 3: Update Quantity                │
│  cartItem.quantity = newQuantity        │
└────────────┬────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────┐
│  Step 4: Remove Old Add-ons             │
│  CartItemAddOnsRepository.remove(       │
│    cartItem.addOns                      │
│  )                                      │
└────────────┬────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────┐
│  Step 5: Add New Add-ons (if provided)  │
│  if (addonInfo?.length)                 │
│    newAddons = addonInfo.map(addon =>   │
│      create({                           │
│        cartItem,                        │
│        menuAddOn: { id: addon.addOnId },│
│        quantity: addon.quantity         │
│      })                                 │
│    )                                    │
│    cartItem.addOns = save(newAddons)    │
└────────────┬────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────┐
│  Step 6: Save Cart Item                 │
│  CartItemRepository.save(cartItem)      │
└────────────┬────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────┐
│  Response: 200 OK                       │
│  { message: "Cart item updated" }       │
└─────────────────────────────────────────┘
```

### 5. Delete Cart Item Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    DELETE CART ITEM                             │
└─────────────────────────────────────────────────────────────────┘

Client Request
     │
     │  DELETE /cart/:id
     │  Headers: { Authorization: Bearer <JWT> }
     │
     ▼
┌─────────────────────────────────────────┐
│  CartController.deleteCartItem()        │
│  - Extract userId from JWT              │
└────────────┬────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────┐
│  CartService.deleteCartItem()           │
└────────────┬────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────┐
│  Step 1: Verify Ownership               │
│  CartItemRepository.findOne({           │
│    where: {                             │
│      id: cartItemId,                    │
│      cart: { userId }                   │
│    }                                    │
│  })                                     │
└────────────┬────────────────────────────┘
             │
             ├─── Not Found? ──► NotFoundException
             │
             ▼ Found
┌─────────────────────────────────────────┐
│  Step 2: Delete Cart Item               │
│  CartItemRepository.delete(cartItemId)  │
│                                         │
│  (Cascade deletes CartItemAddOns)       │
└────────────┬────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────┐
│  Response: 200 OK                       │
│  { message: "Cartitem deleted" }        │
└─────────────────────────────────────────┘
```

---

## 📦 Order Module Flow

### 1. Create Order Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    CREATE ORDER                                 │
└─────────────────────────────────────────────────────────────────┘

Client Request
     │
     │  POST /order
     │  Headers: { Authorization: Bearer <JWT> }
     │  Body: {
     │    businessId: "business-1",
     │    remarks: "No onions please",
     │    orderItems: [
     │      {
     │        menuId: "menu-1",
     │        quantity: 2,
     │        itemAddons: [
     │          { addonId: "addon-1", quantity: 1 },
     │          { addonId: "addon-2", quantity: 2 }
     │        ]
     │      },
     │      {
     │        menuId: "menu-2",
     │        quantity: 1,
     │        itemAddons: []
     │      }
     │    ]
     │  }
     │
     ▼
┌─────────────────────────────────────────┐
│  OrderController.createOrder()          │
│  - Extract userId from JWT              │
└────────────┬────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────┐
│  OrderService.createOrder()             │
└────────────┬────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────┐
│  Step 1: Create Order Entity            │
│  OrderRepository.save({                 │
│    businessId,                          │
│    userId,                              │
│    remarks                              │
│  })                                     │
└────────────┬────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────┐
│  Step 2: Process Each Order Item        │
│  Promise.all(orderItems.map(...))       │
└────────────┬────────────────────────────┘
             │
             ▼
     ┌───────────────────────────────────┐
     │  FOR EACH ORDER ITEM:             │
     └───────────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────┐
│  2a. Fetch Menu with Current Price      │
│  MenuRepository.findOne({               │
│    where: { id: menuId }                │
│  })                                     │
└────────────┬────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────┐
│  2b. Create OrderItem (Price Snapshot)  │
│  OrderItemRepository.save({             │
│    quantity,                            │
│    price: menu.price,  ← SNAPSHOT       │
│    menu: { id: menuId },                │
│    order                                │
│  })                                     │
└────────────┬────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────┐
│  2c. Process Item Add-ons               │
│  Promise.all(itemAddons.map(...))       │
└────────────┬────────────────────────────┘
             │
             ▼
     ┌───────────────────────────────────┐
     │  FOR EACH ADD-ON:                 │
     └───────────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────┐
│  2c-i. Fetch Add-on with Current Price  │
│  AddonsRepository.findOne({             │
│    where: { id: addonId }               │
│  })                                     │
└────────────┬────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────┐
│  2c-ii. Create OrderItemAddon (Snapshot)│
│  OrderItemAddonRepository.save({        │
│    quantity,                            │
│    price: addon.price,  ← SNAPSHOT      │
│    addon: { id: addonId },              │
│    orderItem: savedOrderItem            │
│  })                                     │
└────────────┬────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────┐
│  2c-iii. Calculate Add-on Total         │
│  addonTotal = addon.price × quantity    │
│  return addonTotal                      │
└────────────┬────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────┐
│  2d. Calculate Item Total               │
│  addonsTotal = sum(all addon totals)    │
│  itemTotal = (menu.price × quantity)    │
│            + addonsTotal                │
│  return itemTotal                       │
└────────────┬────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────┐
│  Step 3: Calculate Order Total          │
│  totalAmount = sum(all item totals)     │
└────────────┬────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────┐
│  Step 4: Update Order with Total        │
│  order.totalAmount = totalAmount        │
│  OrderRepository.save(order)            │
└────────────┬────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────┐
│  Step 5: Create Initial Order Status    │
│  OrderStatusRepository.save({           │
│    order,                               │
│    status: PENDING,                     │
│    updatedBy: userId                    │
│  })                                     │
└────────────┬────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────┐
│  Response: 200 OK                       │
│  { message: "Order created successfully"}│
└─────────────────────────────────────────┘

PRICE SNAPSHOT EXAMPLE:
┌─────────────────────────────────────────┐
│  Menu Price at Order Time: $10.00       │
│  (Even if menu price changes to $12.00  │
│   later, order shows $10.00)            │
│                                         │
│  Add-on Price at Order Time: $2.00      │
│  (Preserved in OrderItemAddon)          │
└─────────────────────────────────────────┘
```



### 2. Find User Orders Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    FIND USER ORDERS                             │
└─────────────────────────────────────────────────────────────────┘

Client Request
     │
     │  GET /order/user?status=PENDING&startDate=2024-01-01
     │                 &endDate=2024-01-31
     │  Headers: { Authorization: Bearer <JWT> }
     │
     ▼
┌─────────────────────────────────────────┐
│  OrderController.findAllUserOrder()     │
│  - Extract userId from JWT              │
└────────────┬────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────┐
│  OrderService.findUserOrders()          │
└────────────┬────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────┐
│  Step 1: Build Where Clause             │
│  whereClause = { userId }               │
└────────────┬────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────┐
│  Step 2: Add Date Range Filter          │
│  if (startDate && endDate)              │
│    startDate = startOfDay(startDate)    │
│    endDate = endOfDay(endDate)          │
│    whereClause.createdAt =              │
│      Between(startDate, endDate)        │
└────────────┬────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────┐
│  Step 3: Fetch Orders                   │
│  OrderRepository.find({                 │
│    where: whereClause,                  │
│    relations: { orderStatus: true },    │
│    order: { createdAt: "DESC" }         │
│  })                                     │
└────────────┬────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────┐
│  Step 4: Filter by Status (if provided) │
│  if (status)                            │
└────────────┬────────────────────────────┘
             │
             ▼ Has Status Filter
┌─────────────────────────────────────────┐
│  Filter Logic:                          │
│  orders.filter(order => {               │
│    // Sort status by latest first       │
│    sortedStatus = order.orderStatus     │
│      .sort((a,b) =>                     │
│        b.createdAt - a.createdAt)       │
│                                         │
│    // Check latest status               │
│    return sortedStatus[0].status        │
│           === requestedStatus           │
│  })                                     │
└────────────┬────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────┐
│  Step 5: Fetch User Info                │
│  ServiceCommunicationService            │
│    .getUser(userId)                     │
│                                         │
│  Returns: { name, email, contact }      │
└────────────┬────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────┐
│  Step 6: Enrich Each Order              │
│  Promise.all(orders.map(order => {      │
│    orderResponse = transform(order)     │
│    orderResponse.userInfo = userInfo    │
│                                         │
│    if (order.businessId)                │
│      orderResponse.businessInfo =       │
│        getBusinessInfo(businessId)      │
│                                         │
│    return orderResponse                 │
│  }))                                    │
└────────────┬────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────┐
│  Response: 200 OK                       │
│  [                                      │
│    {                                    │
│      id, userId, businessId,            │
│      totalAmount, remarks,              │
│      userInfo: {                        │
│        name, email, contact, avatar     │
│      },                                 │
│      businessInfo: {                    │
│        name, category, address, avatar  │
│      }                                  │
│    }                                    │
│  ]                                      │
└─────────────────────────────────────────┘
```

### 3. Find Business Orders Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    FIND BUSINESS ORDERS                         │
└─────────────────────────────────────────────────────────────────┘

Client Request
     │
     │  GET /order/business-man-vs/:businessId
     │      ?status=CONFIRMED&startDate=2024-01-01
     │  Headers: { Authorization: Bearer <JWT> }
     │
     ▼
┌─────────────────────────────────────────┐
│  OrderController.findOneBusinessOrder() │
└────────────┬────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────┐
│  OrderService.findBusinessOrders()      │
└────────────┬────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────┐
│  Step 1: Build Where Clause             │
│  whereClause = { businessId }           │
│                                         │
│  if (startDate && endDate)              │
│    whereClause.createdAt =              │
│      Between(startOfDay, endOfDay)      │
└────────────┬────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────┐
│  Step 2: Fetch Orders                   │
│  OrderRepository.find({                 │
│    where: whereClause,                  │
│    relations: { orderStatus: true },    │
│    order: { createdAt: "DESC" }         │
│  })                                     │
└────────────┬────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────┐
│  Step 3: Filter by Status (if provided) │
│  (Same logic as user orders)            │
└────────────┬────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────┐
│  Step 4: Fetch Business Info            │
│  ServiceCommunicationService            │
│    .getBusiness(businessId)             │
└────────────┬────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────┐
│  Step 5: Enrich Each Order              │
│  Promise.all(orders.map(order => {      │
│    orderResponse = transform(order)     │
│    orderResponse.businessInfo =         │
│      businessInfo                       │
│                                         │
│    if (order.userId)                    │
│      orderResponse.userInfo =           │
│        getUserInfo(userId)              │
│                                         │
│    return orderResponse                 │
│  }))                                    │
└────────────┬────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────┐
│  Response: 200 OK                       │
│  Array of orders with user & business   │
│  information                            │
└─────────────────────────────────────────┘
```



### 4. Change Order Status Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    CHANGE ORDER STATUS                          │
└─────────────────────────────────────────────────────────────────┘

Client Request
     │
     │  POST /order/:orderId/change-status
     │  Headers: { Authorization: Bearer <JWT> }
     │  Body: { status: "CONFIRMED" }
     │
     ▼
┌─────────────────────────────────────────┐
│  OrderController.changeOrderStatus()    │
│  - Extract userId from JWT              │
└────────────┬────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────┐
│  OrderService.changeOrderStatus()       │
└────────────┬────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────┐
│  Step 1: Find Order                     │
│  OrderRepository.findOne({              │
│    where: { id: orderId }               │
│  })                                     │
└────────────┬────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────┐
│  Step 2: Create New Status Entry        │
│  OrderStatusRepository.save({           │
│    order,                               │
│    status: newStatus,                   │
│    updatedBy: userId,                   │
│    createdAt: now()                     │
│  })                                     │
│                                         │
│  Note: Does NOT delete old status       │
│        Maintains complete history       │
└────────────┬────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────┐
│  Response: 200 OK                       │
│  { message: "Order status updated" }    │
└─────────────────────────────────────────┘

STATUS HISTORY EXAMPLE:
┌─────────────────────────────────────────┐
│  Order ID: order-123                    │
│                                         │
│  OrderStatus Records:                   │
│  ├─ id: 1, status: PENDING              │
│  │  updatedBy: user-1                   │
│  │  createdAt: 2024-01-15 10:00        │
│  │                                      │
│  ├─ id: 2, status: CONFIRMED            │
│  │  updatedBy: admin-1                  │
│  │  createdAt: 2024-01-15 10:05        │
│  │                                      │
│  ├─ id: 3, status: PREPARING            │
│  │  updatedBy: admin-1                  │
│  │  createdAt: 2024-01-15 10:15        │
│  │                                      │
│  └─ id: 4, status: READY                │
│     updatedBy: admin-1                  │
│     createdAt: 2024-01-15 10:30        │
│                                         │
│  Latest Status: READY                   │
│  (Determined by sorting by createdAt)   │
└─────────────────────────────────────────┘
```

---

## 📂 Category Module Flow

### 1. Create Category Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    CREATE CATEGORY                              │
└─────────────────────────────────────────────────────────────────┘

Client Request
     │
     │  POST /categories
     │  Headers: { Authorization: Bearer <JWT> }
     │  Body: {
     │    name: "Beverages",
     │    description: "Hot and cold drinks",
     │    icon: "drink-icon.png",
     │    isActive: true,
     │    position: 1,
     │    businessId: "business-1",
     │    parentId: null  // or parent category ID
     │  }
     │
     ▼
┌─────────────────────────────────────────┐
│  CategoryController.createCategory()    │
└────────────┬────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────┐
│  CategoryService.createCategory()       │
└────────────┬────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────┐
│  Step 1: Check Duplicate Name           │
│  CategoryRepository.findOne({           │
│    where: { name: ILike(name) }         │
│  })                                     │
└────────────┬────────────────────────────┘
             │
             ├─── Exists? ──► ConflictException
             │                "Category with same name exists"
             │
             ▼ Not Exists
┌─────────────────────────────────────────┐
│  Step 2: Validate Parent (if provided)  │
│  if (parentId)                          │
│    CategoryRepository.findOne({         │
│      where: { id: parentId }            │
│    })                                   │
└────────────┬────────────────────────────┘
             │
             ├─── Parent Not Found? ──► BadRequestException
             │                          "Parent category not found"
             │
             ▼ Valid or No Parent
┌─────────────────────────────────────────┐
│  Step 3: Create Category                │
│  CategoryRepository.save({              │
│    ...categoryData,                     │
│    parent: { id: parentId }             │
│  })                                     │
└────────────┬────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────┐
│  Response: 200 OK                       │
│  { message: "Category created" }        │
└─────────────────────────────────────────┘

HIERARCHY EXAMPLE:
┌─────────────────────────────────────────┐
│  Beverages (parent: null)               │
│  ├─ Hot Drinks (parent: Beverages)      │
│  │  ├─ Coffee (parent: Hot Drinks)      │
│  │  └─ Tea (parent: Hot Drinks)         │
│  └─ Cold Drinks (parent: Beverages)     │
│     ├─ Juice (parent: Cold Drinks)      │
│     └─ Soda (parent: Cold Drinks)       │
└─────────────────────────────────────────┘
```



### 2. Find All Categories Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    FIND ALL CATEGORIES                          │
└─────────────────────────────────────────────────────────────────┘

Client Request
     │
     │  GET /categories/:businessId
     │
     ▼
┌─────────────────────────────────────────┐
│  CategoryController.findAllCategories() │
└────────────┬────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────┐
│  CategoryService.findAllCategories()    │
└────────────┬────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────┐
│  Fetch Root Categories with Children    │
│  CategoryRepository.find({              │
│    relations: {                         │
│      childrens: {                       │
│        childrens: true  // 2 levels     │
│      }                                  │
│    },                                   │
│    where: {                             │
│      parent: IsNull(),  // Root only    │
│      businessId                         │
│    }                                    │
│  })                                     │
└────────────┬────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────┐
│  Transform to Response Format           │
│  categories.map(category => ({          │
│    id, name, description, icon,         │
│    isActive, position,                  │
│    childrens: [                         │
│      { id, name, description, ... }     │
│    ]                                    │
│  }))                                    │
└────────────┬────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────┐
│  Response: 200 OK                       │
│  [                                      │
│    {                                    │
│      id: "cat-1",                       │
│      name: "Beverages",                 │
│      childrens: [                       │
│        {                                │
│          id: "cat-2",                   │
│          name: "Hot Drinks",            │
│          childrens: [...]               │
│        }                                │
│      ]                                  │
│    }                                    │
│  ]                                      │
└─────────────────────────────────────────┘

RESPONSE STRUCTURE:
┌─────────────────────────────────────────┐
│  Root Categories Only                   │
│  (parent: null)                         │
│                                         │
│  Each includes:                         │
│  - Direct children (level 1)            │
│  - Grandchildren (level 2)              │
│                                         │
│  Nested up to 2 levels deep             │
└─────────────────────────────────────────┘
```

### 3. Update Category Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    UPDATE CATEGORY                              │
└─────────────────────────────────────────────────────────────────┘

Client Request
     │
     │  PATCH /categories/:id
     │  Headers: { Authorization: Bearer <JWT> }
     │  Body: {
     │    name: "Updated Name",
     │    description: "New description",
     │    isActive: false,
     │    parentId: "new-parent-id"
     │  }
     │
     ▼
┌─────────────────────────────────────────┐
│  CategoryController.updateCategory()    │
│  - Extract businessId from JWT          │
└────────────┬────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────┐
│  CategoryService.updateCategory()       │
└────────────┬────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────┐
│  Step 1: Find Existing Category         │
│  CategoryRepository.findOne({           │
│    where: { id, businessId }            │
│  })                                     │
└────────────┬────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────┐
│  Step 2: Check Name Change              │
│  if (existingCategory.name !== newName) │
└────────────┬────────────────────────────┘
             │
             ▼ Name Changed
┌─────────────────────────────────────────┐
│  Step 3: Check Duplicate Name           │
│  CategoryRepository.findOne({           │
│    where: { name: ILike(newName) }      │
│  })                                     │
└────────────┬────────────────────────────┘
             │
             ├─── Exists? ──► ConflictException
             │
             ▼ Unique
┌─────────────────────────────────────────┐
│  Step 4: Validate New Parent (if any)   │
│  if (parentId)                          │
│    CategoryRepository.findOne({         │
│      where: { id: parentId }            │
│    })                                   │
└────────────┬────────────────────────────┘
             │
             ├─── Not Found? ──► NotFoundException
             │
             ▼ Valid
┌─────────────────────────────────────────┐
│  Step 5: Update Category                │
│  CategoryRepository.update(             │
│    { id, businessId },                  │
│    {                                    │
│      ...updateData,                     │
│      name,                              │
│      parent: parentEntity               │
│    }                                    │
│  )                                      │
└────────────┬────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────┐
│  Response: 200 OK                       │
│  { message: "Category updated" }        │
└─────────────────────────────────────────┘
```

### 4. Delete Category Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    DELETE CATEGORY                              │
└─────────────────────────────────────────────────────────────────┘

Client Request
     │
     │  DELETE /categories/:id
     │  Headers: { Authorization: Bearer <JWT> }
     │
     ▼
┌─────────────────────────────────────────┐
│  CategoryController.deleteCategory()    │
│  - Extract businessId from JWT          │
└────────────┬────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────┐
│  CategoryService.deleteCategory()       │
└────────────┬────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────┐
│  Step 1: Find Category                  │
│  CategoryRepository.findOne({           │
│    where: { id, businessId }            │
│  })                                     │
└────────────┬────────────────────────────┘
             │
             ├─── Not Found? ──► NotFoundException
             │
             ▼ Found
┌─────────────────────────────────────────┐
│  Step 2: Soft Delete Category           │
│  CategoryRepository.delete({            │
│    id, businessId                       │
│  })                                     │
│                                         │
│  (Sets deletedAt timestamp)             │
└────────────┬────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────┐
│  Response: 200 OK                       │
│  { message: "Category deleted" }        │
└─────────────────────────────────────────┘

NOTE: Child categories are NOT automatically deleted
      They remain but lose parent reference
```

---

## 🧩 Add-ons Module Flow

### 1. Create Add-on Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    CREATE ADD-ON                                │
└─────────────────────────────────────────────────────────────────┘

Client Request
     │
     │  POST /addons
     │  Body: {
     │    name: "Extra Cheese",
     │    price: 2.50,
     │    description: "Premium cheddar cheese",
     │    coverImg: "cheese.jpg"
     │  }
     │
     ▼
┌─────────────────────────────────────────┐
│  AddonsController.createAddOn()         │
└────────────┬────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────┐
│  AddonsService.createAddOn()            │
└────────────┬────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────┐
│  Step 1: Check Duplicate Name           │
│  AddonsRepository.findOne({             │
│    where: { name: ILike(name) }         │
│  })                                     │
└────────────┬────────────────────────────┘
             │
             ├─── Exists? ──► ConflictException
             │                "Add-on with same name exists"
             │
             ▼ Not Exists
┌─────────────────────────────────────────┐
│  Step 2: Save Add-on                    │
│  AddonsRepository.save(addonData)       │
└────────────┬────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────┐
│  Response: 200 OK                       │
│  { message: "Add-on created" }          │
└─────────────────────────────────────────┘
```



### 2. Find All Add-ons Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    FIND ALL ADD-ONS                             │
└─────────────────────────────────────────────────────────────────┘

Client Request
     │
     │  GET /addons
     │
     ▼
┌─────────────────────────────────────────┐
│  AddonsController.findAllAddOns()       │
└────────────┬────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────┐
│  AddonsService.findAllAddOns()          │
└────────────┬────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────┐
│  Fetch All Add-ons                      │
│  AddonsRepository.find()                │
└────────────┬────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────┐
│  Transform to Response Format           │
│  addons.map(addon => ({                 │
│    id, price, name,                     │
│    description, coverImg                │
│  }))                                    │
└────────────┬────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────┐
│  Response: 200 OK                       │
│  [                                      │
│    {                                    │
│      id: "addon-1",                     │
│      name: "Extra Cheese",              │
│      price: 2.50,                       │
│      description: "...",                │
│      coverImg: "cheese.jpg"             │
│    }                                    │
│  ]                                      │
└─────────────────────────────────────────┘
```

### 3. Update Add-on Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    UPDATE ADD-ON                                │
└─────────────────────────────────────────────────────────────────┘

Client Request
     │
     │  PATCH /addons/:id
     │  Body: {
     │    name: "Premium Cheese",
     │    price: 3.00
     │  }
     │
     ▼
┌─────────────────────────────────────────┐
│  AddonsController.updateAddOn()         │
└────────────┬────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────┐
│  AddonsService.updateAddOn()            │
└────────────┬────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────┐
│  Step 1: Find Existing Add-on           │
│  AddonsRepository.findOne({             │
│    where: { id }                        │
│  })                                     │
└────────────┬────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────┐
│  Step 2: Check Name Change              │
│  if (existingAddon.name !== newName)    │
└────────────┬────────────────────────────┘
             │
             ▼ Name Changed
┌─────────────────────────────────────────┐
│  Step 3: Check Duplicate Name           │
│  AddonsRepository.findOne({             │
│    where: { name: ILike(newName) }      │
│  })                                     │
└────────────┬────────────────────────────┘
             │
             ├─── Exists? ──► ConflictException
             │
             ▼ Unique
┌─────────────────────────────────────────┐
│  Step 4: Update Add-on                  │
│  AddonsRepository.update(id, updateData)│
└────────────┬────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────┐
│  Response: 200 OK                       │
│  { message: "Add-on updated" }          │
└─────────────────────────────────────────┘
```

### 4. Delete Add-on Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    DELETE ADD-ON                                │
└─────────────────────────────────────────────────────────────────┘

Client Request
     │
     │  DELETE /addons/:id
     │
     ▼
┌─────────────────────────────────────────┐
│  AddonsController.deleteAddOn()         │
└────────────┬────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────┐
│  AddonsService.deleteAddOn()            │
└────────────┬────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────┐
│  Soft Delete Add-on                     │
│  AddonsRepository.delete(id)            │
└────────────┬────────────────────────────┘
             │
             ├─── Not Found? ──► NotFoundException
             │                   "Add-on not found"
             │
             ▼ Deleted
┌─────────────────────────────────────────┐
│  Response: 200 OK                       │
│  { message: "Add-on deleted" }          │
└─────────────────────────────────────────┘
```

---

## ⭐ Menu Rating Module Flow

### 1. Create Menu Rating Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    CREATE MENU RATING                           │
└─────────────────────────────────────────────────────────────────┘

Client Request
     │
     │  POST /menu-rating
     │  Headers: { Authorization: Bearer <JWT> }
     │  Body: {
     │    menuId: "menu-123",
     │    rating: 4.5,
     │    comments: "Delicious!",
     │    businessId: "business-1"
     │  }
     │
     ▼
┌─────────────────────────────────────────┐
│  MenuRatingController.createMenuRating()│
│  - Extract userId from JWT              │
└────────────┬────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────┐
│  MenuRatingService.createMenuRating()   │
└────────────┬────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────┐
│  Step 1: Check Existing Rating          │
│  MenuRatingRepository.findOne({         │
│    where: {                             │
│      menu: { id: menuId },              │
│      ratedBy: userId                    │
│    }                                    │
│  })                                     │
└────────────┬────────────────────────────┘
             │
             ├─── Exists? ──► BadRequestException
             │                "Already reviewed"
             │
             ▼ Not Exists
┌─────────────────────────────────────────┐
│  Step 2: Create Rating                  │
│  MenuRatingRepository.save({            │
│    rating,                              │
│    comments,                            │
│    businessId,                          │
│    ratedBy: userId,                     │
│    menu: { id: menuId }                 │
│  })                                     │
└────────────┬────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────┐
│  Response: 200 OK                       │
│  { message: "Menu rating created" }     │
└─────────────────────────────────────────┘

CONSTRAINT:
┌─────────────────────────────────────────┐
│  One rating per user per menu item      │
│  - User can update existing rating      │
│  - Cannot create duplicate ratings      │
└─────────────────────────────────────────┘
```



### 2. Get Menu Ratings Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    GET MENU RATINGS                             │
└─────────────────────────────────────────────────────────────────┘

Client Request
     │
     │  GET /menu-rating?menuId=menu-123
     │
     ▼
┌─────────────────────────────────────────┐
│  MenuRatingController.getMenuRatings()  │
└────────────┬────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────┐
│  MenuRatingService.getMenuRatings()     │
└────────────┬────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────┐
│  Fetch Ratings for Menu                 │
│  MenuRatingRepository.find({            │
│    where: { menu: { id: menuId } }      │
│  })                                     │
└────────────┬────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────┐
│  Transform to Response Format           │
│  ratings.map(rating => ({               │
│    id, rating, comments,                │
│    ratedBy, businessId,                 │
│    menu: { name, description }          │
│  }))                                    │
└────────────┬────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────┐
│  Response: 200 OK                       │
│  [                                      │
│    {                                    │
│      id: "rating-1",                    │
│      rating: 4.5,                       │
│      comments: "Delicious!",            │
│      ratedBy: "user-1",                 │
│      businessId: "business-1",          │
│      menu: {                            │
│        name: "Burger",                  │
│        description: "..."               │
│      }                                  │
│    }                                    │
│  ]                                      │
└─────────────────────────────────────────┘
```

### 3. Get Business Menu Ratings Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    GET BUSINESS MENU RATINGS                    │
└─────────────────────────────────────────────────────────────────┘

Client Request
     │
     │  GET /menu-rating/business/:businessId
     │
     ▼
┌─────────────────────────────────────────┐
│  MenuRatingController                   │
│    .getBusinessMenuRatings()            │
└────────────┬────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────┐
│  MenuRatingService                      │
│    .getBusinessMenuRatings()            │
└────────────┬────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────┐
│  Fetch All Ratings for Business         │
│  MenuRatingRepository.find({            │
│    where: { businessId }                │
│  })                                     │
└────────────┬────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────┐
│  Transform and Return                   │
│  (Same format as menu ratings)          │
└────────────┬────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────┐
│  Response: 200 OK                       │
│  Array of all ratings for business      │
└─────────────────────────────────────────┘
```

### 4. Update Menu Rating Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    UPDATE MENU RATING                           │
└─────────────────────────────────────────────────────────────────┘

Client Request
     │
     │  PATCH /menu-rating
     │  Headers: { Authorization: Bearer <JWT> }
     │  Body: {
     │    menuId: "menu-123",
     │    rating: 5.0,
     │    comments: "Even better than before!"
     │  }
     │
     ▼
┌─────────────────────────────────────────┐
│  MenuRatingController.updateMenuRating()│
│  - Extract userId from JWT              │
└────────────┬────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────┐
│  MenuRatingService.updateMenuRating()   │
└────────────┬────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────┐
│  Step 1: Find User's Rating             │
│  MenuRatingRepository.findOne({         │
│    where: {                             │
│      menu: { id: menuId },              │
│      ratedBy: userId                    │
│    }                                    │
│  })                                     │
└────────────┬────────────────────────────┘
             │
             ├─── Not Found? ──► NotFoundException
             │                   "Rating not found"
             │
             ▼ Found
┌─────────────────────────────────────────┐
│  Step 2: Update Rating                  │
│  MenuRatingRepository.update(           │
│    menuRating.id,                       │
│    { rating, comments }                 │
│  )                                      │
└────────────┬────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────┐
│  Response: 200 OK                       │
│  { message: "Menu rating updated" }     │
└─────────────────────────────────────────┘
```

### 5. Delete Menu Rating Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    DELETE MENU RATING                           │
└─────────────────────────────────────────────────────────────────┘

Client Request
     │
     │  DELETE /menu-rating/:id
     │  Headers: { Authorization: Bearer <JWT> }
     │
     ▼
┌─────────────────────────────────────────┐
│  MenuRatingController.deleteRating()    │
│  - Extract userId from JWT              │
└────────────┬────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────┐
│  MenuRatingService.deleteRating()       │
└────────────┬────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────┐
│  Step 1: Verify Ownership               │
│  MenuRatingRepository.findOne({         │
│    where: {                             │
│      id,                                │
│      ratedBy: userId                    │
│    }                                    │
│  })                                     │
└────────────┬────────────────────────────┘
             │
             ├─── Not Found? ──► NotFoundException
             │                   "Rating not found"
             │
             ▼ Found & Owned
┌─────────────────────────────────────────┐
│  Step 2: Delete Rating                  │
│  MenuRatingRepository.delete({          │
│    id: menuRating.id                    │
│  })                                     │
└────────────┬────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────┐
│  Response: 200 OK                       │
│  { message: "Menu rating deleted" }     │
└─────────────────────────────────────────┘

SECURITY:
┌─────────────────────────────────────────┐
│  Users can only delete their own ratings│
│  - Ownership verified by ratedBy field  │
│  - Cannot delete other users' ratings   │
└─────────────────────────────────────────┘
```

---

## 📊 Module Interaction Summary

```
┌─────────────────────────────────────────────────────────────────┐
│                    MODULE DEPENDENCIES                          │
└─────────────────────────────────────────────────────────────────┘

Menu Module
├─ Depends on: Category, Add-ons
├─ Used by: Cart, Order, Menu Rating
└─ Repositories: Menu, Category, Add-ons

Cart Module
├─ Depends on: Menu, Add-ons
├─ Used by: Order (indirectly)
└─ Repositories: Cart, CartItem, CartItemAddOns

Order Module
├─ Depends on: Menu, Add-ons, ServiceCommunication
├─ Used by: None (top-level)
└─ Repositories: Order, OrderItem, OrderItemAddon, OrderStatus

Category Module
├─ Depends on: None (self-referencing)
├─ Used by: Menu
└─ Repositories: Category

Add-ons Module
├─ Depends on: None
├─ Used by: Menu, Cart, Order
└─ Repositories: Add-ons

Menu Rating Module
├─ Depends on: Menu
├─ Used by: None
└─ Repositories: MenuRating

Service Communication Module
├─ External service calls
├─ Used by: Order
└─ Fetches: User info, Business info
```



---

## 🔄 Common Patterns Across Modules

### 1. Duplicate Name Check Pattern

```
Used in: Menu, Category, Add-ons

┌─────────────────────────────────────────┐
│  Repository.findOne({                   │
│    where: { name: ILike(inputName) }    │
│  })                                     │
│                                         │
│  if (exists)                            │
│    throw ConflictException              │
└─────────────────────────────────────────┘

Purpose: Prevent duplicate entries
Case-insensitive: Uses ILike for comparison
```

### 2. Ownership Validation Pattern

```
Used in: Menu, Category, Cart, Order, Rating

┌─────────────────────────────────────────┐
│  Repository.findOne({                   │
│    where: {                             │
│      id: resourceId,                    │
│      [ownerField]: ownerId              │
│    }                                    │
│  })                                     │
│                                         │
│  if (!found)                            │
│    throw NotFoundException              │
└─────────────────────────────────────────┘

Purpose: Ensure user can only modify their own data
Owner Fields:
- businessId (for business resources)
- userId (for user resources)
- ratedBy (for ratings)
```

### 3. Soft Delete Pattern

```
Used in: All modules (via BaseEntity)

┌─────────────────────────────────────────┐
│  Repository.delete({ id })              │
│                                         │
│  Internally:                            │
│  - Sets deletedAt = now()               │
│  - Does NOT remove from database        │
│  - Excluded from queries automatically  │
└─────────────────────────────────────────┘

Benefits:
- Data recovery possible
- Audit trail maintained
- Referential integrity preserved
```

### 4. Price Snapshot Pattern

```
Used in: Order module

┌─────────────────────────────────────────┐
│  CART PHASE:                            │
│  - References Menu/AddOn (live price)   │
│                                         │
│  ORDER PHASE:                           │
│  - Fetches current price                │
│  - Stores in OrderItem/OrderItemAddon   │
│  - Price frozen at order time           │
└─────────────────────────────────────────┘

Purpose: Historical accuracy
Ensures: Past orders show correct prices
```

### 5. Status History Pattern

```
Used in: Order module

┌─────────────────────────────────────────┐
│  New status = Create new record         │
│  (NOT update existing)                  │
│                                         │
│  OrderStatus records:                   │
│  - Multiple per order                   │
│  - Sorted by createdAt                  │
│  - Latest = current status              │
└─────────────────────────────────────────┘

Purpose: Complete audit trail
Tracks: Who changed, when, what status
```

### 6. Hierarchical Data Pattern

```
Used in: Category module

┌─────────────────────────────────────────┐
│  Self-referencing relationship:         │
│  - parent: CategoryEntity               │
│  - childrens: CategoryEntity[]          │
│                                         │
│  Query root categories:                 │
│  - where: { parent: IsNull() }          │
│                                         │
│  Load with relations:                   │
│  - relations: { childrens: true }       │
└─────────────────────────────────────────┘

Purpose: Nested category structure
Depth: Supports multiple levels
```

### 7. Many-to-Many with Junction Pattern

```
Used in: Menu ↔ Add-ons, Cart ↔ Add-ons, Order ↔ Add-ons

┌─────────────────────────────────────────┐
│  MENU ↔ ADD-ONS:                        │
│  - Direct many-to-many                  │
│  - @JoinTable decorator                 │
│  - No extra fields needed               │
│                                         │
│  CART ↔ ADD-ONS:                        │
│  - Junction: CartItemAddOns             │
│  - Extra field: quantity                │
│                                         │
│  ORDER ↔ ADD-ONS:                       │
│  - Junction: OrderItemAddon             │
│  - Extra fields: quantity, price        │
└─────────────────────────────────────────┘

When to use junction table:
- Need extra fields (quantity, price)
- Need to track relationship metadata
```

### 8. Pagination Pattern

```
Used in: Menu module

┌─────────────────────────────────────────┐
│  Input:                                 │
│  - page (default: 1)                    │
│  - take (default: 10)                   │
│                                         │
│  Calculate:                             │
│  - skip = (page - 1) × take             │
│                                         │
│  Query:                                 │
│  - findAndCount({ skip, take })         │
│                                         │
│  Response:                              │
│  - metaData: {                          │
│      currentPage,                       │
│      totalPages,                        │
│      totalCount,                        │
│      perPage                            │
│    }                                    │
│  - data: [...]                          │
└─────────────────────────────────────────┘
```

### 9. Filtering Pattern

```
Used in: Menu, Order modules

┌─────────────────────────────────────────┐
│  Build dynamic where clause:            │
│                                         │
│  whereClause = { baseField: value }     │
│                                         │
│  if (filter1)                           │
│    whereClause.field1 = filter1         │
│                                         │
│  if (filter2)                           │
│    whereClause.field2 = filter2         │
│                                         │
│  if (dateRange)                         │
│    whereClause.date =                   │
│      Between(start, end)                │
│                                         │
│  Repository.find({ where: whereClause })│
└─────────────────────────────────────────┘

Filters:
- Name search (Like/ILike)
- Category filter
- Price range (Between)
- Date range (Between)
- Status filter
```

### 10. Transformation Pattern

```
Used in: All modules

┌─────────────────────────────────────────┐
│  Private method in service:             │
│                                         │
│  transformToResponse(entity) {          │
│    // Extract needed fields             │
│    // Format data                       │
│    // Calculate derived values          │
│    // Return clean response object      │
│  }                                      │
│                                         │
│  Purpose:                               │
│  - Hide internal fields                 │
│  - Format for API response              │
│  - Add calculated fields                │
│  - Consistent response structure        │
└─────────────────────────────────────────┘

Examples:
- transformToMenuResponse()
- transformToCartResponse()
- transformToOrderResponse()
- transformToCategoryResponse()
```

---

## 🎯 Key Takeaways

### Module Responsibilities

1. **Menu Module**: Core product catalog management
2. **Cart Module**: Temporary shopping state
3. **Order Module**: Permanent transaction records
4. **Category Module**: Product organization
5. **Add-ons Module**: Product customization options
6. **Menu Rating Module**: Customer feedback

### Data Flow

```
Browse → Add to Cart → Checkout → Order → Rate

Menu ──► Cart ──► Order ──► Rating
  │        │        │
  ▼        ▼        ▼
AddOns   AddOns   AddOns
  │        │        │
  ▼        ▼        ▼
(Live)  (Live)  (Snapshot)
```

### Security Layers

1. **Authentication**: JWT token validation
2. **Authorization**: Role-based access control
3. **Ownership**: businessId/userId validation
4. **Input Validation**: DTO validation
5. **Duplicate Prevention**: Unique constraints

### Performance Considerations

1. **Eager Loading**: Load relations when needed
2. **Pagination**: Limit result sets
3. **Indexing**: businessId, userId, foreign keys
4. **Soft Deletes**: Filter by deletedAt IS NULL
5. **Query Optimization**: Select only needed fields

---

**Document Version:** 1.0  
**Last Updated:** 2024  
**Modules Covered:** 6 (Menu, Cart, Order, Category, Add-ons, Menu Rating)
