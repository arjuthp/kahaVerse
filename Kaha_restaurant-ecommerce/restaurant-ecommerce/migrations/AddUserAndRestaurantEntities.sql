-- Migration: Add User and Restaurant Entities for Kaha Sync
-- Date: 2026-05-24
-- Description: Creates user and restaurant tables with Kaha integration fields

-- ============================================
-- 1. CREATE USER TABLE
-- ============================================

CREATE TYPE user_type_enum AS ENUM ('customer', 'restaurant_owner', 'admin', 'service_account');
CREATE TYPE auth_provider_enum AS ENUM ('local', 'google', 'facebook', 'kaha');

CREATE TABLE "user" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone VARCHAR NOT NULL UNIQUE,
  "firstName" VARCHAR,
  "lastName" VARCHAR,
  email VARCHAR UNIQUE,
  password VARCHAR,
  "userType" user_type_enum NOT NULL DEFAULT 'customer',
  "authProvider" auth_provider_enum NOT NULL DEFAULT 'local',
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "isEmailVerified" BOOLEAN NOT NULL DEFAULT false,
  "isPhoneVerified" BOOLEAN NOT NULL DEFAULT false,
  
  -- Kaha Integration Fields
  "externalId" VARCHAR UNIQUE,
  source VARCHAR,
  metadata JSONB,
  
  -- Service Account Fields
  "serviceAccountName" VARCHAR,
  "tokenExpiresAt" TIMESTAMP,
  
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW(),
  "deletedAt" TIMESTAMP
);

-- Indexes for User table
CREATE INDEX idx_user_phone ON "user"(phone);
CREATE INDEX idx_user_email ON "user"(email);
CREATE INDEX idx_user_external_id ON "user"("externalId");
CREATE INDEX idx_user_service_account ON "user"("serviceAccountName") WHERE "userType" = 'service_account';

-- ============================================
-- 2. CREATE RESTAURANT TABLE
-- ============================================

CREATE TYPE restaurant_status_enum AS ENUM ('active', 'inactive', 'trial', 'suspended');
CREATE TYPE subscription_status_enum AS ENUM ('trial', 'active', 'expired', 'cancelled');

CREATE TABLE restaurant (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "restaurantCode" VARCHAR NOT NULL UNIQUE,
  name VARCHAR NOT NULL,
  description TEXT,
  "logoUrl" VARCHAR,
  "bannerUrl" VARCHAR,
  
  -- Address (JSONB)
  address JSONB,
  
  -- Contact (JSONB)
  contact JSONB,
  
  -- Coordinates (JSONB)
  coordinates JSONB,
  
  -- Business Hours (JSONB)
  "businessHours" JSONB,
  
  -- Rating
  rating DECIMAL(2,1) NOT NULL DEFAULT 0,
  "totalRatings" INTEGER NOT NULL DEFAULT 0,
  
  -- Status
  status restaurant_status_enum NOT NULL DEFAULT 'trial',
  "subscriptionStatus" subscription_status_enum NOT NULL DEFAULT 'trial',
  "subscriptionExpiresAt" TIMESTAMP,
  
  -- Kaha Integration Fields
  "externalId" VARCHAR UNIQUE,
  source VARCHAR,
  metadata JSONB,
  
  -- Relations
  "ownerId" UUID NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW(),
  "deletedAt" TIMESTAMP
);

-- Indexes for Restaurant table
CREATE INDEX idx_restaurant_code ON restaurant("restaurantCode");
CREATE INDEX idx_restaurant_external_id ON restaurant("externalId");
CREATE INDEX idx_restaurant_owner_id ON restaurant("ownerId");
CREATE INDEX idx_restaurant_status ON restaurant(status);

-- ============================================
-- 3. UPDATE EXISTING TABLES (if needed)
-- ============================================

-- If menu table exists, add restaurant foreign key
-- ALTER TABLE menu ADD COLUMN "restaurantId" UUID REFERENCES restaurant(id) ON DELETE CASCADE;
-- CREATE INDEX idx_menu_restaurant_id ON menu("restaurantId");

-- If category table exists, add restaurant foreign key
-- ALTER TABLE category ADD COLUMN "restaurantId" UUID REFERENCES restaurant(id) ON DELETE CASCADE;
-- CREATE INDEX idx_category_restaurant_id ON category("restaurantId");

-- ============================================
-- 4. SEED DATA (Optional)
-- ============================================

-- Create a default admin user (optional)
-- INSERT INTO "user" (phone, "firstName", "lastName", email, "userType", "isActive", "isPhoneVerified", "isEmailVerified")
-- VALUES ('9999999999', 'Admin', 'User', 'admin@restaurant.com', 'admin', true, true, true);

-- ============================================
-- 5. COMMENTS
-- ============================================

COMMENT ON TABLE "user" IS 'User table with Kaha integration support';
COMMENT ON COLUMN "user"."externalId" IS 'Kaha user ID for synced users';
COMMENT ON COLUMN "user".source IS 'Data source: kaha or local';
COMMENT ON COLUMN "user"."serviceAccountName" IS 'Name for service account users';

COMMENT ON TABLE restaurant IS 'Restaurant business table with Kaha integration support';
COMMENT ON COLUMN restaurant."externalId" IS 'Kaha business ID for synced restaurants';
COMMENT ON COLUMN restaurant.source IS 'Data source: kaha or local';
COMMENT ON COLUMN restaurant."restaurantCode" IS 'Unique restaurant code for identification';

-- ============================================
-- ROLLBACK SCRIPT (if needed)
-- ============================================

-- DROP TABLE IF EXISTS restaurant CASCADE;
-- DROP TABLE IF EXISTS "user" CASCADE;
-- DROP TYPE IF EXISTS restaurant_status_enum;
-- DROP TYPE IF EXISTS subscription_status_enum;
-- DROP TYPE IF EXISTS user_type_enum;
-- DROP TYPE IF EXISTS auth_provider_enum;
