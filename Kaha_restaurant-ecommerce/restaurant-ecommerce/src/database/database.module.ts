// ==================== SECTION 1: PURPOSE - Import Required Dependencies ====================
// PURPOSE: Import NestJS and TypeORM modules needed for database configuration
// INPUT: 
//   - @nestjs/common: NestJS core Module decorator
//   - @nestjs/typeorm: TypeORM integration for NestJS
//   - env configuration: Database credentials from environment variables
// ACTIONS: Load Module decorator, TypeOrmModule, and env configuration
// CHECKS: All dependencies successfully imported
// OUTPUT: Modules and configuration available for database setup
import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { env } from "src/configuration/env";

// ==================== SECTION 2: PURPOSE - Define Database Module with NestJS @Module Decorator ====================
// PURPOSE: Configure and register TypeORM database connection for the entire application
// INPUT: Module metadata with TypeOrmModule configuration
// ACTIONS: Register TypeOrmModule as an import with async configuration factory
// CHECKS: Module decorator properly applied, imports array contains TypeOrmModule
// OUTPUT: DatabaseModule configured and ready to be imported in AppModule
@Module({
  // ==================== SECTION 3: PURPOSE - Import and Configure TypeORM Asynchronously ====================
  // PURPOSE: Set up PostgreSQL database connection using async factory pattern
  // INPUT: Database credentials from env (host, port, database, username, password)
  // ACTIONS: 
  //   1. Use forRootAsync() to configure TypeORM with async factory function
  //   2. Create database configuration object in useFactory function
  //   3. Specify connection type, host, port, and authentication details
  //   4. Configure entities pattern to auto-discover entity files
  //   5. Enable schema synchronization and migrations
  // CHECKS:
  //   - Database credentials from env properly injected
  //   - Connection type set to "postgres"
  //   - Entities path pattern matches compiled output location
  //   - Migrations table name and directory properly configured
  // OUTPUT: TypeORM configured to connect to PostgreSQL database on startup
  imports: [
    TypeOrmModule.forRootAsync({
      // ==================== SECTION 4: PURPOSE - Create Database Configuration Factory ====================
      // PURPOSE: Build database connection configuration object dynamically
      // INPUT: Environment variables from env object (database credentials)
      // ACTIONS:
      //   1. Create configuration object with connection details
      //   2. Specify PostgreSQL as database type
      //   3. Inject host, port, database name, username, password from env
      //   4. Configure entity discovery pattern: "dist/**/*.entity.{ts,js}"
      //   5. Enable synchronize for schema auto-creation (⚠️ Not for production)
      //   6. Set up migrations: table name, directory, auto-run on startup
      // CHECKS:
      //   - All env variables present and valid
      //   - Entities pattern will find all .entity.ts files in dist folder
      //   - Migrations directory correctly points to src/migrations
      //   - Connection parameters correctly typed
      // OUTPUT: Database configuration object ready for TypeORM connection
      useFactory: (): any => {
        return {
          // Connection Type: PostgreSQL
          type: "postgres",
          
          // Database Server Connection Details (from env)
          host: env.database.host,                    // ← From DB_HOST env var
          port: env.database.port,                    // ← From DB_PORT env var
          database: env.database.name,                // ← From DB_NAME env var
          username: env.database.username,            // ← From DB_USER_NAME env var
          password: env.database.password,            // ← From DB_PASSWORD env var
          
          // Entity Configuration: Auto-discover all entity files in dist folder
          entities: ["dist/**/*.entity.{ts,js}"],     // ← Finds compiled entities
          
          // Schema Synchronization: Enabled for development/testing auto-creation
          synchronize: true,
          
          // Migrations Configuration
          migrationsTableName: "migrations",          // ← Table to track executed migrations
          migrations: ["dist/migration/*.js"],        // ← Path to compiled migration files
          migrationsRun: true,                        // ← Auto-run migrations on startup
          
          // CLI Configuration: Where TypeORM CLI looks for new migrations
          cli: {
            migrationsDir: "src/migrations",          // ← TypeORM CLI will create files here
          },
        };
      },
    }),
  ],
})

// ==================== SECTION 5: PURPOSE - Export DatabaseModule for Application Use ====================
// PURPOSE: Export configured DatabaseModule so AppModule can import and use it
// INPUT: DatabaseModule class with @Module decorator and TypeORM configuration
// ACTIONS: Export DatabaseModule class for import in app.module.ts
// CHECKS: Class properly defined and decorated with @Module
// OUTPUT: DatabaseModule available for injection throughout application
export class DatabaseModule {}
