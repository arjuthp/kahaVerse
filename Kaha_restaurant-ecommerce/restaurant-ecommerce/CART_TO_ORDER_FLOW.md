# Cart-to-Order Conversion Flow Diagram

## 🔄 Complete Flow Visualization

```
┌─────────────────────────────────────────────────────────────────────┐
│                     CART-TO-ORDER CONVERSION FLOW                    │
└─────────────────────────────────────────────────────────────────────┘

┌──────────────┐
│   CLIENT     │
│  (Postman/   │
│   Frontend)  │
└──────┬───────┘
       │
       │ POST /order/from-cart
       │ Authorization: Bearer <JWT>
       │ Body: { businessId, serviceType, cartItemIds?, ... }
       │
       ▼
┌──────────────────────────────────────────────────────────────────────┐
│                         ORDER CONTROLLER                              │
│  ┌────────────────────────────────────────────────────────────────┐  │
│  │  @Post("from-cart")                                            │  │
│  │  @UseGuards(JwtAuthGuard)                                      │  │
│  │  createOrderFromCart(@Body() body, @Req() req)                 │  │
│  └────────────────────────────────────────────────────────────────┘  │
└──────────────────────────┬───────────────────────────────────────────┘
                           │
                           │ Extract userId from JWT
                           │ Validate DTO
                           │
                           ▼
┌──────────────────────────────────────────────────────────────────────┐
│                          ORDER SERVICE                                │
│  ┌────────────────────────────────────────────────────────────────┐  │
│  │  createOrderFromCart(body, userId)                             │  │
│  └────────────────────────────────────────────────────────────────┘  │
└──────────────────────────┬───────────────────────────────────────────┘
                           │
                           ▼
                    ┌──────────────┐
                    │ STEP 1:      │
                    │ Fetch Cart   │
                    └──────┬───────┘
                           │
                           │ CartRepository.findOne({ userId })
                           │ Relations: cartItems, menu, variant, addons
                           │
                           ▼
                    ┌──────────────┐
                    │ Validation   │
                    │ - Cart exists│
                    │ - Not empty  │
                    └──────┬───────┘
                           │
                           ▼
                    ┌──────────────────────┐
                    │ STEP 2:              │
                    │ Filter Cart Items    │
                    └──────┬───────────────┘
                           │
                ┌──────────┴──────────┐
                │                     │
         ┌──────▼──────┐      ┌──────▼──────┐
         │ Full Cart   │      │ Partial     │
         │ Checkout    │      │ Checkout    │
         │             │      │             │
         │ All items   │      │ Selected    │
         │ from cart   │      │ cartItemIds │
         └──────┬──────┘      └──────┬──────┘
                │                     │
                └──────────┬──────────┘
                           │
                           ▼
                    ┌──────────────────────┐
                    │ STEP 3:              │
                    │ Business Validation  │
                    └──────┬───────────────┘
                           │
                           │ Check all items belong to businessId
                           │ Throw error if mismatch
                           │
                           ▼
                    ┌──────────────────────┐
                    │ STEP 4:              │
                    │ Create Order Entity  │
                    └──────┬───────────────┘
                           │
                           │ OrderRepository.save({
                           │   userId, businessId,
                           │   orderNumber: "ORD-{timestamp}",
                           │   serviceType, tableNumber,
                           │   paymentMethod, remarks,
                           │   deliveryFee, serviceCharge,
                           │   discountAmount, tipAmount
                           │ })
                           │
                           ▼
                    ┌──────────────────────────────┐
                    │ STEP 5:                      │
                    │ Process Each Cart Item       │
                    └──────┬───────────────────────┘
                           │
                           │ For each cart item:
                           │
                           ▼
            ┌──────────────────────────────────┐
            │ 5.1: Validate Menu Item          │
            │ - MenuRepository.findOne()       │
            │ - Check isAvailable              │
            └──────┬───────────────────────────┘
                   │
                   ▼
            ┌──────────────────────────────────┐
            │ 5.2: Validate Variant (if any)   │
            │ - MenuVariantRepository.findOne()│
            │ - Check isAvailable              │
            └──────┬───────────────────────────┘
                   │
                   ▼
            ┌──────────────────────────────────┐
            │ 5.3: Calculate Addon Totals      │
            │                                  │
            │ For each addon:                  │
            │   - Validate addon exists        │
            │   - addonTotal = price × qty     │
            │   - Sum all addon totals         │
            └──────┬───────────────────────────┘
                   │
                   ▼
            ┌──────────────────────────────────┐
            │ 5.4: Calculate Item Total        │
            │                                  │
            │ itemSubtotal = price × quantity  │
            │ lineTotal = itemSubtotal +       │
            │             addonsTotal          │
            └──────┬───────────────────────────┘
                   │
                   ▼
            ┌──────────────────────────────────┐
            │ 5.5: Create Order Item           │
            │                                  │
            │ OrderItemRepository.save({       │
            │   quantity,                      │
            │   menuNameSnapshot,              │
            │   variantNameSnapshot,           │
            │   unitPriceSnapshot,             │
            │   addonsTotal,                   │
            │   lineTotal,                     │
            │   menu, menuVariant, order       │
            │ })                               │
            └──────┬───────────────────────────┘
                   │
                   ▼
            ┌──────────────────────────────────┐
            │ 5.6: Create Order Item Addons    │
            │                                  │
            │ For each addon:                  │
            │   OrderItemAddonRepository.save({│
            │     quantity,                    │
            │     addonNameSnapshot,           │
            │     addonGroupNameSnapshot,      │
            │     unitPriceSnapshot,           │
            │     lineTotal,                   │
            │     addon, orderItem             │
            │   })                             │
            └──────┬───────────────────────────┘
                   │
                   │ Return lineTotal
                   │
                   ▼
                    ┌──────────────────────────────┐
                    │ STEP 6:                      │
                    │ Calculate Order Totals       │
                    └──────┬───────────────────────┘
                           │
                           │ subtotal = Σ(lineTotal)
                           │ taxAmount = subtotal × 0.13
                           │ totalAmount = subtotal +
                           │               taxAmount +
                           │               deliveryFee +
                           │               serviceCharge -
                           │               discountAmount +
                           │               tipAmount
                           │
                           ▼
                    ┌──────────────────────────────┐
                    │ STEP 7:                      │
                    │ Update Order with Totals     │
                    └──────┬───────────────────────┘
                           │
                           │ OrderRepository.save(order)
                           │
                           ▼
                    ┌──────────────────────────────┐
                    │ STEP 8:                      │
                    │ Create Order Status          │
                    └──────┬───────────────────────┘
                           │
                           │ OrderStatusRepository.save({
                           │   order,
                           │   status: PENDING,
                           │   updatedBy: userId
                           │ })
                           │
                           ▼
                    ┌──────────────────────────────┐
                    │ STEP 9:                      │
                    │ Clean Up Cart                │
                    └──────┬───────────────────────┘
                           │
                           │ CartItemRepository.remove(
                           │   itemsToOrder
                           │ )
                           │
                           ▼
                    ┌──────────────────────────────┐
                    │ STEP 10:                     │
                    │ Return Success Response      │
                    └──────┬───────────────────────┘
                           │
                           │ { message: "Order created..." }
                           │
                           ▼
┌──────────────────────────────────────────────────────────────────────┐
│                         RESPONSE TO CLIENT                            │
│  ┌────────────────────────────────────────────────────────────────┐  │
│  │  {                                                             │  │
│  │    "message": "Order created successfully.                     │  │
│  │                3 item(s) ordered.                              │  │
│  │                Order #ORD-1716234567890,                       │  │
│  │                Total: 1519"                                    │  │
│  │  }                                                             │  │
│  └────────────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────────┘
```

---

## 🔍 Detailed Step Breakdown

### STEP 1: Fetch Cart
```typescript
const cart = await this.cartRepository.findOne({
  where: { userId },
  relations: {
    cartItems: {
      menu: true,
      menuVariant: true,
      addOns: { menuAddOn: true }
    }
  }
});
```

**Validations**:
- ✅ Cart exists
- ✅ Cart has items

---

### STEP 2: Filter Cart Items

#### Option A: Full Cart Checkout
```typescript
let itemsToOrder = cart.cartItems;
```

#### Option B: Partial Cart Checkout
```typescript
if (cartItemIds && cartItemIds.length > 0) {
  itemsToOrder = cart.cartItems.filter(
    item => cartItemIds.includes(item.id)
  );
}
```

---

### STEP 3: Business Validation
```typescript
const invalidItems = itemsToOrder.filter(
  item => item.menu.businessId !== businessId
);

if (invalidItems.length > 0) {
  throw new BadRequestException(
    `Some cart items do not belong to business ${businessId}`
  );
}
```

---

### STEP 4: Create Order Entity
```typescript
const orderNumber = `ORD-${Date.now()}`;
const order = await this.orderRepository.save({
  userId,
  businessId,
  orderNumber,
  serviceType,
  tableNumber,
  remarks,
  paymentMethod,
  deliveryFee: deliveryFee || (serviceType === 'DELIVERY' ? 5 : 0),
  serviceCharge: serviceCharge || 0,
  discountAmount: discountAmount || 0,
  tipAmount: tipAmount || 0,
  subtotal: 0,  // Will be calculated
  taxAmount: 0, // Will be calculated
  totalAmount: 0 // Will be calculated
});
```

---

### STEP 5: Process Each Cart Item

#### 5.1: Validate Menu Item
```typescript
const currentMenu = await this.menuRepository.findOne({
  where: { id: menu.id }
});

if (!currentMenu || !currentMenu.isAvailable) {
  throw new BadRequestException(
    `Menu item "${menu.name}" is no longer available`
  );
}
```

#### 5.2: Validate Variant
```typescript
if (menuVariant) {
  const currentVariant = await this.menuVariantRepository.findOne({
    where: { id: menuVariant.id }
  });

  if (!currentVariant || !currentVariant.isAvailable) {
    throw new BadRequestException(
      `Variant "${menuVariant.name}" is no longer available`
    );
  }
}
```

#### 5.3: Calculate Addon Totals
```typescript
let addonsTotal = 0;
const addonDetails = [];

for (const cartAddon of addOns || []) {
  const currentAddon = await this.addonsRepository.findOne({
    where: { id: menuAddOn.id },
    relations: ['addonGroup']
  });

  const addonUnitPrice = Number(addonPrice || currentAddon.price);
  const addonLineTotal = addonQuantity * addonUnitPrice;
  addonsTotal += addonLineTotal;

  addonDetails.push({
    quantity: addonQuantity,
    addonNameSnapshot: currentAddon.name,
    addonGroupNameSnapshot: currentAddon.addonGroup?.name || "Addon",
    unitPriceSnapshot: addonUnitPrice,
    lineTotal: addonLineTotal,
    addon: { id: currentAddon.id }
  });
}
```

#### 5.4: Calculate Item Total
```typescript
const itemUnitPrice = Number(unitPriceSnapshot);
const itemSubtotal = itemUnitPrice * quantity;
const lineTotal = itemSubtotal + addonsTotal;
```

#### 5.5: Create Order Item
```typescript
const savedOrderItem = await this.orderItemRepository.save({
  quantity,
  menuNameSnapshot: menu.name,
  variantNameSnapshot: menuVariant?.name || null,
  unitPriceSnapshot: itemUnitPrice,
  addonsTotal,
  lineTotal,
  menu: { id: menu.id },
  menuVariant: menuVariant ? { id: menuVariant.id } : null,
  order
});
```

#### 5.6: Create Order Item Addons
```typescript
for (const addon of addonDetails) {
  await this.orderItemAddonRepository.save({
    ...addon,
    orderItem: savedOrderItem
  });
}
```

---

### STEP 6: Calculate Order Totals
```typescript
const subtotal = orderItemTotals.reduce((sum, value) => sum + value, 0);
const taxAmount = subtotal * 0.13; // 13% tax

order.subtotal = subtotal;
order.taxAmount = taxAmount;
order.totalAmount = 
  subtotal + 
  taxAmount + 
  order.deliveryFee + 
  order.serviceCharge - 
  order.discountAmount + 
  order.tipAmount;
```

---

### STEP 7: Update Order
```typescript
await this.orderRepository.save(order);
```

---

### STEP 8: Create Order Status
```typescript
await this.orderStatusRepository.save({
  order: order,
  status: OrderStatusEnum.PENDING,
  updatedBy: userId
});
```

---

### STEP 9: Clean Up Cart
```typescript
await this.cartItemRepository.remove(itemsToOrder);
```

---

### STEP 10: Return Success
```typescript
return { 
  message: `Order created successfully. ${itemsToOrder.length} item(s) ordered. Order #${order.orderNumber}, Total: ${order.totalAmount}`
};
```

---

## 🎯 Data Flow Example

### Input (Request Body)
```json
{
  "businessId": "1df39051-0b84-4b19-a6c3-030ba726997d",
  "serviceType": "DINE_IN",
  "tableNumber": "T-12",
  "cartItemIds": ["cart-item-1", "cart-item-2"]
}
```

### Cart Data (From Database)
```json
{
  "id": "cart-uuid",
  "userId": "user-uuid",
  "cartItems": [
    {
      "id": "cart-item-1",
      "quantity": 2,
      "unitPriceSnapshot": 500,
      "menu": {
        "id": "menu-1",
        "name": "Burger",
        "businessId": "1df39051-0b84-4b19-a6c3-030ba726997d"
      },
      "menuVariant": {
        "id": "variant-1",
        "name": "Large"
      },
      "addOns": [
        {
          "quantity": 2,
          "unitPriceSnapshot": 50,
          "menuAddOn": {
            "id": "addon-1",
            "name": "Extra Cheese"
          }
        }
      ]
    },
    {
      "id": "cart-item-2",
      "quantity": 1,
      "unitPriceSnapshot": 200,
      "menu": {
        "id": "menu-2",
        "name": "Fries",
        "businessId": "1df39051-0b84-4b19-a6c3-030ba726997d"
      },
      "addOns": []
    }
  ]
}
```

### Calculation Process
```
Item 1 (Burger Large × 2):
  Base: 500 × 2 = 1000
  Addon (Extra Cheese × 2): 50 × 2 = 100
  Line Total: 1100

Item 2 (Fries × 1):
  Base: 200 × 1 = 200
  Line Total: 200

Order Totals:
  Subtotal: 1100 + 200 = 1300
  Tax (13%): 1300 × 0.13 = 169
  Delivery Fee: 0 (DINE_IN)
  Service Charge: 0
  Discount: 0
  Tip: 0
  ─────────────────────
  Total: 1469
```

### Output (Response)
```json
{
  "message": "Order created successfully. 2 item(s) ordered. Order #ORD-1716234567890, Total: 1469"
}
```

### Database Changes
```
✅ order_entity: 1 new row
✅ order_item_entity: 2 new rows
✅ order_item_addon_entity: 1 new row
✅ order_status_entity: 1 new row
❌ cart_item_entity: 2 rows deleted
```

---

## 🔒 Security Flow

```
┌─────────────┐
│   Request   │
└──────┬──────┘
       │
       ▼
┌─────────────────┐
│  JWT Auth Guard │ ← Validates JWT token
└──────┬──────────┘
       │
       ▼
┌─────────────────┐
│ Extract User ID │ ← From JWT payload
└──────┬──────────┘
       │
       ▼
┌─────────────────┐
│  Fetch Cart     │ ← Only user's cart
│  (userId)       │
└──────┬──────────┘
       │
       ▼
┌─────────────────┐
│ Validate        │ ← All items belong to
│ Business ID     │   specified business
└──────┬──────────┘
       │
       ▼
┌─────────────────┐
│ Create Order    │ ← Associated with
│ (userId)        │   authenticated user
└─────────────────┘
```

---

## 📊 Database Transaction Flow

```
BEGIN TRANSACTION
  │
  ├─ Create Order Entity
  │
  ├─ For each cart item:
  │   ├─ Validate menu item
  │   ├─ Validate variant
  │   ├─ Validate addons
  │   ├─ Create order item
  │   └─ Create order item addons
  │
  ├─ Update order totals
  │
  ├─ Create order status
  │
  └─ Delete cart items
  │
COMMIT TRANSACTION
```

**Note**: Current implementation doesn't use explicit transaction. Consider wrapping in transaction for atomicity.

---

## 🎉 Success Indicators

### ✅ Order Created Successfully
- Order entity saved with unique order number
- Order items created with correct quantities
- Order item addons created with correct prices
- Order status initialized to PENDING
- Cart items removed from cart

### ✅ Prices Calculated Correctly
- Item subtotals = price × quantity
- Addon totals = Σ(addon price × addon quantity)
- Line totals = item subtotal + addon total
- Order subtotal = Σ(line totals)
- Tax = subtotal × 13%
- Total = subtotal + tax + fees - discount + tip

### ✅ Data Integrity Maintained
- All items belong to same business
- Menu items are available
- Variants are available (if applicable)
- Addons exist in system
- User owns the cart

---

**Last Updated**: May 20, 2026  
**Flow Version**: 1.0  
**Status**: ✅ PRODUCTION READY
