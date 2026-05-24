# Menu Controller Complete Flow & Connections

## 🔄 Complete Request Flow

```
HTTP Request → JwtAuthGuard → RolesGuard → Controller → Service → Repository → Database
     ↓              ↓            ↓           ↓          ↓          ↓
   Bearer Token → JWT Strategy → Role Check → DTO → Business Logic → SQL Query
```

## 📁 File Connections & Dependencies

### 1. **Authentication Flow**
```
menu.controller.ts
├── @UseGuards(JwtAuthGuard)
│   └── src/modules/auth/guards/jwt-auth.guard.ts
│       └── extends AuthGuard("jwt")
│           └── src/modules/auth/strategy/jwt.strategy.ts
│               ├── validates JWT token
│               ├── extracts user payload (id, kahaId, businessId)
│               └── uses ConfigurationService for JWT secret
│
└── @UseGuards(RolesGuard)
    └── src/modules/auth/guards/roles.guard.ts
        ├── uses Reflector to get required roles
        ├── calls ServiceCommunicationService.getUserRoles()
        └── compares user role with required roles
```

### 2. **Authorization Flow**
```
@Roles(UserRoleEnum.ADMIN)
├── src/common/decorator/roles.decorator.ts
│   ├── ROLES_KEY = 'roles'
│   └── SetMetadata(ROLES_KEY, roles)
│
└── src/common/enums/user-role.enum.ts
    ├── USER = 'user'
    ├── ADMIN = 'admin'
    ├── BUSINESS_SUPER_ADMIN = 'business_super_admin'
    └── SUPER_ADMIN = 'super_admin'
```

### 3. **Data Transfer Objects (DTOs)**
```
src/modules/menu/dtos/index.ts
├── CreateMenuDto → create new menu items
├── FilterMenuDto → search/filter parameters
├── ToggleSignatureDto → mark signature dishes
├── UpdateMenuDto → update menu items
└── UpdateMenuAddonsDto → manage add-ons
```

### 4. **Business Logic Flow**
```
MenuController
└── MenuService (src/modules/menu/menu.service.ts)
    ├── MenuRepository → menu CRUD operations
    ├── AddonsRepository → add-ons management
    └── CategoryRepository → category validation
```

## 🔐 Security & Role-Based Access

### Role Hierarchy
```
SUPER_ADMIN (highest)
    ↓
BUSINESS_SUPER_ADMIN
    ↓
ADMIN
    ↓
USER (lowest)
```

### Typical Endpoint Protection
```typescript
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRoleEnum.ADMIN, UserRoleEnum.BUSINESS_SUPER_ADMIN)
@Post()
async createMenu(@Body() dto: CreateMenuDto) {
  // Only ADMIN and BUSINESS_SUPER_ADMIN can create menus
}
```

## 🔄 Step-by-Step Request Processing

### Example: Creating a Menu Item

1. **HTTP Request**
   ```
   POST /menu
   Headers: Authorization: Bearer <jwt-token>
   Body: CreateMenuDto
   ```

2. **JwtAuthGuard Processing**
   ```
   JwtAuthGuard → JwtStrategy.validate()
   ├── Extracts JWT from Authorization header
   ├── Validates token signature
   ├── Extracts payload: { id, kahaId, businessId }
   └── Attaches user to request object
   ```

3. **RolesGuard Processing**
   ```
   RolesGuard.canActivate()
   ├── Gets required roles from @Roles decorator
   ├── Gets user ID from request.user.id
   ├── Calls ServiceCommunicationService.getUserRoles(userId)
   ├── Compares user.role with required roles
   └── Returns true/false for access
   ```

4. **Controller Processing**
   ```
   MenuController.createMenu()
   ├── Validates request body against CreateMenuDto
   ├── Extracts businessId from request.user
   └── Calls MenuService.createMenu()
   ```

5. **Service Processing**
   ```
   MenuService.createMenu()
   ├── Validates category exists
   ├── Checks for duplicate menu names
   ├── Validates add-ons if provided
   ├── Saves to database via MenuRepository
   └── Returns success response
   ```

## 🔗 Inter-Module Dependencies

```
MenuModule
├── imports: [AuthModule] → for guards
├── imports: [ServiceCommunicationModule] → for user role validation
├── imports: [RepositoryModule] → for database access
└── providers: [MenuService, MenuController]

AuthModule
├── provides: [JwtAuthGuard, RolesGuard, JwtStrategy]
└── imports: [PassportModule, JwtModule]

ServiceCommunicationModule
├── provides: [ServiceCommunicationService]
└── handles external service calls for user roles
```

## 🎯 Key Integration Points

1. **JWT Token Flow**: `JwtStrategy` → `JwtAuthGuard` → `req.user`
2. **Role Validation**: `@Roles` → `RolesGuard` → `ServiceCommunicationService`
3. **Data Validation**: `DTOs` → `ValidationPipe` → `Controller`
4. **Business Logic**: `Controller` → `Service` → `Repository`
5. **Response**: `Service` → `Controller` → `HTTP Response`

## 🚨 Error Handling Points

- **401 Unauthorized**: Invalid/expired JWT token
- **403 Forbidden**: Insufficient role permissions
- **400 Bad Request**: Invalid DTO validation
- **404 Not Found**: Menu/Category not found
- **409 Conflict**: Duplicate menu names

This architecture ensures secure, role-based access to menu operations with clear separation of concerns.