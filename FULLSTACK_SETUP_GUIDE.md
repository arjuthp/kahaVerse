# KAHA Restaurant E-Commerce - Full Stack Setup Guide

## 🚀 Quick Start

### One-Command Startup

```bash
cd /home/kali/Documents/KAHA_Verse
./start-kaha-fullstack.sh
```

This script will:
1. ✅ Start PostgreSQL database (Docker)
2. ✅ Install backend dependencies
3. ✅ Seed the database with sample data
4. ✅ Start the NestJS backend API
5. ✅ Start the React frontend

### Stop All Services

```bash
cd /home/kali/Documents/KAHA_Verse
./stop-kaha-fullstack.sh
```

---

## 📋 What's Included

### Backend (NestJS)
- **Location**: `Kaha_restaurant-ecommerce/restaurant-ecommerce/`
- **Port**: 3001
- **API Docs**: http://localhost:3001/api (Swagger)
- **Features**:
  - JWT Authentication (Mock mode enabled)
  - Menu Management (Categories, Items, Variants)
  - Addon System (Groups & Items)
  - Shopping Cart
  - Order Management
  - Rating & Reviews

### Frontend (React + Vite)
- **Location**: `kaha_Restarant_Eecommerce_Frontend/`
- **Port**: 5173
- **URL**: http://localhost:5173
- **Features**:
  - Customer menu browsing
  - Shopping cart
  - Order placement
  - Admin menu management

### Database (PostgreSQL)
- **Port**: 5432
- **Database**: kaha_restaurant_db
- **User**: postgres
- **Password**: postgres

---

## 🗄️ Seeded Data

The database is automatically seeded with comprehensive test data:

### Categories (8 total)
- **Food** (Parent)
  - Burgers
  - Pizza
  - Pasta
- **Drinks** (Parent)
  - Coffee
  - Fresh Juices
- **Desserts** (Parent)

### Menu Items (13 items)

#### Burgers
1. **Classic Beef Burger** - ₹450 (₹399 discounted) ⭐ Signature
   - Variants: Single/Double/Triple Patty
   - Addons: Sauces, Extras
   
2. **Crispy Chicken Burger** - ₹420
   - Variants: Regular/Spicy
   - Addons: Sauces, Extras
   
3. **Veggie Delight Burger** - ₹380
   - Variants: Standard
   - Addons: Sauces

#### Pizza
4. **Margherita Pizza** - ₹650 ⭐ Signature
   - Variants: Personal (6")/Medium (10")/Large (14")
   - Addons: Pizza Toppings
   
5. **BBQ Chicken Pizza** - ₹750
   - Variants: Personal/Medium/Large
   - Addons: Pizza Toppings, Extras

#### Pasta
6. **Spaghetti Carbonara** - ₹520
   - Variants: Regular/Large
   
7. **Penne Arrabiata** - ₹480
   - Variants: Regular/Large

#### Coffee
8. **Espresso** - ₹150
   - Variants: Single/Double Shot
   - Addons: Size
   
9. **Cappuccino** - ₹220 ⭐ Signature
   - Variants: Regular/Large
   - Addons: Size
   
10. **Iced Caramel Latte** - ₹280
    - Variants: Medium/Large
    - Addons: Size

#### Juices
11. **Fresh Orange Juice** - ₹200
    - Variants: Small (250ml)/Large (500ml)
    - Addons: Size

#### Desserts
12. **New York Cheesecake** - ₹320 ⭐ Signature
    - Variants: Slice/Whole Cake
    
13. **Tiramisu** - ₹350
    - Variants: Individual

### Addon Groups (4 groups, 19 addons)

#### 1. Sauces (Multi-select, Optional, Max 3)
- Ketchup (Free)
- Mayonnaise (Free)
- BBQ Sauce (₹20)
- Sriracha (₹20)
- Garlic Aioli (₹30)

#### 2. Extras (Multi-select, Optional, Max 5)
- Extra Cheese (₹50)
- Extra Patty (₹120)
- Bacon Strip (₹80)
- Fried Egg (₹40)
- Avocado (₹60)

#### 3. Size (Single-select, Required)
- Small (8oz) (Free)
- Medium (12oz) (+₹30)
- Large (16oz) (+₹60)

#### 4. Pizza Toppings (Multi-select, Optional, Max 6)
- Mushrooms (₹40)
- Olives (₹40)
- Jalapeños (₹30)
- Sun-dried Tomatoes (₹50)
- Pepperoni (₹80)
- Chicken (₹100)

---

## 🔑 Configuration

### Backend Environment (.env)
```env
APP_PORT=3001
DB_HOST=localhost
DB_PORT=5432
DB_NAME=kaha_restaurant_db
DB_USER_NAME=postgres
DB_PASSWORD=postgres
JWT_SECRET_TOKEN=secret
USE_MOCK_AUTH=true
KAHA_API_LINK=https://api.kaha.com.np
KAH_API_V3_BASE_URL=https://api.kaha.com.np
```

### Frontend Environment (.env)
```env
VITE_API_BASE_URL=http://localhost:3001
VITE_AUTH_API_URL=http://localhost:3001
VITE_BUSINESS_ID=biz-mock-001
```

### Mock Authentication
The backend is configured with `USE_MOCK_AUTH=true`, which means:
- No external API calls to Kaha Main V3
- JWT tokens are accepted without external validation
- Business ID: `biz-mock-001`
- Perfect for development and testing

---

## 🛠️ Manual Setup (Alternative)

If you prefer to start services manually:

### 1. Start Database
```bash
cd Kaha_restaurant-ecommerce/restaurant-ecommerce
docker-compose up -d postgres
```

### 2. Seed Database
```bash
cd Kaha_restaurant-ecommerce/restaurant-ecommerce
npm install
npm run seed
```

### 3. Start Backend
```bash
cd Kaha_restaurant-ecommerce/restaurant-ecommerce
npm run dev
```

### 4. Start Frontend
```bash
cd kaha_Restarant_Eecommerce_Frontend
npm install
npm run dev
```

---

## 📊 API Endpoints

### Public Endpoints (No Auth Required)
- `GET /categories/business/:businessId` - Get all categories
- `GET /menu/:businessId` - Get all menu items
- `GET /menu/:id` - Get single menu item
- `GET /addon-groups` - Get all addon groups

### Authenticated Endpoints (JWT Required)
- `POST /cart` - Create cart
- `POST /cart/item` - Add item to cart
- `GET /cart` - Get user cart
- `POST /order/from-cart` - Create order from cart
- `GET /order/user` - Get user orders
- `POST /menu-ratings` - Create rating

### Admin Endpoints (Business Admin Role)
- `POST /categories` - Create category
- `POST /menu` - Create menu item
- `POST /addon-groups` - Create addon group
- `PATCH /menu/:id` - Update menu item
- `DELETE /menu/:id` - Delete menu item

**Full API Documentation**: http://localhost:3001/api (Swagger UI)

---

## 🧪 Testing the API

### Using Swagger UI
1. Open http://localhost:3001/api
2. Click "Authorize" button
3. Enter any JWT token (mock auth is enabled)
4. Test endpoints interactively

### Using Postman
Import the collection from:
```
Kaha_restaurant-ecommerce/restaurant-ecommerce/KAHA_Restaurant_Complete_Tests.postman_collection.json
```

### Sample API Calls

#### Get All Menu Items
```bash
curl http://localhost:3001/menu/biz-mock-001
```

#### Get Categories
```bash
curl http://localhost:3001/categories/business/biz-mock-001
```

#### Add Item to Cart (requires JWT)
```bash
curl -X POST http://localhost:3001/cart/item \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user-123",
    "menuId": "menu-uuid",
    "quantity": 2
  }'
```

---

## 🔍 Troubleshooting

### Port Already in Use
If you get "port already in use" errors:

```bash
# Check what's using the port
lsof -i :3001  # Backend
lsof -i :5173  # Frontend
lsof -i :5432  # Database

# Kill the process
kill -9 <PID>
```

### Database Connection Failed
```bash
# Check if PostgreSQL is running
docker ps

# Restart database
cd Kaha_restaurant-ecommerce/restaurant-ecommerce
docker-compose restart postgres

# Check logs
docker-compose logs postgres
```

### Backend Not Starting
```bash
# Check logs
cd Kaha_restaurant-ecommerce/restaurant-ecommerce
tail -f backend.log

# Or run in foreground to see errors
npm run dev
```

### Frontend Not Starting
```bash
# Check logs
cd kaha_Restarant_Eecommerce_Frontend
tail -f frontend.log

# Or run in foreground
npm run dev
```

### Reseed Database
```bash
cd Kaha_restaurant-ecommerce/restaurant-ecommerce
npm run seed
```

---

## 📁 Project Structure

```
KAHA_Verse/
├── start-kaha-fullstack.sh          # 🚀 Main startup script
├── stop-kaha-fullstack.sh           # 🛑 Stop all services
├── FULLSTACK_SETUP_GUIDE.md         # 📖 This file
│
├── Kaha_restaurant-ecommerce/
│   └── restaurant-ecommerce/        # Backend (NestJS)
│       ├── src/
│       │   ├── modules/             # Feature modules
│       │   ├── entities/            # TypeORM entities
│       │   ├── database/
│       │   │   └── seed.ts          # Database seeder
│       │   └── main.ts
│       ├── .env                     # Backend config
│       ├── docker-compose.yml       # Database setup
│       └── package.json
│
└── kaha_Restarant_Eecommerce_Frontend/  # Frontend (React)
    ├── src/
    │   ├── api/                     # API integration
    │   ├── components/              # React components
    │   ├── pages/                   # Page components
    │   └── context/                 # React context
    ├── .env                         # Frontend config
    └── package.json
```

---

## 🎯 Next Steps

1. **Explore the API**: Visit http://localhost:3001/api
2. **Browse the Frontend**: Open http://localhost:5173
3. **Test the Flow**:
   - Browse menu items
   - Add items to cart
   - Create an order
   - View order history
4. **Admin Features**:
   - Create new menu items
   - Manage categories
   - Configure addon groups

---

## 📚 Additional Resources

- **Backend Documentation**: `Kaha_restaurant-ecommerce/restaurant-ecommerce/FRONTEND_DEVELOPER_GUIDE.md`
- **API Testing Guide**: `Kaha_restaurant-ecommerce/restaurant-ecommerce/SWAGGER_QUICK_START.md`
- **Frontend Guide**: `kaha_Restarant_Eecommerce_Frontend/FRONTEND_DEVELOPER_GUIDE.md`

---

## 🤝 Support

If you encounter any issues:
1. Check the logs in `backend.log` and `frontend.log`
2. Verify all environment variables are set correctly
3. Ensure PostgreSQL is running
4. Try reseeding the database

---

**Happy Coding! 🎉**
