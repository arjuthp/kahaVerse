# Category Module - Complete Flow Architecture

## 📋 Module Overview
The Category module manages hierarchical menu categories with support for parent-child relationships, enabling organized menu structure with nested subcategories.

---

## 🏗️ Architecture Layers

```
┌─────────────────────────────────────────────────────────────┐
│                    CLIENT REQUEST                            │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                CATEGORY CONTROLLER                           │
│  - Route Handling                                            │
│  - Authentication/Authorization (Guards)                     │
│  - Request Validation (DTOs)                                 │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                 CATEGORY SERVICE                             │
│  - Business Logic                                            │
│  - Hierarchical Data Management                              │
│  - Data Transformation                                       │
│  - Validation & Error Handling                               │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│            CATEGORY REPOSITORY (Data Access)                 │
│  - CategoryRepository                                        │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                    DATABASE (PostgreSQL)                     │
│  - category table (self-referencing)                         │
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
- GET `/categories/:businessId` - List all categories
- GET `/categories/:id` - Get single category

---

## 📡 API Endpoints & Flows

### 1️⃣ CREATE CATEGORY
**Endpoint:** `POST /categories`

**Authentication:** ✅ Required (BUSINESS_SUPER_ADMIN)

**Input (CreateCategoryDto):**
```typescript
{
  name: string,              // Required - Unique category name
  description?: string,      // Optional - Max 255 chars
  icon?: string,             // Optional - Icon URL/identifier
  parentId?: string,         // Optional - Parent category ID
  businessId?: string,       // Optional - Business identifier
  isAvailable?: boolean,     // Optional - Availability status
  createdBy?: string,        // Optional - Creator identifier
  position?: number          // Optional - Display order
}
```

**Flow:**
```
1. Check if category with same name exists (case-insensitive)
   ├─ If exists → Throw ConflictException
   └─ If not exists → Continue
2. If parentId is provided:
   ├─ Validate parent category exists
   ├─ If not found → Throw BadRequestException
   └─ If found → Continue
3. Create category entity from DTO
4. Save category with parent relation (if parentId provided)
5. Return success message
```

**Output:**
```typescript
{
  message: "Category successfully created."
}
```

**Business Rules:**
- Category name must be globally unique (case-insensitive)
- Parent category must exist if parentId is provided
- Supports hierarchical structure (parent-child)

---

### 2️⃣ GET ALL CATEGORIES (HIERARCHICAL)
**Endpoint:** `GET /categories/:businessId`

**Authentication:** ❌ Not Required (Public)

**Input:**
- Path param: `businessId` (string)

**Flow:**
```
1. Build query with:
   ├─ relations: childrens (nested 2 levels deep)
   ├─ where: parent IS NULL (only root categories)
   └─ where: businessId matches
2. Fetch all root categories with nested children
3. Transform each category to response format:
   ├─ Extract category fields
   ├─ Map children to simplified format
   └─ Return hierarchical structure
4. Return array of root categories with nested children
```

**Output:**
```typescript
ICategoryResponse[] // Array of root categories with nested children
```

**ICategoryResponse Structure:**
```typescript
{
  id: string,
  name: string,
  description?: string,
  icon: string,
  isActive: boolean,
  position: number,
  childrens: [
    {
      id: string,
      name: string,
      description?: string,
      icon: string,
      isActive: boolean,
      position: number
    }
  ]
}
```

**Hierarchy Example:**
```json
[
  {
    "id": "cat-1",
    "name": "Food",
    "isActive": true,
    "position": 1,
    "childrens": [
      {
        "id": "cat-2",
        "name": "Appetizers",
        "isActive": true,
        "position": 1
      },
      {
        "id": "cat-3",
        "name": "Main Course",
        "isActive": true,
        "position": 2
      }
    ]
  },
  {
    "id": "cat-4",
    "name": "Beverages",
    "isActive": true,
    "position": 2,
    "childrens": []
  }
]
```

**Key Features:**
- Returns only root categories (parent IS NULL)
- Includes nested children up to 2 levels deep
- Hierarchical tree structure
- Business-scoped results

---

### 3️⃣ GET CATEGORY BY ID
**Endpoint:** `GET /categories/:id`

**Authentication:** ❌ Not Required (Public)

**Input:**
- Path param: `id` (categoryId)

**Flow:**
```
1. Find category by id
2. Include childrens relation (1 level)
3. Transform to response format
4. Return category details with children
```

**Output:**
```typescript
ICategoryResponse
```

**Note:** Returns single category with its immediate children only

---

### 4️⃣ UPDATE CATEGORY
**Endpoint:** `PATCH /categories/:id`

**Authentication:** ✅ Required (BUSINESS_SUPER_ADMIN)

**Input (UpdateCategoryDto):**
```typescript
{
  name: string,              // Required
  description?: string,      // Optional - Max 255 chars
  icon?: string,             // Optional
  isActive: boolean,         // Required
  parentId?: string          // Optional - Parent category ID
}
```

**Flow:**
```
1. Extract businessId from JWT token
2. Find existing category by id and businessId
3. If name is being changed:
   ├─ Check if new name already exists (case-insensitive)
   ├─ If exists → Throw ConflictException
   └─ If not exists → Continue
4. If parentId is provided:
   ├─ Validate parent category exists
   ├─ If not found → Throw NotFoundException
   ├─ If found → Add parent to update object
   └─ Continue
5. Update category with:
   - All provided fields
   - name (if changed)
   - parent relation (if parentId provided)
6. Return success message
```

**Output:**
```typescript
{
  message: "Category successfully updated."
}
```

**Business Rules:**
- Category name must remain globally unique
- Only owner business can update category
- Can change parent category (move in hierarchy)
- Parent category must exist if provided

---

### 5️⃣ DELETE CATEGORY
**Endpoint:** `DELETE /categories/:id`

**Authentication:** ✅ Required (BUSINESS_SUPER_ADMIN)

**Input:**
- Path param: `id` (categoryId)

**Flow:**
```
1. Extract businessId from JWT token
2. Find category by id and businessId
   ├─ If not found → Throw NotFoundException
   └─ If found → Continue
3. Delete category where id = categoryId AND businessId = businessId
4. Return success message
```

**Output:**
```typescript
{
  message: "Category successfully deleted."
}
```

**Business Rules:**
- Only owner business can delete category
- Hard delete (not soft delete)
- ⚠️ **Warning:** Deleting a category may affect:
  - Child categories (if cascade delete is configured)
  - Menu items associated with this category

---

## 🗄️ Database Schema

### CategoryEntity
```typescript
{
  id: UUID (PK),
  name: string (unique, indexed),
  description: string (max 1024 chars, nullable),
  icon: string (nullable),
  isActive: boolean (default: true),
  position: number (nullable),
  businessId: string (indexed),
  
  // Self-Referencing Relations
  parent: ManyToOne → CategoryEntity (nullable),
  childrens: OneToMany → CategoryEntity[] (nullable),
  
  // External Relations
  menu: OneToMany → MenuEntity[],
  
  // Timestamps (from BaseEntity)
  createdAt: timestamp,
  updatedAt: timestamp
}
```

### Hierarchical Structure
```
CategoryEntity (Self-Referencing)
├─ parent: ManyToOne → CategoryEntity
└─ childrens: OneToMany → CategoryEntity[]

CategoryEntity ──OneToMany──> MenuEntity
```

**Hierarchy Example:**
```
Food (parent: null)
├─ Appetizers (parent: Food)
│  ├─ Salads (parent: Appetizers)
│  └─ Soups (parent: Appetizers)
├─ Main Course (parent: Food)
│  ├─ Vegetarian (parent: Main Course)
│  └─ Non-Vegetarian (parent: Main Course)
└─ Desserts (parent: Food)

Beverages (parent: null)
├─ Hot Drinks (parent: Beverages)
└─ Cold Drinks (parent: Beverages)
```

---

## 🔄 Data Transformation

### transformToCategoryResponse()
**Purpose:** Convert CategoryEntity to ICategoryResponse

**Process:**
```
1. Extract category fields (id, name, description, icon, isActive, position)
2. Map childrens array:
   ├─ Extract child fields (id, name, description, icon, isActive, position)
   └─ Create simplified child objects
3. Return formatted response with nested children
```

**Input:** CategoryEntity (with relations)
**Output:** ICategoryResponse (hierarchical structure)

---

## ⚠️ Error Handling

### ConflictException (409)
- Category with same name already exists (on create)
- Category with same name already exists (on update)

### BadRequestException (400)
- Parent category not found (on create)

### NotFoundException (404)
- Parent category not found (on update)
- Category not found (on delete)

---

## 🔍 Business Logic Summary

### Category Creation
- Validates unique name globally (case-insensitive)
- Supports parent-child hierarchy
- Optional parent category validation
- Position-based ordering

### Category Listing
- Returns hierarchical tree structure
- Only root categories at top level
- Nested children up to 2 levels
- Business-scoped filtering
- Ordered by position

### Category Update
- Name uniqueness validation (if changed)
- Can reassign parent (move in hierarchy)
- Toggle active/inactive status
- Update icon and description

### Category Deletion
- Validates category exists
- Business-scoped deletion
- Hard delete implementation
- May cascade to children and menus

### Hierarchical Features
- Self-referencing table structure
- Parent-child relationships
- Unlimited nesting depth (database level)
- 2-level deep fetching (API level)
- Position-based ordering

---

## 📊 Key Features

✅ Hierarchical category structure (parent-child)
✅ Self-referencing relationships
✅ Unique category names (global)
✅ Active/inactive toggle
✅ Custom icon support
✅ Position-based ordering
✅ Business-scoped operations
✅ Nested children fetching (2 levels)
✅ Public read access
✅ Description support (1024 chars)

---

## 🔗 Dependencies

**Repositories:**
- CategoryRepository

**Entities:**
- CategoryEntity (self-referencing)
- MenuEntity (related)

**Guards:**
- JwtAuthGuard
- RolesGuard

**Enums:**
- UserRoleEnum (BUSINESS_SUPER_ADMIN)

---

## 🎯 Use Cases

### 1. Simple Flat Structure
```
Appetizers
Main Course
Desserts
Beverages
```

### 2. Two-Level Hierarchy
```
Food
├─ Appetizers
├─ Main Course
└─ Desserts

Beverages
├─ Hot Drinks
└─ Cold Drinks
```

### 3. Multi-Level Hierarchy
```
Menu
├─ Food
│  ├─ Starters
│  │  ├─ Veg Starters
│  │  └─ Non-Veg Starters
│  ├─ Main Course
│  │  ├─ Indian
│  │  ├─ Chinese
│  │  └─ Continental
│  └─ Desserts
└─ Beverages
   ├─ Hot
   └─ Cold
```

---

## 📝 Notes

1. **Global Uniqueness:** Category names are unique across all businesses (not business-scoped)
2. **Case-Insensitive Check:** Uses `ILike` for duplicate detection
3. **Nested Fetching:** API returns 2 levels deep, but database supports unlimited nesting
4. **Root Categories:** Fetched using `parent: IsNull()` condition
5. **Hard Delete:** No soft delete implementation
6. **Position Field:** Used for custom ordering (nullable)
7. **Icon Field:** Flexible - can store URL, identifier, or emoji
8. **Description Limit:** 1024 characters in database, 255 in DTO validation

---

## 🚨 Important Considerations

### Cascade Behavior
- Deleting a parent category may affect child categories
- Deleting a category may affect associated menu items
- Ensure proper cascade configuration or handle orphaned records

### Performance
- Hierarchical queries can be expensive with deep nesting
- Consider caching for frequently accessed category trees
- Index on `businessId` and `name` for faster lookups

### Data Integrity
- Validate parent-child relationships to prevent circular references
- Ensure parent category belongs to same business
- Handle orphaned categories if parent is deleted

---

## 🔄 Comparison with Menu Module

| Feature | Category Module | Menu Module |
|---------|----------------|-------------|
| Hierarchy | ✅ Self-referencing | ❌ Flat structure |
| Name Uniqueness | Global | Per business |
| Nesting Levels | Unlimited (DB) / 2 (API) | N/A |
| Relations | Self + Menu | Category + Addons |
| Complexity | Medium | High |
| Primary Purpose | Organization | Product catalog |
