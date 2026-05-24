# Cart-to-Order API Testing Guide

## 🧪 Testing the Cart-to-Order Conversion Feature

This guide provides step-by-step instructions for testing the cart-to-order conversion functionality using Postman or any API client.

---

## 📋 Prerequisites

1. **Authentication Token**: You need a valid JWT token
2. **Business ID**: A valid business UUID
3. **Cart with Items**: User must have items in their cart

---

## 🔐 Step 1: Get Authentication Token

### Login Request
```http
POST https://api.kaha.com.np/main/api/v3/auth/login
Content-Type: application/json

{
  "contactNumber": "9813870231",
  "password": "ishwor19944"
}
```

### Response
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "role": "admin"
}
```

**Save the `accessToken` for subsequent requests.**

---

## 🛒 Step 2: Add Items to Cart (If Empty)

### Add Menu Item to Cart
```http
POST http://localhost:3000/cart
Authorization: Bearer <your-jwt-token>
Content-Type: application/json

{
  "businessId": "1df39051-0b84-4b19-a6c3-030ba726997d",
  "menuId": "menu-uuid-here",
  "menuVariantId": "variant-uuid-here",
  "quantity": 2,
  "addOns": [
    {
      "menuAddOnId": "addon-uuid-here",
      "quantity": 1
    }
  ]
}
```

### Verify Cart Contents
```http
GET http://localhost:3000/cart
Authorization: Bearer <your-jwt-token>
```

**Response Example**:
```json
{
  "id": "cart-uuid",
  "userId": "user-uuid",
  "cartItems": [
    {
      "id": "cart-item-uuid-1",
      "quantity": 2,
      "unitPriceSnapshot": 500,
      "menu": {
        "id": "menu-uuid",
        "name": "Burger",
        "businessId": "1df39051-0b84-4b19-a6c3-030ba726997d"
      },
      "menuVariant": {
        "id": "variant-uuid",
        "name": "Large"
      },
      "addOns": [
        {
          "id": "cart-addon-uuid",
          "quantity": 1,
          "unitPriceSnapshot": 50,
          "menuAddOn": {
            "id": "addon-uuid",
            "name": "Extra Cheese"
          }
        }
      ]
    }
  ]
}
```

---

## 🎯 Step 3: Test Cart-to-Order Conversion

### Test Case 1: Full Cart Checkout (All Items)

```http
POST http://localhost:3000/order/from-cart
Authorization: Bearer <your-jwt-token>
Content-Type: application/json

{
  "businessId": "1df39051-0b84-4b19-a6c3-030ba726997d",
  "serviceType": "DINE_IN",
  "tableNumber": "T-12",
  "paymentMethod": "CASH"
}
```

**Expected Response**:
```json
{
  "message": "Order created successfully. 3 item(s) ordered. Order #ORD-1716234567890, Total: 1519"
}
```

**Verification**:
- ✅ Order created in database
- ✅ All cart items removed from cart
- ✅ Order status set to PENDING
- ✅ Prices calculated correctly

---

### Test Case 2: Partial Cart Checkout (Selected Items)

**First, get cart item IDs from Step 2 response.**

```http
POST http://localhost:3000/order/from-cart
Authorization: Bearer <your-jwt-token>
Content-Type: application/json

{
  "businessId": "1df39051-0b84-4b19-a6c3-030ba726997d",
  "serviceType": "DELIVERY",
  "cartItemIds": [
    "cart-item-uuid-1",
    "cart-item-uuid-2"
  ],
  "deliveryFee": 50,
  "remarks": "Please deliver to back door"
}
```

**Expected Response**:
```json
{
  "message": "Order created successfully. 2 item(s) ordered. Order #ORD-1716234567891, Total: 1200"
}
```

**Verification**:
- ✅ Order created with only selected items
- ✅ Only selected cart items removed
- ✅ Other cart items remain in cart
- ✅ Delivery fee applied

---

### Test Case 3: With Pricing Overrides

```http
POST http://localhost:3000/order/from-cart
Authorization: Bearer <your-jwt-token>
Content-Type: application/json

{
  "businessId": "1df39051-0b84-4b19-a6c3-030ba726997d",
  "serviceType": "PICKUP",
  "serviceCharge": 25,
  "discountAmount": 100,
  "tipAmount": 50,
  "remarks": "Birthday celebration"
}
```

**Expected Response**:
```json
{
  "message": "Order created successfully. 3 item(s) ordered. Order #ORD-1716234567892, Total: 1494"
}
```

**Price Breakdown**:
```
Subtotal: 1300
Tax (13%): 169
Delivery Fee: 0 (PICKUP)
Service Charge: 25
Discount: -100
Tip: 50
-------------------
Total: 1444
```

---

## ❌ Error Cases to Test

### Test Case 4: Empty Cart Error

```http
POST http://localhost:3000/order/from-cart
Authorization: Bearer <your-jwt-token>
Content-Type: application/json

{
  "businessId": "1df39051-0b84-4b19-a6c3-030ba726997d",
  "serviceType": "DINE_IN"
}
```

**Expected Response** (400 Bad Request):
```json
{
  "statusCode": 400,
  "message": "Cart is empty",
  "error": "Bad Request"
}
```

---

### Test Case 5: Invalid Cart Item IDs

```http
POST http://localhost:3000/order/from-cart
Authorization: Bearer <your-jwt-token>
Content-Type: application/json

{
  "businessId": "1df39051-0b84-4b19-a6c3-030ba726997d",
  "serviceType": "DINE_IN",
  "cartItemIds": [
    "invalid-uuid-1",
    "invalid-uuid-2"
  ]
}
```

**Expected Response** (400 Bad Request):
```json
{
  "statusCode": 400,
  "message": "No valid cart items found for the provided IDs",
  "error": "Bad Request"
}
```

---

### Test Case 6: Wrong Business ID

```http
POST http://localhost:3000/order/from-cart
Authorization: Bearer <your-jwt-token>
Content-Type: application/json

{
  "businessId": "wrong-business-uuid",
  "serviceType": "DINE_IN"
}
```

**Expected Response** (400 Bad Request):
```json
{
  "statusCode": 400,
  "message": "Some cart items do not belong to business wrong-business-uuid",
  "error": "Bad Request"
}
```

---

### Test Case 7: Unavailable Menu Item

**Scenario**: Menu item was disabled after adding to cart

**Expected Response** (400 Bad Request):
```json
{
  "statusCode": 400,
  "message": "Menu item \"Burger\" is no longer available",
  "error": "Bad Request"
}
```

---

## 🔍 Step 4: Verify Order Creation

### Get User Orders
```http
GET http://localhost:3000/order/user
Authorization: Bearer <your-jwt-token>
```

**Response**:
```json
[
  {
    "id": "order-uuid",
    "userId": "user-uuid",
    "businessId": "1df39051-0b84-4b19-a6c3-030ba726997d",
    "orderNumber": "ORD-1716234567890",
    "totalAmount": 1519,
    "subtotal": 1300,
    "taxAmount": 169,
    "deliveryFee": 50,
    "serviceCharge": 0,
    "discountAmount": 0,
    "tipAmount": 0,
    "serviceType": "DINE_IN",
    "tableNumber": "T-12",
    "paymentMethod": "CASH",
    "remarks": null,
    "userInfo": {
      "name": "ishwor gautam",
      "email": "replyishwor@gmail.com",
      "contact": "9813870231",
      "avatar": "https://..."
    },
    "businessInfo": {
      "name": "Hotel Shree Narshang",
      "category": "Restaurant",
      "address": "Kathmandu, Nepal",
      "avatar": "https://..."
    }
  }
]
```

---

### Get Specific Order Details
```http
GET http://localhost:3000/order/{order-id}
Authorization: Bearer <your-jwt-token>
```

**Response**:
```json
{
  "id": "order-uuid",
  "userId": "user-uuid",
  "businessId": "1df39051-0b84-4b19-a6c3-030ba726997d",
  "totalAmount": 1519,
  "remarks": null,
  "orderItemsInfo": [
    {
      "id": "order-item-uuid-1",
      "quantity": 2,
      "menuName": "Burger",
      "variantName": "Large",
      "price": 500,
      "lineTotal": 1100,
      "addonsInfo": [
        {
          "id": "order-addon-uuid",
          "quantity": 1,
          "name": "Extra Cheese",
          "price": 50,
          "lineTotal": 100
        }
      ]
    },
    {
      "id": "order-item-uuid-2",
      "quantity": 1,
      "menuName": "Fries",
      "variantName": null,
      "price": 200,
      "lineTotal": 200,
      "addonsInfo": []
    }
  ]
}
```

---

## 📊 Postman Collection Variables

Set these variables in your Postman environment:

```json
{
  "base_url": "http://localhost:3000",
  "auth_token": "{{accessToken}}",
  "business_id": "1df39051-0b84-4b19-a6c3-030ba726997d",
  "cart_item_id_1": "{{cartItemId1}}",
  "cart_item_id_2": "{{cartItemId2}}"
}
```

---

## 🧮 Price Calculation Verification

### Manual Calculation Example

**Cart Contents**:
- Item 1: Burger (Large) × 2 @ 500 = 1000
  - Addon: Extra Cheese × 2 @ 50 = 100
  - Line Total: 1100

- Item 2: Fries × 1 @ 200 = 200
  - Line Total: 200

**Order Calculation**:
```
Subtotal: 1100 + 200 = 1300
Tax (13%): 1300 × 0.13 = 169
Delivery Fee: 50 (for DELIVERY)
Service Charge: 0
Discount: 0
Tip: 0
-------------------
Total: 1300 + 169 + 50 = 1519 ✅
```

---

## 🔄 Complete Test Flow

### Full Workflow Test

1. **Login** → Get JWT token
2. **Add items to cart** → 3 different menu items
3. **Verify cart** → Check cart contents
4. **Partial checkout** → Order 2 items
5. **Verify cart** → 1 item should remain
6. **Full checkout** → Order remaining item
7. **Verify cart** → Cart should be empty
8. **Get orders** → Should see 2 orders created

---

## 📝 Test Checklist

- [ ] Full cart checkout works
- [ ] Partial cart checkout works
- [ ] Price calculation is accurate
- [ ] Cart items removed after order
- [ ] Order status set to PENDING
- [ ] Empty cart error handled
- [ ] Invalid cart item IDs handled
- [ ] Wrong business ID handled
- [ ] Unavailable menu item handled
- [ ] Delivery fee applied correctly
- [ ] Service charge applied correctly
- [ ] Discount applied correctly
- [ ] Tip applied correctly
- [ ] Tax calculated correctly (13%)

---

## 🐛 Debugging Tips

### Issue: "Cart is empty" but cart has items
**Check**:
- User ID from JWT matches cart owner
- Cart items exist in database
- Cart items not soft-deleted

### Issue: Price calculation incorrect
**Check**:
- `unitPriceSnapshot` in cart items
- Addon quantities and prices
- Tax rate (should be 13%)
- Delivery fee for service type

### Issue: Cart items not removed
**Check**:
- Database transaction committed
- Cart item IDs match
- No database constraints preventing deletion

---

## 📞 Support

For issues or questions:
1. Check error response message
2. Verify request body format
3. Check authentication token validity
4. Review database logs
5. Check application logs

---

**Last Updated**: May 20, 2026  
**API Version**: v3  
**Status**: ✅ READY FOR TESTING
