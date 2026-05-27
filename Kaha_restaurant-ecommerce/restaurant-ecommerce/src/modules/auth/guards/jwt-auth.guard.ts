// ==================== SECTION 1: PURPOSE - Import JWT Authentication Guard ====================
// PURPOSE: Import NestJS Passport JWT strategy guard for token extraction and basic validation
// INPUT: JWT token from Authorization header (Bearer <token>)
// ACTIONS: Extend NestJS AuthGuard with "jwt" strategy to validate JWT signature locally
// CHECKS: JWT signature valid, token not expired (local validation only)
// OUTPUT: AuthGuard extracts and validates JWT, attached user payload to request
import { Injectable } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";

// ==================== SECTION 2: PURPOSE - Extend JWT Authentication Guard ====================
// PURPOSE: Create JWT authentication guard for protecting routes
// INPUT: HTTP request with Authorization header containing Bearer JWT token
// ACTIONS:
//   1. Extract JWT token from Authorization header
//   2. Validate JWT signature using JWT_SECRET_TOKEN
//   3. Decode JWT payload (contains user ID, business ID, role, etc.)
//   4. Attach decoded payload to request.user
// CHECKS:
//   - JWT signature valid (matches JWT_SECRET_TOKEN)
//   - JWT not expired
//   - JWT well-formed
// OUTPUT: Request.user populated with JWT payload, or 401 Unauthorized
// NOTE: This is STEP 1 of Option B validation. RolesGuard handles STEP 2 (Kaha Main V3 validation)
@Injectable()
export class JwtAuthGuard extends AuthGuard("jwt") {}
