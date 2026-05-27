// ==================== SECTION 1: PURPOSE - Import Dotenv Configuration ====================
// PURPOSE: Load environment variables from .env file into process.env
// INPUT: .env file in project root directory
// ACTIONS: Parse .env file and populate process.env with all variables
// CHECKS: All environment variables loaded from .env file
// OUTPUT: process.env object now contains all configured variables (DB_HOST, APP_PORT, etc.)
import "dotenv/config";
import { Env } from "./interface/env.interface";

// ==================== SECTION 2: PURPOSE - Build Typed Configuration Object ====================
// PURPOSE: Create a typed configuration object that maps raw environment variables to structured config
// INPUT: process.env variables (strings from .env file)
// ACTIONS: 
//   1. Extract environment variables from process.env
//   2. Parse/transform values (e.g., parseInt for port numbers)
//   3. Organize into logical sections (app, database, jwt, etc.)
// CHECKS: All required env vars present, values properly typed and formatted
// OUTPUT: config object with typed structure matching Env interface
const config: Env = {
  // ✅ Application Configuration
  app: {
    env: process.env.ENV,
    port: parseInt(process.env.APP_PORT, 10),
    kaha_api_base_link: process.env.KAHA_API_LINK,
  },
  // ✅ Database Configuration
  database: {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    name: process.env.DB_NAME,
    username: process.env.DB_USER_NAME,
    password: process.env.DB_PASSWORD,
  },
  // ✅ JWT Authentication Secret
  jwt: {
    secret: process.env.JWT_SECRET_TOKEN,
  },
  // ✅ Kaha Main API URL (for compatibility with legacy code)
  kahaMainApiUrl: {
    url: process.env.KAHA_API_LINK,
  },
  // ✅ Kaha Main V3 API Base URL
  // IMPORTANT: This is accessed via ConfigurationService.kahaMainV3BaseURL (typed getter)
  // DO NOT access process.env directly in service files - use ConfigurationService instead
  kahaMainV3BaseURL: {
    url: process.env.KAH_API_V3_BASE_URL,
  },
};

// ==================== SECTION 3: PURPOSE - Freeze Configuration Object ====================
// PURPOSE: Create an immutable configuration object to prevent accidental runtime modifications
// INPUT: config object created above
// ACTIONS: Apply Object.freeze() to prevent any changes to configuration after app startup
// CHECKS: Configuration object properly frozen (non-writable, non-configurable)
// OUTPUT: Frozen env object - read-only configuration throughout application lifetime
export const env = Object.freeze<Env>(config);

// ==================== SECTION 4: PURPOSE - Export Environment Getter Function ====================
// PURPOSE: Provide a function that returns a shallow copy of the environment configuration
// INPUT: Frozen env object
// ACTIONS: Create and return a new object spread from frozen env (creates shallow copy)
// CHECKS: Returns valid configuration object
// OUTPUT: environment() function available for use in ConfigurationModule
// NOTE: Returns copy (via spread operator) but each nested object is still reference to frozen config
export const environment = (): any => ({ ...env });
