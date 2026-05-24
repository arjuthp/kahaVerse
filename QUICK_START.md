# KAHA Restaurant E-Commerce - Quick Start Guide

## 🚀 Services Running

| Service | URL | Status |
|---------|-----|--------|
| **Frontend** | http://localhost:5173 | ✅ Running |
| **Backend API** | http://localhost:3001/api/v1 | ✅ Running |
| **API Docs** | http://localhost:3001/api/v1/docs | ✅ Running |
| **Database** | localhost:5432 | ✅ Running |

## 🔑 Quick Access

### Frontend
```bash
# Open in browser
xdg-open http://localhost:5173
```

### API Documentation (Swagger)
```bash
# Open Swagger UI
xdg-open http://localhost:3001/api/v1/docs
```

## 📊 Test Data

### Business ID
```
biz-mock-001
```

### Sample API Calls

#### Get All Menu Items
```bash
curl http://localhost:3001/api/v1/menu/biz-mock-001 | jq
```

#### Get All Categories
```bash
curl http://localhost:3001/api/v1/categories/business/biz-mock-001 | jq
```

#### Get Addon Groups
```bash
curl http://localhost:3001/api/v1/addon-groups | jq
```

## 📦 Seeded Data Summary

- **8 Categories** (Food, Drinks, Desserts with subcategories)
- **13 Menu Items** (Burgers, Pizza, Pasta, Coffee, Juices, Desserts)
- **27 Variants** (Size options, types)
- **19 Addons** (Sauces, Extras, Toppings)

### Featured Items
- 🍔 Classic Beef Burger (₹399) ⭐ Signature
- 🍕 Margherita Pizza (₹650) ⭐ Signature
- ☕ Cappuccino (₹220) ⭐ Signature
- 🍰 New York Cheesecake (₹320) ⭐ Signature

## 🛠️ Common Commands

### View Running Processes
```bash
# Check backend
ps aux | grep "nest start"

# Check frontend
ps aux | grep "vite"
```

### View Logs
```bash
# Backend (if running in background)
tail -f ~/Documents/KAHA_Verse/Kaha_restaurant-ecommerce/restaurant-ecommerce/backend.log

# Frontend (if running in background)
tail -f ~/Documents/KAHA_Verse/kaha_Restarant_Eecommerce_Frontend/frontend.log
```

### Restart Services

#### Backend
```bash
cd ~/Documents/KAHA_Verse/Kaha_restaurant-ecommerce/restaurant-ecommerce
npm run dev
```

#### Frontend
```bash
cd ~/Documents/KAHA_Verse/kaha_Restarant_Eecommerce_Frontend
npm run dev
```

### Reseed Database
```bash
cd ~/Documents/KAHA_Verse/Kaha_restaurant-ecommerce/restaurant-ecommerce
npm run seed
```

## 🧪 Testing Workflow

### 1. Browse Menu (Frontend)
1. Open http://localhost:5173
2. Browse categories
3. View menu items with details
4. Check variants and addons

### 2. Test API (Backend)
1. Open http://localhost:3001/api/v1/docs
2. Try "Get all menu items" endpoint
3. Test with business ID: `biz-mock-001`

### 3. Cart & Order Flow
1. Add items to cart (requires JWT token)
2. View cart
3. Create order from cart
4. Track order status

## 📝 Important Notes

- **Mock Auth Enabled:** `USE_MOCK_AUTH=true` in backend
- **Business ID:** Always use `biz-mock-001` for testing
- **API Prefix:** All endpoints start with `/api/v1`
- **Frontend Proxy:** Vite proxies `/api` to backend automatically

## 🔗 Documentation

- **Full Status Report:** `FULLSTACK_STATUS_REPORT.md`
- **Setup Guide:** `FULLSTACK_SETUP_GUIDE.md`
- **API Guide:** `Kaha_restaurant-ecommerce/restaurant-ecommerce/FRONTEND_DEVELOPER_GUIDE.md`

## ⚡ Quick Troubleshooting

### Port Already in Use
```bash
# Check what's using the port
lsof -i :3001  # Backend
lsof -i :5173  # Frontend

# Kill process
kill -9 <PID>
```

### Database Connection Issues
```bash
# Check PostgreSQL status
sudo systemctl status postgresql

# Restart PostgreSQL
sudo systemctl restart postgresql
```

### Frontend Not Loading
```bash
# Check if Vite is running
ps aux | grep vite

# Restart frontend
cd ~/Documents/KAHA_Verse/kaha_Restarant_Eecommerce_Frontend
npm run dev
```

---

**Everything is ready! Start building! 🎉**
