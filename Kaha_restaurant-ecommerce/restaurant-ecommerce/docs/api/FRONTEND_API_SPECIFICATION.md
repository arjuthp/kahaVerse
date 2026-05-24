# Complete Frontend API Specification (Unified V1 & V2)

This document is the **Master Reference** for the frontend team. It covers the entire E-Commerce microservice flow from end-to-end, combining all core (V1) features and the new advanced (V2) features into one unified guide.

---

## 1. Core Data Models (Interfaces)

The frontend must type its state using these structures to prevent parsing errors.

### 1.1 Category & Menu Entities
```typescript
interface Category {
  id: string;
  name: string;
  description: string;
  image: string;
  businessId: string;
}

interface Menu {
  id: string;
  name: string;
  description: string;
  image: string;
  isAvailable: boolean;
  isSignature: boolean;
  categoryId: string;
  variants: MenuVariant[];    // V2: Dynamic Pricing & Sizes
  addonGroups: AddonGroup[];  // V2: Addon rules
}

interface MenuVariant {
  id: string;
  name: string;   // e.g., "Small", "Regular"
  price: number; 
  isAvailable: boolean;
}
```

### 1.2 Addons & Rules Entities
```typescript
enum AddonSelectionTypeEnum {
  SINGLE = "single", // UI must render Radio Buttons
  MULTI = "multi",   // UI must render Checkboxes
}

interface AddonGroup {
  id: string;
  name: string;        // e.g., "Choose your Sauce"
  isRequired: boolean; // Validation: Must pick at least `minSelect`
  minSelect: number;   // Validation: Minimum required choices
  maxSelect: number;   // Validation: Max allowed choices (Disable checkboxes if reached)
  selectionType: AddonSelectionTypeEnum;
  addons: Addon[];
}

interface Addon {
  id: string;
  name: string;
  price: number;
  isAvailable: boolean;
}
```

### 1.3 Cart & Order Entities
```typescript
interface CartItem {
  id: string;
  menuId: string;
  menuVariantId: string;
  quantity: number;
  specialInstructions?: string;
  unitPriceSnapshot: number; // V2: Captured at time of add
  itemAddons: CartItemAddon[];
}

interface Order {
  id: string;
  orderNumber: string;
  status: OrderStatusEnum;
  serviceType: "DINE_IN" | "TAKEAWAY" | "DELIVERY";
  paymentMethod: "CASH" | "CARD" | "WALLET" | "ONLINE" | "COD";
  paymentStatus: "UNPAID" | "PAID" | "REFUNDED" | "FAILED";
  subtotal: number;
  taxAmount: number;
  deliveryFee: number;
  totalAmount: number;
  items: OrderItem[];
}

interface OrderItem {
  // CRITICAL V2 RULE: UI must use the Snapshot fields for Order History.
  // Never look up the live menu price for past orders.
  id: string;
  quantity: number;
  menuNameSnapshot: string; 
  unitPriceSnapshot: number; 
  specialInstructions?: string;
  itemAddons: OrderItemAddon[];
}

interface OrderItemAddon {
  quantity: number;
  addonNameSnapshot: string; 
  addonGroupNameSnapshot: string; 
  unitPriceSnapshot: number; 
  lineTotal: number;
}
```

---

## 2. Customer App Flows (The User Journey)

### Flow 1: Browsing the Menu
1. **Fetch Categories:** `GET /category/:businessId`
2. **Fetch Menus (can filter by Category):** `GET /menu/:businessId?categoryId=UUID`
   *The UI parses the `variants` and `addonGroups` attached to each menu to display the detail page.*

### Flow 2: Adding to Cart
**ENDPOINT:** `POST /cart/item`
**UI Logic:** The frontend must evaluate the `addonGroups` rules locally. Do not let the user click "Add to Cart" if they skipped a group where `isRequired === true` or selected less than `minSelect`.
```json
{
  "menuId": "uuid-of-menu",
  "menuVariantId": "uuid-of-selected-variant", // User must select a size/variant
  "quantity": 1,
  "specialInstructions": "Extra spicy",
  "addonInfo": [
    { "addonsId": "uuid-of-addon-1" }
  ]
}
```
*Other Cart Endpoints:*
- **View Cart:** `GET /cart` (Requires User Auth Token)
- **Update Item:** `PATCH /cart/item/:cartItemId`
- **Remove Item:** `DELETE /cart/item/:cartItemId`

### Flow 3: Checkout
**ENDPOINT:** `POST /order`
Converts the active cart into a confirmed order.
```json
{
  "cartId": "uuid-of-cart",
  "businessId": "uuid-of-business",
  "serviceType": "DINE_IN", 
  "tableNumber": "Table 12", 
  "paymentMethod": "ONLINE" 
}
```

### Flow 4: Reviews & Ratings
**ENDPOINT:** `POST /menu-rating`
Users can only review items they actually purchased. The UI must only show the "Leave Review" button on the Order History page.
```json
{
  "businessId": "uuid-of-business",
  "menuId": "uuid-of-menu",
  "orderItemId": "uuid-of-order-item", // Proves verified purchase
  "rating": 5,
  "review": "Best burger in town!"
}
```

---

## 3. Admin Dashboard Flows (Restaurant Management)

### Admin: Category & Basic Menu Setup
- **Create Category:** `POST /category`
- **Create Menu Base:** `POST /menu` (Requires `categoryId`)
- **Toggle Signature Item:** `PATCH /menu/toggle-signature/:id`

### Admin: Menu Variants & Pricing Setup
- **Add Variant (Size/Price):** `POST /menu/:id/variants`
  `{ "name": "Large", "price": 12.50, "isAvailable": true }`
- **Update Variant:** `PATCH /menu/:id/variants/:variantId`
- **Delete Variant:** `DELETE /menu/:id/variants/:variantId`

### Admin: Addon Group Architecture
- **Create Addon Group:** `POST /addon-groups`
  `{ "name": "Sauces", "businessId": "uuid", "isRequired": false, "minSelect": 0, "maxSelect": 2, "selectionType": "multi" }`
- **Add Addon to Group:** `POST /addon-groups/:id/addons`
  `{ "name": "BBQ Sauce", "price": 0.50 }`
- **Attach Group to Menu:** `POST /menu/:id/addon-groups/:groupId`
- **Detach Group from Menu:** `DELETE /menu/:id/addon-groups/:groupId`

### Admin: Order & Review Management
- **Update Order Status:** `PATCH /order/:id/status`
  `{ "status": "PREPARING" }` // PENDING, PREPARING, READY, DELIVERED, CANCELLED
- **Hide Abusive Review:** `PATCH /menu-rating/:id/visibility`
  `{ "businessId": "uuid", "isVisible": false }`
