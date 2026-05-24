# KAHA_Verse Database Architecture & API Endpoints

**Generated:** May 17, 2026  
**Codebase:** /home/kali/Documents/KAHA_Verse

---

## 📊 Overview

The KAHA_Verse ecosystem consists of three main components:

1. **kaha-main-api-v3** - Central authentication and business management API (AUTH_DB)
2. **Kaha_restaurant-ecommerce** - Restaurant e-commerce microservice
3. **kahaVerse** - Restaurant e-commerce API v2.0

---

## 🗄️ Database Architecture

### Architecture Diagram

```
┌──────────────────────────────────┐
│         AUTH_DB                  │
│  (kaha-main-api-v3)             │
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

## 📋 AUTH_DB Tables (kaha-main-api-v3)

### Core Tables

#### 1. **user**
- **id** (UUID, PK)
- **kahaId** (string, unique)
- **email** (string, unique)
- **password** (string, hashed)
- **firstName** (string)
- **lastName** (string)
- **fullName** (string)
- **contactNumber** (string)
- **dateOfBirth** (string)
- **gender** (enum: GenderEnum)
- **avatar** (string)
- **status** (enum: AccountStatusEnum)
- **role** (enum: UserRoleEnum)
- **deletionRequestAt** (Date)
- **createdAt**, **updatedAt**, **deletedAt**

#### 2. **business**
- **id** (UUID, PK)
- **kahaId** (string, unique)
- **tag** (string, unique)
- **referenceId** (number, unique)
- **name** (string)
- **contact** (string)
- **email** (string)
- **address** (string)
- **geohash** (string, indexed)
- **location** (geography Point, spatial index)
- **avatarUrl** (string)
- **coverImageUrl** (string)
- **buildingImageUrl** (string)
- **tagLine** (string)
- **website** (string)
- **description** (string)
- **isPickup** (boolean)
- **isDelivery** (boolean)
- **isAvailable** (boolean)
- **isVisible** (boolean)
- **isOfficial** (boolean)
- **buildingInformation** (string)
- **floorNo** (string)
- **homeId** (string)
- **panoramaImageUrl** (string)
- **gallery** (string[])
- **webGallery** (string[])
- **status** (enum: BusinessStatusEnum)
- **workingDaysAndHours** (jsonb)
- **createdAt**, **updatedAt**, **deletedAt**

**Relationships:**
- **owner** → user (ManyToOne)
- **locatedInBusiness** → business (ManyToOne)
- **parentBusiness** → business (ManyToOne)
- **childrens** → business (OneToMany)
- **businessCategory** → business_category (ManyToOne)
- **document** → business_document (OneToOne)
- **mapAddress** → business_map_address (OneToOne)
- **businessUsers** → business_user (OneToMany)
- **ratings** → business_rating (OneToMany)
- **banner** → banner (OneToMany)
- **tolet** → tolet (OneToMany)
- **assets** → assets (OneToMany)
- **favourite** → favourite (OneToMany)
- **businessRejections** → business_rejection (OneToMany)
- **businessTypes** → business_type (ManyToMany)
- **rolePermissions** → role_permission (OneToMany)

#### 3. **business_user** (M:N Junction)
- **id** (UUID, PK)
- **availability** (enum: BusinessUserAvailabiltyEnum)
- **user** → user (ManyToOne)
- **addedBy** → user (ManyToOne)
- **updatedBy** → user (ManyToOne)
- **role** → role (ManyToOne)
- **business** → business (ManyToOne)
- **createdAt**, **updatedAt**, **deletedAt**

### Supporting Tables

#### 4. **business_category**
- **id** (UUID, PK)
- **name** (string)
- **description** (string)
- **icon** (string)
- **createdAt**, **updatedAt**, **deletedAt**

#### 5. **business_type**
- **id** (UUID, PK)
- **name** (string)
- **description** (string)
- **business** → business (ManyToMany)

#### 6. **business_document**
- **id** (UUID, PK)
- **business** → business (OneToOne)
- Document fields (pan, vat, registration, etc.)

#### 7. **business_map_address**
- **id** (UUID, PK)
- **business** → business (OneToOne)
- Address mapping fields

#### 8. **business_rating**
- **id** (UUID, PK)
- **rating** (number)
- **review** (string)
- **business** → business (ManyToOne)
- **user** → user (ManyToOne)

#### 9. **role**
- **id** (UUID, PK)
- **name** (string)
- **permissions** (jsonb)

#### 10. **role_permission**
- **id** (UUID, PK)
- **business** → business (ManyToOne)
- **role** → role (ManyToOne)
- **permissions** (jsonb)

### Additional Tables

- **address** - User addresses
- **address_category** - Address categories
- **advertisement** - Advertisements
- **analytics** - Analytics data
- **app_version** - Application version tracking
- **assets** - Business assets
- **banner** - Business banners
- **business_rejection** - Business rejection records
- **business_views** - Business view tracking
- **category_business_type_association** - Category-business type mapping
- **default_location** - Default locations
- **entity_additional_information** - Additional entity info
- **entity_forms** - Entity forms
- **explore_category** - Explore categories
- **faq** - Frequently asked questions
- **favourite** - User favourites
- **language_translation_content** - Translation content
- **language_translation_type** - Translation types
- **object_management** - Object management
- **otp** - OTP records
- **qr_reservation** - QR reservations
- **qr_usage** - QR usage tracking
- **queries** - User queries
- **settings** - System settings
- **shared_address** - Shared addresses
- **social_account** - Social media accounts
- **tag_info** - Tag information
- **tolet** - Tolet listings

---

## 🍽️ Restaurant E-commerce Database Tables

### Core Tables (from SQL Schema)

#### 1. **category**
- **id** (UUID, PK)
- **name** (varchar)
- **description** (varchar 1024)
- **icon** (varchar)
- **position** (int)
- **is_active** (boolean)
- **business_id** (varchar) → External ref to AUTH_DB
- **parent_id** (UUID) → Self-reference
- **created_at**, **updated_at**, **deleted_at**

**Indexes:**
- INDEX on business_id
- UNIQUE INDEX on (business_id, name)

#### 2. **menu**
- **id** (UUID, PK)
- **name** (varchar)
- **description** (text)
- **images** (varchar[])
- **details** (jsonb)
- **is_active** (boolean)
- **is_signature** (boolean)
- **is_bar_item** (boolean)
- **services** (menu_service[]) - ENUM: dine_in, takeaway, home_delivery
- **base_price** (numeric 12,2)
- **discounted_price** (numeric 12,2)
- **tax_category** (varchar)
- **prep_time_minutes** (int)
- **dietary_tags** (dietary_tag[]) - ENUM: veg, non_veg, vegan, gluten_free, halal
- **category_id** (UUID) → category
- **business_id** (varchar) → External ref to AUTH_DB
- **created_at**, **updated_at**, **deleted_at**

**Indexes:**
- INDEX on business_id
- INDEX on (business_id, is_active)
- INDEX on category_id

#### 3. **menu_variant**
- **id** (UUID, PK)
- **menu_id** (UUID) → menu
- **name** (varchar) - e.g., "Small", "12 inch"
- **price** (numeric 12,2)
- **is_available** (boolean)
- **sort_order** (int)
- **created_at**, **updated_at**

**Indexes:**
- UNIQUE INDEX on (menu_id, name)

#### 4. **addon_group**
- **id** (UUID, PK)
- **name** (varchar) - e.g., "Choose your sauce"
- **business_id** (varchar) → External ref to AUTH_DB
- **is_required** (boolean)
- **min_select** (int)
- **max_select** (int) - null = unlimited
- **selection_type** (addon_selection_type) - ENUM: single, multi
- **is_active** (boolean)
- **created_at**, **updated_at**, **deleted_at**

**Indexes:**
- INDEX on business_id

#### 5. **addon**
- **id** (UUID, PK)
- **addon_group_id** (UUID) → addon_group
- **name** (varchar)
- **description** (varchar)
- **cover_img** (varchar)
- **price** (numeric 12,2)
- **is_active** (boolean)
- **sort_order** (int)
- **created_at**, **updated_at**, **deleted_at**

**Indexes:**
- INDEX on (addon_group_id, sort_order)

#### 6. **menu_addon_group** (Junction Table)
- **menu_id** (UUID) → menu
- **addon_group_id** (UUID) → addon_group
- **sort_order** (int)
- PRIMARY KEY (menu_id, addon_group_id)

#### 7. **cart**
- **id** (UUID, PK)
- **user_id** (varchar) → External ref to AUTH_DB
- **business_id** (varchar) → External ref to AUTH_DB
- **created_at**, **updated_at**

**Indexes:**
- UNIQUE INDEX on (user_id, business_id)
- INDEX on business_id

#### 8. **cart_item**
- **id** (UUID, PK)
- **cart_id** (UUID) → cart (ON DELETE CASCADE)
- **menu_id** (UUID) → menu
- **menu_variant_id** (UUID) → menu_variant
- **quantity** (int)
- **unit_price_snapshot** (numeric 12,2)
- **special_instructions** (varchar)
- **created_at**, **updated_at**

**Indexes:**
- INDEX on cart_id

#### 9. **cart_item_addon**
- **id** (UUID, PK)
- **cart_item_id** (UUID) → cart_item (ON DELETE CASCADE)
- **addon_id** (UUID) → addon
- **quantity** (int)
- **unit_price_snapshot** (numeric 12,2)
- **created_at**, **updated_at**

**Indexes:**
- INDEX on cart_item_id

#### 10. **order**
- **id** (UUID, PK)
- **order_number** (varchar, unique) - e.g., "ORD-2026-000123"
- **user_id** (varchar) → External ref to AUTH_DB
- **business_id** (varchar) → External ref to AUTH_DB
- **customer_name** (varchar)
- **customer_phone** (varchar)
- **customer_email** (varchar)
- **service_type** (service_type) - ENUM: DINE_IN, TAKEAWAY, DELIVERY
- **table_number** (varchar) - dine-in only
- **delivery_address** (jsonb) - snapshot from Kaha Main
- **scheduled_for** (timestamp) - preorder
- **currency** (char 3) - default 'NPR'
- **subtotal** (numeric 12,2)
- **tax_amount** (numeric 12,2)
- **tax_rate_snapshot** (numeric 5,4) - e.g., 0.13
- **delivery_fee** (numeric 12,2)
- **service_charge** (numeric 12,2)
- **discount_amount** (numeric 12,2)
- **coupon_code_snapshot** (varchar)
- **tip_amount** (numeric 12,2)
- **total_amount** (numeric 12,2)
- **payment_status** (payment_status) - ENUM: UNPAID, PAID, PARTIALLY_REFUNDED, REFUNDED, FAILED
- **payment_method** (payment_method) - ENUM: CASH, CARD, WALLET, ONLINE, COD
- **payment_ref** (varchar) - external gateway txn id
- **paid_at** (timestamp)
- **current_status** (order_status) - ENUM: PENDING, CONFIRMED, PREPARING, READY, OUT_FOR_DELIVERY, DELIVERED, CANCELLED
- **placed_at** (timestamp)
- **cancelled_at** (timestamp)
- **cancellation_reason** (varchar)
- **customer_notes** (varchar)
- **source** (order_source) - ENUM: WEB, MOBILE, POS, KIOSK
- **created_at**, **updated_at**, **deleted_at**

**Indexes:**
- INDEX "idx_order_business_dashboard" on (business_id, current_status, created_at)
- INDEX "idx_order_user_history" on (user_id, created_at)
- UNIQUE INDEX on order_number
- INDEX on payment_status

#### 11. **order_item**
- **id** (UUID, PK)
- **order_id** (UUID) → order
- **menu_id** (UUID) → menu
- **menu_variant_id** (UUID) → menu_variant
- **menu_name_snapshot** (varchar)
- **variant_name_snapshot** (varchar)
- **quantity** (int)
- **unit_price_snapshot** (numeric 12,2)
- **addons_total** (numeric 12,2)
- **line_total** (numeric 12,2) - (unit_price + addons_total) * quantity
- **special_instructions** (varchar)
- **status** (order_item_status) - ENUM: ORDERED, PREPARED, CANCELLED
- **created_at**, **updated_at**

**Indexes:**
- INDEX on order_id
- INDEX on menu_id

#### 12. **order_item_addon**
- **id** (UUID, PK)
- **order_item_id** (UUID) → order_item
- **addon_id** (UUID) → addon
- **addon_name_snapshot** (varchar)
- **addon_group_name_snapshot** (varchar)
- **quantity** (int)
- **unit_price_snapshot** (numeric 12,2)
- **line_total** (numeric 12,2)
- **created_at**, **updated_at**

**Indexes:**
- INDEX on order_item_id

#### 13. **order_status_history**
- **id** (UUID, PK)
- **order_id** (UUID) → order
- **status** (order_status)
- **updated_by** (varchar) → External user id
- **remarks** (varchar)
- **created_at** (timestamp)

**Note:** Append-only table. No updated_at, no deleted_at.

**Indexes:**
- INDEX "idx_status_history_order_timeline" on (order_id, created_at)

#### 14. **review**
- **id** (UUID, PK)
- **menu_id** (UUID) → menu
- **order_item_id** (UUID) → order_item (verified-purchase link)
- **rated_by** (varchar) → External user id
- **rating** (int) - CHECK (rating BETWEEN 1 AND 5)
- **comment** (text)
- **is_visible** (boolean)
- **created_at**, **updated_at**, **deleted_at**

**Indexes:**
- UNIQUE INDEX on (menu_id, rated_by)
- INDEX "idx_review_visible_timeline" on (menu_id, is_visible, created_at)

---

## 🔌 API Endpoints

### Kaha Main v3 API (kaha-main-api-v3)

**Base URL:** `http://localhost:3001` (configurable)

#### Authentication Module (`/auth`)

| Method | Endpoint | Auth Required | Description |
|--------|----------|---------------|-------------|
| POST | `/auth/login` | No | User login |
| POST | `/auth/verify-token` | No | Verify Google/Apple token |
| POST | `/auth/social-login` | No | Social login |
| POST | `/auth/switch-profile` | Yes (JWT) | Switch between business profiles |
| POST | `/auth/logout` | Yes (JWT) | User logout |

#### Users Module (`/users`)

| Method | Endpoint | Auth Required | Description |
|--------|----------|---------------|-------------|
| POST | `/users/register` | No | User registration |
| POST | `/users/send-otp` | No | Send OTP |
| POST | `/users/verify` | No | Verify user |
| POST | `/users/verify-forgot-password-otp` | No | Verify forgot password OTP |
| POST | `/users/sync-contacts` | Yes (JWT) | Sync contacts |
| POST | `/users/delete` | Yes (JWT) | Delete account |
| GET | `/users/admin` | No | Get all users (admin) |
| GET | `/users/me` | Yes (JWT) | Get current user |
| GET | `/users/check-contact/:contactNumber` | No | Check if contact exists |
| GET | `/users/:id` | No | Get user by ID |
| PATCH | `/users` | Yes (JWT) | Update user |
| PATCH | `/users/change-password` | Yes (JWT) | Change password |
| PATCH | `/users/set-password` | Yes (JWT) | Set password |
| PATCH | `/users/reset-password` | No | Reset password |

#### Businesses Module (`/businesses`)

| Method | Endpoint | Auth Required | Role Required | Description |
|--------|----------|---------------|---------------|-------------|
| POST | `/businesses` | Yes (JWT) | - | Create business |
| GET | `/businesses` | No | - | Get all businesses (public) |
| GET | `/businesses/admin` | Yes (JWT) | SUPER_ADMIN, ADMIN | Get all businesses (admin) |
| GET | `/businesses/available-tag/:tag` | Yes (JWT) | - | Check if tag is available |
| GET | `/businesses/my` | Yes (JWT) | - | Get my businesses |
| GET | `/businesses/my-profile` | Yes (JWT) | - | Get my business profile |
| GET | `/businesses/filter-tier` | Yes (JWT) | - | Filter by tier |
| GET | `/businesses/:id` | No | - | Get business by ID |
| PATCH | `/businesses/verify/:id` | Yes (JWT) | SUPER_ADMIN, ADMIN | Verify business |
| PATCH | `/businesses/transfer/:clientId` | Yes (JWT) | BUSINESS_SUPER_ADMIN | Transfer business |
| PATCH | `/businesses/admin-transfer/:businessId` | Yes (JWT) | SUPER_ADMIN, ADMIN | Transfer business (admin) |
| POST | `/businesses/diversion/` | No | - | Search nearby businesses |
| PATCH | `/businesses/toggle-visible/:id` | Yes (JWT) | SUPER_ADMIN, BUSINESS_SUPER_ADMIN | Toggle visibility |
| PATCH | `/businesses/:id` | Yes (JWT) | SUPER_ADMIN, ADMIN, BUSINESS_SUPER_ADMIN | Update business |
| PATCH | `/businesses/admin/:id` | Yes (JWT) | SUPER_ADMIN, ADMIN | Update business (admin) |

#### Additional Modules

- **Address Categories** (`/address-categories`)
- **Addresses** (`/addresses`)
- **Advertisements** (`/advertisements`)
- **Analytics** (`/analytics`)
- **App Version** (`/app-version`)
- **Assets** (`/assets`)
- **Banners** (`/banners`)
- **Business Categories** (`/business-categories`)
- **Business Ratings** (`/business-ratings`)
- **Business Rejections** (`/business-rejections`)
- **Business Types** (`/business-types`)
- **Business Users** (`/business-users`)
- **Business Views** (`/business-views`)
- **Category Role** (`/category-role`)
- **Chats** (`/chats`)
- **Default Locations** (`/default-locations`)
- **Door Bell** (`/door-bell`)
- **Entity Additional Information** (`/entity-additional-information`)
- **Explore Categories** (`/explore-categories`)
- **FAQ** (`/faq`)
- **Favourites** (`/favourites`)
- **Language Translation** (`/language-translation`)
- **Object Management** (`/object-management`)
- **QR Reservation** (`/qr-reservation`)
- **QR Usages** (`/qr-usages`)
- **Queries** (`/queries`)
- **Role** (`/role`)
- **Role Permission** (`/role-permission`)
- **Seed** (`/seed`)
- **Settings** (`/settings`)
- **Shared Addresses** (`/shared-addresses`)
- **Tag Info** (`/tag-info`)
- **Tolet** (`/tolet`)
- **Uploads** (`/uploads`)

---

### Restaurant E-commerce API (Kaha_restaurant-ecommerce)

**Base URL:** `http://localhost:3000` (configurable)

#### Addons Module (`/addons`)

| Method | Endpoint | Auth Required | Description |
|--------|----------|---------------|-------------|
| POST | `/addons` | No | Create addon |
| GET | `/addons` | No | Get all addons |
| GET | `/addons/:id` | No | Get addon by ID |
| PATCH | `/addons/:id` | No | Update addon |
| DELETE | `/addons/:id` | No | Delete addon |

#### Cart Module (`/cart`)

| Method | Endpoint | Auth Required | Description |
|--------|----------|---------------|-------------|
| POST | `/cart` | Yes (JWT) | Create cart |
| POST | `/cart/item` | Yes (JWT) | Add item to cart |
| GET | `/cart` | Yes (JWT) | Get user's cart |
| PATCH | `/cart/:itemId` | No | Update cart item |
| DELETE | `/cart/:id` | Yes (JWT) | Delete cart/item |

#### Categories Module (`/categories`)

| Method | Endpoint | Auth Required | Role Required | Description |
|--------|----------|---------------|---------------|-------------|
| POST | `/categories` | Yes (JWT) | BUSINESS_SUPER_ADMIN | Create category |
| GET | `/categories/:businessId` | No | - | Get categories for business |
| GET | `/categories/:id` | No | - | Get category by ID |
| PATCH | `/categories/:id` | Yes (JWT) | BUSINESS_SUPER_ADMIN | Update category |
| DELETE | `/categories/:id` | Yes (JWT) | BUSINESS_SUPER_ADMIN | Delete category |

#### Menu Module (`/menu`)

| Method | Endpoint | Auth Required | Role Required | Description |
|--------|----------|---------------|---------------|-------------|
| POST | `/menu` | Yes (JWT) | BUSINESS_SUPER_ADMIN | Create menu item |
| GET | `/menu/:businessId` | No | - | Get menu for business |
| GET | `/menu/:id` | No | - | Get menu item by ID |
| PATCH | `/menu/:id` | Yes (JWT) | BUSINESS_SUPER_ADMIN | Update menu item |
| PATCH | `/menu/update-addons/:id` | Yes (JWT) | BUSINESS_SUPER_ADMIN | Update menu addons |
| PATCH | `/menu/toggle-signature/:id` | Yes (JWT) | BUSINESS_SUPER_ADMIN | Toggle signature |
| DELETE | `/menu/:id` | Yes (JWT) | BUSINESS_SUPER_ADMIN | Delete menu item |

#### Menu Ratings Module (`/menu-ratings`)

| Method | Endpoint | Auth Required | Description |
|--------|----------|---------------|-------------|
| POST | `/menu-ratings` | Yes (JWT) | Create menu rating |
| GET | `/menu-ratings/my-business` | Yes (JWT) | Get ratings for my business |
| GET | `/menu-ratings/business/:businessId` | Yes (JWT) | Get ratings for business |
| GET | `/menu-ratings/menu:menuId` | Yes (JWT) | Get ratings for menu |
| GET | `/menu-ratings/:id` | Yes (JWT) | Get rating by ID |
| PATCH | `/menu-ratings` | Yes (JWT) | Update rating |
| DELETE | `/menu-ratings/:id` | Yes (JWT) | Delete rating |

#### Order Module (`/order`)

| Method | Endpoint | Auth Required | Description |
|--------|----------|---------------|-------------|
| POST | `/order` | Yes (JWT) | Create order |
| GET | `/order/user` | Yes (JWT) | Get user's orders |
| GET | `/order/:id` | Yes (JWT) | Get order by ID |
| GET | `/order/business-man-vs/:businessId` | No | Get business orders |
| POST | `/order/:orderId/change-status` | Yes (JWT) | Change order status |

---

### Restaurant E-commerce API v2.0 (kahaVerse)

**Base URL:** `http://localhost:3005/api/v1`

#### Categories Module (`/categories`)

| Method | Endpoint | Auth Required | Role Required | Description |
|--------|----------|---------------|---------------|-------------|
| GET | `/categories` | No | - | List all categories |
| GET | `/categories/:id` | No | - | Get one category |
| GET | `/categories/:id/children` | No | - | Get sub-categories |
| POST | `/categories` | Yes (JWT) | BUSINESS_SUPER_ADMIN | Create category |
| PATCH | `/categories/:id` | Yes (JWT) | BUSINESS_SUPER_ADMIN | Update category |
| DELETE | `/categories/:id` | Yes (JWT) | BUSINESS_SUPER_ADMIN | Delete category (soft) |

#### Menus Module (`/menus`)

| Method | Endpoint | Auth Required | Role Required | Description |
|--------|----------|---------------|---------------|-------------|
| GET | `/menus` | No | - | List all menus (with filters) |
| GET | `/menus/:id` | No | - | Get one menu (with variants + addons) |
| POST | `/menus` | Yes (JWT) | BUSINESS_SUPER_ADMIN | Create menu item |
| PATCH | `/menus/:id` | Yes (JWT) | BUSINESS_SUPER_ADMIN | Update menu item |
| DELETE | `/menus/:id` | Yes (JWT) | BUSINESS_SUPER_ADMIN | Delete menu item (soft) |

#### Menu Variants Module (`/menus/:id/variants`)

| Method | Endpoint | Auth Required | Role Required | Description |
|--------|----------|---------------|---------------|-------------|
| GET | `/menus/:id/variants` | No | - | List variants |
| POST | `/menus/:id/variants` | Yes (JWT) | BUSINESS_SUPER_ADMIN | Add variant |
| PATCH | `/menus/:id/variants/:variantId` | Yes (JWT) | BUSINESS_SUPER_ADMIN | Update variant |
| DELETE | `/menus/:id/variants/:variantId` | Yes (JWT) | BUSINESS_SUPER_ADMIN | Delete variant |

#### Menu Addon Groups Module (`/menus/:id/addon-groups`)

| Method | Endpoint | Auth Required | Role Required | Description |
|--------|----------|---------------|---------------|-------------|
| GET | `/menus/:id/addon-groups` | No | - | List attached addon groups |
| POST | `/menus/:id/addon-groups` | Yes (JWT) | BUSINESS_SUPER_ADMIN | Attach addon group |
| DELETE | `/menus/:id/addon-groups/:addonGroupId` | Yes (JWT) | BUSINESS_SUPER_ADMIN | Detach addon group |

#### Addon Groups Module (`/addon-groups`)

| Method | Endpoint | Auth Required | Role Required | Description |
|--------|----------|---------------|---------------|-------------|
| GET | `/addon-groups` | No | - | List all addon groups |
| GET | `/addon-groups/:id` | No | - | Get one addon group (with addons) |
| POST | `/addon-groups` | Yes (JWT) | BUSINESS_SUPER_ADMIN | Create addon group |
| PATCH | `/addon-groups/:id` | Yes (JWT) | BUSINESS_SUPER_ADMIN | Update addon group |
| DELETE | `/addon-groups/:id` | Yes (JWT) | BUSINESS_SUPER_ADMIN | Delete addon group (soft) |

#### Addons Module (`/addon-groups/:id/addons`)

| Method | Endpoint | Auth Required | Role Required | Description |
|--------|----------|---------------|---------------|-------------|
| GET | `/addon-groups/:id/addons` | No | - | List addons in group |
| POST | `/addon-groups/:id/addons` | Yes (JWT) | BUSINESS_SUPER_ADMIN | Add addon |
| PATCH | `/addon-groups/:id/addons/:addonId` | Yes (JWT) | BUSINESS_SUPER_ADMIN | Update addon |
| DELETE | `/addon-groups/:id/addons/:addonId` | Yes (JWT) | BUSINESS_SUPER_ADMIN | Delete addon (soft) |

#### Cart Module (`/cart`)

| Method | Endpoint | Auth Required | Description |
|--------|----------|---------------|-------------|
| GET | `/cart` | Yes (JWT) | Get current user's cart |
| POST | `/cart/items` | Yes (JWT) | Add item to cart |
| PATCH | `/cart/items/:cartItemId` | Yes (JWT) | Update cart item |
| DELETE | `/cart/items/:cartItemId` | Yes (JWT) | Remove item from cart |
| DELETE | `/cart` | Yes (JWT) | Clear entire cart |

#### Cart Item Addons Module (`/cart/items/:cartItemId/addons`)

| Method | Endpoint | Auth Required | Description |
|--------|----------|---------------|-------------|
| POST | `/cart/items/:cartItemId/addons` | Yes (JWT) | Add addon to cart item |
| PATCH | `/cart/items/:cartItemId/addons/:addonId` | Yes (JWT) | Update addon quantity |
| DELETE | `/cart/items/:cartItemId/addons/:addonId` | Yes (JWT) | Remove addon from cart item |

#### Orders Module (Customer) (`/orders`)

| Method | Endpoint | Auth Required | Description |
|--------|----------|---------------|-------------|
| POST | `/orders` | Yes (JWT) | Place order (convert cart → order) |
| GET | `/orders` | Yes (JWT) | List my orders |
| GET | `/orders/:id` | Yes (JWT) | Get order detail |

#### Orders Module (Staff/Admin) (`/orders`)

| Method | Endpoint | Auth Required | Role Required | Description |
|--------|----------|---------------|---------------|-------------|
| GET | `/orders/business` | Yes (JWT) | BUSINESS_SUPER_ADMIN, ADMIN | List all orders for business |
| PATCH | `/orders/:id/status` | Yes (JWT) | BUSINESS_SUPER_ADMIN, ADMIN | Update order status |
| GET | `/orders/:id/status-history` | Yes (JWT) | USER, ADMIN | Get status history |

#### Order Cancel Module

| Method | Endpoint | Auth Required | Description |
|--------|----------|---------------|-------------|
| PATCH | `/orders/:id/cancel` | Yes (JWT) | Cancel order |

#### Reviews Module (`/reviews`)

| Method | Endpoint | Auth Required | Role Required | Description |
|--------|----------|---------------|---------------|-------------|
| POST | `/reviews` | Yes (JWT) | - | Submit review |
| GET | `/menus/:id/reviews` | No | - | Get reviews for menu item |
| PATCH | `/reviews/:id/visibility` | Yes (JWT) | BUSINESS_SUPER_ADMIN | Show/hide review |
| DELETE | `/reviews/:id` | Yes (JWT) | USER (own), ADMIN | Delete review (soft) |

---

## 🔐 Authentication & Authorization

### JWT Token Structure

```json
{
  "id": "user_id",
  "kahaId": "kaha_user_id",
  "businessId": "business_id",
  "role": "USER | ADMIN | BUSINESS_SUPER_ADMIN | SUPER_ADMIN"
}
```

### User Roles

- **USER** - Regular customer
- **ADMIN** - System administrator
- **BUSINESS_SUPER_ADMIN** - Business owner/manager
- **SUPER_ADMIN** - Platform super administrator

### Authorization Levels

- **Public** - No authentication required
- **Authenticated** - Requires valid JWT token
- **Role-based** - Requires JWT + specific role

---

## 📊 Database Relationships Summary

### Foreign Key References to AUTH_DB

| Table | Field | References AUTH_DB Table |
|-------|-------|------------------------|
| category | business_id | business.id |
| menu | business_id | business.id |
| addon_group | business_id | business.id |
| cart | user_id | user.id |
| cart | business_id | business.id |
| order | user_id | user.id |
| order | business_id | business.id |
| order_status_history | updated_by | user.id |
| review | rated_by | user.id |

### Internal Relationships

| Table | Field | References |
|-------|-------|------------|
| category | parent_id | category.id (self) |
| menu | category_id | category.id |
| menu_variant | menu_id | menu.id |
| addon | addon_group_id | addon_group.id |
| menu_addon_group | menu_id | menu.id |
| menu_addon_group | addon_group_id | addon_group.id |
| cart_item | cart_id | cart.id |
| cart_item | menu_id | menu.id |
| cart_item | menu_variant_id | menu_variant.id |
| cart_item_addon | cart_item_id | cart_item.id |
| cart_item_addon | addon_id | addon.id |
| order_item | order_id | order.id |
| order_item | menu_id | menu.id |
| order_item | menu_variant_id | menu_variant.id |
| order_item_addon | order_item_id | order_item.id |
| order_item_addon | addon_id | addon.id |
| order_status_history | order_id | order.id |
| review | menu_id | menu.id |
| review | order_item_id | order_item.id |

---

## 🎯 Key Features

### Multi-Tenancy
- All business data isolated by `businessId`
- Staff can only access their assigned business data
- Customers can browse multiple businesses

### Data Snapshots
- Order captures all names and prices at order time
- Prevents price changes affecting historical orders
- Includes menu_name_snapshot, variant_name_snapshot, addon_name_snapshot

### Status History
- Complete audit trail of order status changes
- Append-only order_status_history table
- Tracks who made changes and when

### Verified Reviews
- Reviews require order_item_id as proof of purchase
- Prevents fake reviews
- Admin can moderate (show/hide) reviews

### Flexible Menu System
- Menu variants (size/portion variations)
- Addon groups with min/max selection rules
- Required addons (e.g., spice level)
- Dietary tags (veg, non_veg, vegan, gluten_free, halal)

### Service Types
- DINE_IN - Table service
- TAKEAWAY - Pickup
- DELIVERY - Home delivery

---

## 📝 Environment Configuration

### Kaha Main v3 API

```env
# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=kaha_main_v3
DB_USER_NAME=postgres
DB_PASSWORD=password

# JWT
JWT_SECRET_TOKEN=your_secret_key

# Application
PORT=3001
```

### Restaurant E-commerce API

```env
# Application
APP_PORT=3000

# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=restaurant_ecommerce
DB_USER_NAME=postgres
DB_PASSWORD=password

# JWT (must match Kaha Main v3)
JWT_SECRET_TOKEN=your_secret_key

# External Services
KAH_API_V3_BASE_URL=https://api.kaha.com/v3
```

### Restaurant E-commerce API v2.0

```env
# Application
PORT=3005

# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=kaha_restaurant
DB_USER_NAME=postgres
DB_PASSWORD=password

# JWT
JWT_SECRET=your_secret_key
```

---

## 🔗 Service Communication

### External API Dependencies

The Restaurant E-commerce service communicates with Kaha Main v3 for:

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/users/{userId}` | Get user information |
| GET | `/users/{userId}` | Get user roles |
| GET | `/businesses/{businessId}` | Get business information |
| GET | `/business-users/{businessId}/{userId}` | Get user's business role |

### Communication Pattern

```
Client → [JWT Auth] → Restaurant E-commerce API
                            ↓
                    [HTTP Requests]
                            ↓
                      Kaha Main v3 API
                            ↓
                        AUTH_DB
```

---

## 📚 Technology Stack

- **Framework:** NestJS
- **ORM:** TypeORM
- **Database:** PostgreSQL
- **Authentication:** JWT
- **API Documentation:** Swagger/OpenAPI
- **Language:** TypeScript

---

## 📄 Summary

### Total Endpoints

- **Kaha Main v3 API:** ~50+ endpoints across 35+ modules
- **Restaurant E-commerce API:** ~25 endpoints
- **Restaurant E-commerce API v2.0:** ~46 endpoints

### Total Database Tables

- **AUTH_DB:** 40+ tables
- **Restaurant E-commerce DB:** 14 core tables

### Key Architecture Points

1. **AUTH_DB is the central hub** for user and business management
2. **All other databases reference AUTH_DB** via userId and businessId
3. **Multi-tenancy achieved** through businessId scoping
4. **Microservices architecture** with HTTP communication
5. **JWT-based authentication** with role-based authorization
6. **Data snapshots** for order integrity
7. **Soft deletes** for most entities
8. **Comprehensive indexing** for performance

---

**Document Version:** 1.0  
**Last Updated:** May 17, 2026
