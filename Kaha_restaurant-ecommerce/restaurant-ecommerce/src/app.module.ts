import { Module } from "@nestjs/common";

import { AuthModule } from "auth/auth.module";
import { CategoryModule } from "category/category.module";
import { ConfigurationModule } from "configuration/configuration.module";
import { DatabaseModule } from "database/database.module";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
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

@Module({
  imports: [
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
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
