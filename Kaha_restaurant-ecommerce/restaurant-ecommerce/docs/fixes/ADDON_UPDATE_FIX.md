# Addon Update Endpoint - 500 Error Fix

## Problem
PATCH request to `/api/v1/addon-groups/{groupId}/addons/{addonId}` was returning 500 Internal Server Error.

## Root Cause
The controller was using `Partial<CreateAddonDto>` for the update endpoint, which has required field validations that conflict with partial updates.

## Solution Applied

### 1. Created UpdateAddonDto
Created a new DTO specifically for updates with all fields optional:

**File:** `src/modules/addon-groups/dtos/update-addon.dto.ts`

```typescript
export class UpdateAddonDto {
  @IsString()
  @IsOptional()
  name?: string;

  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  price?: number;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  coverImg?: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  sortOrder?: number;
}
```

### 2. Updated Controller
Changed the `updateAddon` method to use `UpdateAddonDto`:

**File:** `src/modules/addon-groups/addon-groups.controller.ts`

```typescript
@Patch(':id/addons/:addonId')
updateAddon(@Param('id') id: string, @Param('addonId') addonId: string, @Body() body: UpdateAddonDto) {
  return this.addonGroupsService.updateAddon(addonId, body);
}
```

### 3. Updated Service
Updated the service method signature and added error logging:

**File:** `src/modules/addon-groups/addon-groups.service.ts`

```typescript
async updateAddon(addonId: string, body: UpdateAddonDto) {
  try {
    const addon = await this.addonRepository.findOne({ where: { id: addonId } });
    if (!addon) throw new NotFoundException('Addon not found');
    
    Object.assign(addon, body);
    await this.addonRepository.save(addon);
    
    return this.addonRepository.findOne({ where: { id: addonId } });
  } catch (error) {
    console.error('Error updating addon:', error);
    throw error;
  }
}
```

### 4. Updated Exports
Added the new DTO to the exports:

**File:** `src/modules/addon-groups/dtos/index.ts`

```typescript
export * from './create-addon-group.dto';
export * from './create-addon.dto';
export * from './update-addon.dto';
```

## Files Modified
1. ✅ `src/modules/addon-groups/dtos/update-addon.dto.ts` (NEW)
2. ✅ `src/modules/addon-groups/dtos/index.ts`
3. ✅ `src/modules/addon-groups/addon-groups.controller.ts`
4. ✅ `src/modules/addon-groups/addon-groups.service.ts`

## Next Steps

### Restart the Server
The changes require a server restart to take effect:

```bash
# If using npm
npm run start:dev

# Or if running with ts-node
npm run build && npm run start:prod
```

### Test the Fix
After restarting, test with curl:

```bash
# Get a valid addon group and addon ID
curl http://127.0.0.1:3001/api/v1/addon-groups | jq '.[0] | {id, addons: .addons[0]}'

# Update an addon (replace IDs with actual values)
curl -X PATCH http://127.0.0.1:3001/api/v1/addon-groups/GROUP_ID/addons/ADDON_ID \
  -H "Content-Type: application/json" \
  -d '{"name":"Premium Cheese","price":1.50}'
```

### Test in Postman
1. Re-import the updated collections (already fixed with 127.0.0.1)
2. Run "✅ CREATE - Valid Addon Group" to create a group
3. Run "✅ ADD - Addon to Group" to add an addon
4. Run "✅ UPDATE - Addon in Group" - should work now! ✅

## Why This Fixes It

**Before:** Using `Partial<CreateAddonDto>` meant the validation pipe was still checking required fields even though TypeScript made them optional.

**After:** `UpdateAddonDto` explicitly marks all fields as `@IsOptional()`, so the validation pipe correctly allows partial updates.

## Verification

After restart, the endpoint should:
- ✅ Accept partial updates (only name, only price, or both)
- ✅ Return 200 with updated addon data
- ✅ Properly validate data types (price must be number, etc.)
- ❌ Return 404 if addon not found
- ❌ Return 400 if validation fails (e.g., price is string)
