// ==================== SECTION 1: PURPOSE - Import NestJS Module Decorator ====================
// PURPOSE: Import the core Module decorator from NestJS framework
// INPUT: "@nestjs/common" NestJS package containing core decorators and utilities
// ACTIONS: Import Module decorator which defines and configures NestJS modules
// CHECKS: Module decorator successfully imported from NestJS common package
// OUTPUT: Module decorator available for use to define AppModule class
import { Module } from "@nestjs/common";
import { ScheduleModule } from '@nestjs/schedule';

// ==================== SECTION 2: PURPOSE - Import All Feature Modules ====================
// PURPOSE: Import specialized feature modules that handle different business domains
// INPUT: Module paths pointing to feature folder structures (auth, category, menu, cart, order, etc.)
// ACTIONS: Load all feature modules (DatabaseModule, ConfigurationModule, AuthModule, MenuModule, etc.)
// CHECKS: All 13 feature modules imported successfully from their respective paths
// OUTPUT: All feature modules available to be registered in AppModule imports array
import { AuthModule } from "./modules/auth/auth.module";
import { CategoryModule } from "category/category.module";
import { ConfigurationModule } from "configuration/configuration.module";
import { DatabaseModule } from "database/database.module";
import { CartModule } from "cart/cart.module";
import { RepositoryModule } from "src/repositories/repository.module";
import { MenuModule } from "menu/menu.module";
import { AddonsModule } from "addons/addons.module";
import { OrderModule } from "order/order.module";
import { ServiceCommunicationModule } from "serviceCommunication/service-communication.module";
import { MenuRatingModule } from "./modules/menu-rating/menu-rating.module";
import { AddonGroupsModule } from "./modules/addon-groups/addon-groups.module";
import { DatabaseMigrationModule } from "./modules/database-migration/database-migration.module";
import { KahaSyncModule } from "./modules/kaha-sync/kaha-sync.module";
import { AdminModule } from "./modules/admin/admin.module";
import { LoyaltyModule } from "./modules/loyalty/loyalty.module";


// ==================== SECTION 3: PURPOSE - Import Root Controllers and Services ====================
// PURPOSE: Import the application's root controller and service for handling global requests
// INPUT: AppController and AppService files from current directory (./app.controller and ./app.service)
// ACTIONS: Load root-level controller that handles base API routes and root service with business logic
// CHECKS: AppController and AppService imported successfully
// OUTPUT: Root controller and service available for Module registration
import { AppController } from "./app.controller";
import { AppService } from "./app.service";

// ==================== SECTION 4: PURPOSE - Define AppModule Metadata with @Module Decorator ====================
// PURPOSE: Configure and register all application dependencies, controllers, and providers
// INPUT: 
//   - imports: array of 13 feature modules to be registered and available throughout app
//   - controllers: [AppController] - handles incoming HTTP requests
//   - providers: [AppService] - contains business logic and shared services
// ACTIONS: 
//   1. Register all feature modules in dependency injection container
//   2. Declare AppController as handler for incoming requests
//   3. Register AppService as provider with business logic
// CHECKS:
//   - All 13 modules properly imported and registered
//   - AppController available to handle routes
//   - AppService available for business logic
//   - No duplicate imports or conflicting dependencies
// OUTPUT: Complete module configuration ready for NestFactory to initialize
@Module({
  imports: [
    ScheduleModule.forRoot(),
    DatabaseModule,
    ConfigurationModule,
    CategoryModule,
    AuthModule,
    RepositoryModule,
    MenuModule,
    AddonsModule,
    CartModule,
    OrderModule,
    ServiceCommunicationModule,
    MenuRatingModule,
    AddonGroupsModule,
    DatabaseMigrationModule,
    KahaSyncModule,
    AdminModule,
    LoyaltyModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})

// ==================== SECTION 5: PURPOSE - Export AppModule for Application Bootstrap ====================
// PURPOSE: Export the configured AppModule class so NestFactory can initialize the application
// INPUT: AppModule class with all metadata and dependencies configured
// ACTIONS: Export AppModule to be imported in main.ts for NestFactory.create()
// CHECKS: AppModule class properly defined and decorated
// OUTPUT: AppModule available for import in main.ts and application startup
export class AppModule {}
