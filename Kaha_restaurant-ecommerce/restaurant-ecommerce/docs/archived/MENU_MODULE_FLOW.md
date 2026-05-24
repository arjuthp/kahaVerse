# Menu Module - Complete Flow Architecture

## 📋 Module Overview
The Menu module manages restaurant menu items including creation, updates, filtering, signature items, and addon management.

---

## 🏗️ Architecture Layers

```
┌─────────────────────────────────────────────────────────────┐
│                    CLIENT REQUEST                            │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                  MENU CONTROLLER                             │
│  - Route Handling                                            │
│  - Authentication/Authorization (Guards)                     │
│  - Request Validation (DTOs)                                 │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                   MENU SERVICE                               │
│  - Business Logic                                            │
│  - Data Transformation                                       │
│  - Validation & Error Handling                               │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│              REPOSITORIES (Data Access)                      │
│  - MenuRepository                                            │
│  - CategoryRepository                                        │
│  - AddonsRepository                                          │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                    DATABASE (PostgreSQL)                     │
│  - menu table                                                │
│  - category table                                            │
│  - addons table                                              │
│  - menu_addons junction table                                │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔐 Authentication & Authorization

**Guards Applied:**
- `JwtAuthGuard` - Validates JWT token
- `RolesGuard` - Checks user role permissions

**Required Role:**
- `BUSINESS_SUPER_ADMIN` (for all write operations)

**Public Endpoints:**
- GET `/menu/:businessId` - List all menus
- GET `/menu/:id` - Get single menu

---

## 📡 API Endpoints & Flows

### 1️⃣ CREATE MENU
**Endpoint:** `POST /menu`

**Authentication:** ✅ Required (BUSINESS_SUPER_ADMIN)

**Input (CreateMenuDto):**
```typescript
{
  name: string,                    // Required
  categoryId: string,              // Required
  description?: string,            // Optional
  details?: Record<string, string>, // Optional (JSONB)
  services?: MenuServiceEnum[],    // Optional [DINE_IN, TAKEAWAY, DELIVERY]
  images?: string[],               // Optional
  isBarItem?: boolean,             // Optional (default: false)
  isSignature?: boolean,           // Optional (default: false)
  isAvailable?: boolean,           // Optional (default: true)
  allowAddOns?: boolean,           // Optional (default: false)
  price: number,                   // Required
  discountedPrice?: number,        // Optional
  addOnIds?: string[]              // Optional
}
```

**Flow:**
```
1. Extract businessId from JWT token (req.user.businessId)
2. Check if menu with same name exists for this business
   ├─ If exists → Throw ConflictException
   └─ If not exists → Continue
3. Validate categoryId exists in database
   ├─ If not found → Throw NotFoundException
   └─ If found → Continue
4. If addOnIds provided:
   └─ Fetch all addons with matching IDs
5. Save menu with:
   - Basic menu data
   - businessId
   - category relation
   - addOns relation (if provided)
6. Return success message
```

**Output:**
```typescript
{
  message: "Menu created successfully."
}
```

**Business Rules:**
- Menu name must be unique per business (case-insensitive)
- Category must exist
- AddOns must exist if provided

---

### 2️⃣ GET ALL MENUS (WITH FILTERS)
**Endpoint:** `GET /menu/:businessId`

**Authentication:** ❌ Not Required (Public)

**Input (FilterMenuDto - Query Params):**
```typescript
{
  page?: string,        // Default: "1"
  take?: string,        // Default: "10"
  name?: string,        // Filter by name (partial match)
  categoryId?: string,  // Filter by category
  minPrice?: number,    // Price range filter
  maxPrice?: number,    // Price range filter
  groupBy?: string      // "category" for grouped response
}
```

**Flow:**
```
1. Parse pagination params (page, take)
2. Calculate skip value: (page - 1) * take
3. Build where clause:
   ├─ businessId (always)
   ├─ category.id (if categoryId provided)
   ├─ menu.name LIKE %name% (if name provided)
   └─ menu.price BETWEEN minPrice AND maxPrice (if both provided)
4. Execute findAndCount with:
   - where clause
   - relations: category, addOns
   - skip & take for pagination
5. If groupBy === "category":
   ├─ Group menus by category name
   └─ Return grouped object
6. Else:
   ├─ Transform each menu to response format
   ├─ Calculate totalPages
   └─ Return paginated response with metadata
```

**Output (Paginated):**
```typescript
{
  metaData: {
    currentPage: number,
    totalPages: number,
    totalCount: number,
    perPage: number
  },
  data: IMenuResponse[]
}
```

**Output (Grouped by Category):**
```typescript
{
  "Appetizers": [IMenuResponse, ...],
  "Main Course": [IMenuResponse, ...],
  "Desserts": [IMenuResponse, ...]
}
```

**IMenuResponse Structure:**
```typescript
{
  id: string,
  name: string,
  businessId: string,
  description?: string,
  details?: any,
  services?: MenuServiceEnum[],
  images?: string[],
  isBarItem?: boolean,
  allowAddOns?: boolean,
  isSignature?: boolean,
  isAvailable?: boolean,
  price: number,
  discountedPrice: number,
  addonsInfo?: [{
    id: string,
    price: number,
    name: string,
    description?: string,
    coverImg?: string
  }]
}
```

---

### 3️⃣ GET MENU BY ID
**Endpoint:** `GET /menu/:id`

**Authentication:** ❌ Not Required (Public)

**Input:**
- Path param: `id` (menuId)

**Flow:**
```
1. Find menu by id
2. Transform to response format
3. Return menu details
```

**Output:**
```typescript
IMenuResponse
```

---

### 4️⃣ UPDATE MENU
**Endpoint:** `PATCH /menu/:id`

**Authentication:** ✅ Required (BUSINESS_SUPER_ADMIN)

**Input (UpdateMenuDto):**
```typescript
{
  name: string,                    // Required
  categoryId: string,              // Required
  businessId: string,              // Required
  description?: string,
  details?: Record<string, string>,
  services?: MenuServiceEnum[],
  images?: string[],
  isBarItem?: boolean,
  isSignature?: boolean,
  isAvailable?: boolean,
  allowAddOns?: boolean,
  price: number,                   // Required
  discountedPrice?: number,
  addOnIds?: string[]
}
```

**Flow:**
```
1. Extract businessId from JWT token
2. Find existing menu by id and businessId
3. If name is being changed:
   ├─ Check if new name already exists (case-insensitive)
   ├─ If exists → Throw ConflictException
   └─ If not exists → Continue
4. Update menu with:
   - All provided fields
   - category relation (by categoryId)
5. Return success message
```

**Output:**
```typescript
{
  message: "The menu item was successfully updated."
}
```

**Business Rules:**
- Menu name must remain unique per business
- Only owner business can update menu

---

### 5️⃣ UPDATE MENU ADDONS
**Endpoint:** `PATCH /menu/update-addons/:id`

**Authentication:** ✅ Required (BUSINESS_SUPER_ADMIN)

**Input (UpdateMenuAddonsDto):**
```typescript
{
  addOnsIds?: string[]  // Array of addon IDs
}
```

**Flow:**
```
1. Extract businessId from JWT token
2. Find menu by id and businessId with addOns relation
3. Fetch all addons with matching IDs from addOnsIds
4. Replace menu.addOns with new addons array
5. Save menu entity
6. Return success message
```

**Output:**
```typescript
{
  message: "Menu addons updated successfully"
}
```

**Business Rules:**
- Completely replaces existing addons (not append)
- All addon IDs must exist

---

### 6️⃣ TOGGLE SIGNATURE MENU
**Endpoint:** `PATCH /menu/toggle-signature/:id`

**Authentication:** ✅ Required (BUSINESS_SUPER_ADMIN)

**Input (ToggleSignatureDto):**
```typescript
{
  isSignature: boolean  // Required
}
```

**Flow:**
```
1. Extract businessId from JWT token
2. Find menu by menuId and businessId
   ├─ If not found → Throw NotFoundException
   └─ If found → Continue
3. If isSignature === true:
   ├─ Check if menu is already signature
   │  └─ If yes → Throw BadRequestException
   ├─ Count existing signature products for business
   ├─ If count >= 3 → Throw BadRequestException
   └─ Continue
4. Update menu.isSignature field
5. Return appropriate success message
```

**Output:**
```typescript
{
  message: "The menu is marked as signature successfully."
  // OR
  message: "The menu is removed from signature menu."
}
```

**Business Rules:**
- Maximum 3 signature menus per business
- Cannot mark already signature menu as signature again
- Only owner business can toggle signature

---

### 7️⃣ DELETE MENU
**Endpoint:** `DELETE /menu/:id`

**Authentication:** ✅ Required (BUSINESS_SUPER_ADMIN)

**Input:**
- Path param: `id` (menuId)

**Flow:**
```
1. Extract businessId from JWT token
2. Delete menu where id = menuId AND businessId = businessId
3. Return success message
```

**Output:**
```typescript
{
  message: "The menu item was successfully deleted."
}
```

**Business Rules:**
- Only owner business can delete menu
- Soft delete not implemented (hard delete)

---

## 🗄️ Database Schema

### MenuEntity
```typescript
{
  id: UUID (PK),
  name: string,
  description: string (nullable),
  images: string[] (nullable),
  details: JSONB (nullable),
  isBarItem: boolean (default: false),
  isAvailable: boolean (default: true),
  services: MenuServiceEnum[] (default: [DINE_IN]),
  price: numeric(12,2),
  discountedPrice: numeric(12,2) (nullable),
  businessId: string (indexed),
  isSignature: boolean (default: false),
  allowAddOns: boolean (default: false),
  
  // Relations
  category: ManyToOne → CategoryEntity (eager),
  addOns: ManyToMany → AddOnEntity,
  menuRating: OneToMany → MenuRatingEntity,
  
  // Timestamps (from BaseEntity)
  createdAt: timestamp,
  updatedAt: timestamp
}
```

### Relations
```
MenuEntity ──ManyToOne──> CategoryEntity
MenuEntity ──ManyToMany──> AddOnEntity
MenuEntity ──OneToMany──> MenuRatingEntity
```

---

## 🔄 Data Transformation

### transformToMenuResponse()
**Purpose:** Convert MenuEntity to IMenuResponse

**Process:**
```
1. Extract addOns from menu entity
2. Map addOns to addonsInfo (id, price, name, description, coverImg)
3. Extract menu fields
4. Return formatted response object
```

---

## ⚠️ Error Handling

### ConflictException (409)
- Menu with same name already exists

### NotFoundException (404)
- Category not found
- Menu not found

### BadRequestException (400)
- Menu already marked as signature
- Signature menu limit reached (max 3)

---

## 🔍 Business Logic Summary

### Menu Creation
- Validates unique name per business
- Requires valid category
- Optional addons association
- Supports multiple service types

### Menu Filtering
- Pagination support
- Name search (partial match)
- Category filter
- Price range filter
- Group by category option

### Signature Menu Management
- Maximum 3 signature items per business
- Prevents duplicate signature marking
- Toggle on/off functionality

### Addon Management
- Separate endpoint for addon updates
- Complete replacement (not incremental)
- Many-to-many relationship

### Authorization
- Business-scoped operations
- Only BUSINESS_SUPER_ADMIN can modify
- Public read access

---

## 📊 Key Features

✅ Multi-service support (Dine-in, Takeaway, Delivery)
✅ Flexible pricing (regular + discounted)
✅ Image gallery support
✅ Custom details (JSONB)
✅ Category organization
✅ Addon system
✅ Signature menu highlighting
✅ Availability toggle
✅ Bar item classification
✅ Advanced filtering & pagination
✅ Group by category view

---

## 🔗 Dependencies

**Repositories:**
- MenuRepository
- CategoryRepository
- AddonsRepository

**Entities:**
- MenuEntity
- CategoryEntity
- AddOnEntity

**Guards:**
- JwtAuthGuard
- RolesGuard

**Enums:**
- MenuServiceEnum (DINE_IN, TAKEAWAY, DELIVERY)
- UserRoleEnum (BUSINESS_SUPER_ADMIN)

---

## 📝 Notes

1. **Case-Insensitive Name Check:** Uses `ILike` for duplicate detection
2. **Eager Loading:** Category is eagerly loaded by default
3. **Soft Delete:** Not implemented (uses hard delete)
4. **Price Precision:** Stored as numeric(12,2)
5. **Business Isolation:** All operations are business-scoped
6. **Public Access:** Read operations don't require authentication
