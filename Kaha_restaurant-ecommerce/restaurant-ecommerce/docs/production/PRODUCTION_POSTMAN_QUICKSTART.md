# 🚀 Production Postman - Quick Start Guide

## ⚡ 3-Minute Setup

### Step 1: Get Your Credentials
```bash
cd restaurant-ecommerce/postman
python3 get_production_auth_tokens.py
```

### Step 2: Enter Production Login
```
📧 Email: your@production.email
🔐 Password: ••••••••••
```

### Step 3: Done! 🎉
Collections automatically updated with real tokens!

---

## ✅ Verification Checklist

- [ ] Run the auth script
- [ ] Check Postman Collections tab
- [ ] Verify `baseUrl` = `https://api.kaha.com/v3`
- [ ] Verify `authToken` is populated
- [ ] Run simple test: `GET /categories`
- [ ] Check response status: **200 OK** ✅

---

## 🧪 Test First Request

```bash
Method: GET
URL: https://api.kaha.com/v3/categories
Authorization: Bearer {{authToken}}
```

**Expected Response**:
```json
{
  "data": [...],
  "total": X,
  "page": 1
}
```

---

## 📝 Available Collections

| Collection | Purpose |
|------------|---------|
| **Cart** | Shopping cart CRUD operations |
| **Categories** | Category management |
| **Menu** | Menu item CRUD operations |
| **Addons** | Addon management |
| **Orders** | Order creation and tracking |
| **MenuRatings** | Customer ratings |
| **Authentication** | Auth endpoints |
| **Complete Tests** | All tests in one collection |

---

## 🔗 Important URLs

```
Production API: https://api.kaha.com/v3
Status: ✅ LIVE
Protocol: HTTPS (Secure)
```

---

## ⚠️ Quick Tips

1. **Always use production URL** - Don't use localhost
2. **Keep tokens secure** - Don't share credentials
3. **Test with own data** - Use test categories/items
4. **Clean up after tests** - Delete test data
5. **Watch for expiry** - Tokens expire after 30 days

---

## 🆘 Troubleshooting

| Problem | Solution |
|---------|----------|
| 401 Unauthorized | Re-run auth script to refresh token |
| 403 Forbidden | Check user role (need BUSINESS_OWNER) |
| 404 Not Found | Verify resource ID exists |
| 400 Bad Request | Check request body format |
| SSL Error | Check Postman SSL settings |

---

## 📚 Full Guides

- **Complete Setup**: [PRODUCTION_TESTING_SETUP.md](postman/PRODUCTION_TESTING_SETUP.md)
- **Checklist**: [PRODUCTION_POSTMAN_CHECKLIST.md](postman/PRODUCTION_POSTMAN_CHECKLIST.md)
- **Summary**: [PRODUCTION_SETUP_SUMMARY.md](postman/PRODUCTION_SETUP_SUMMARY.md)

---

## 🎯 Common Workflows

### List All Categories
```
GET https://api.kaha.com/v3/categories
```

### Create New Menu Item
```
POST https://api.kaha.com/v3/menu
{
  "name": "Biryani",
  "categoryId": "cat-123",
  "price": 250,
  "description": "..."
}
```

### Create Order
```
POST https://api.kaha.com/v3/orders
{
  "cartId": "cart-123",
  "items": [...]
}
```

---

**Status**: ✅ Ready to Test  
**Environment**: Production (https://api.kaha.com/v3)  
**Collections**: 9 (8 modular + 1 complete)  

Start now: `python3 postman/get_production_auth_tokens.py` 🚀
