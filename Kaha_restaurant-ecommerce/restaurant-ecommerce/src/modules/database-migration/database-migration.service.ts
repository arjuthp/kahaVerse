import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { MenuRepository, MenuVariantRepository, AddonGroupRepository, AddonsRepository } from 'src/repositories';
import { AddonSelectionTypeEnum } from 'common/enums';
import { DataSource } from 'typeorm';

@Injectable()
export class DatabaseMigrationService implements OnModuleInit {
  private readonly logger = new Logger(DatabaseMigrationService.name);

  constructor(
    private readonly menuRepository: MenuRepository,
    private readonly menuVariantRepository: MenuVariantRepository,
    private readonly addonGroupRepository: AddonGroupRepository,
    private readonly addonsRepository: AddonsRepository,
    private readonly dataSource: DataSource,
  ) {}

  async onModuleInit() {
    this.logger.log('Checking for V1 to V2 data migrations...');
    
    try {
      // 1. Create Default Variants for Menus that don't have any
      const menus = await this.menuRepository.find();
      let migratedMenus = 0;

      for (const menu of menus) {
        const variants = await this.menuVariantRepository.find({ where: { menu: { id: menu.id } } });
        
        if (variants.length === 0) {
          await this.menuVariantRepository.save({
            name: 'Standard (Default)',
            price: menu.price || 0,
            isAvailable: true,
            menu: { id: menu.id }
          });
          migratedMenus++;
        }
      }

      if (migratedMenus > 0) {
        this.logger.log(`Successfully generated default V2 Variants for ${migratedMenus} V1 menus.`);
      }

      // 2. Migrate orphaned addons into a default AddonGroup
      // If addons exist without an addonGroupId, we wrap them
      const orphanedAddons = await this.addonsRepository.find({
        where: { addonGroup: null }
      });

      if (orphanedAddons.length > 0) {
        this.logger.log(`Found ${orphanedAddons.length} orphaned V1 addons. Creating a legacy group...`);
        
        // We group them by businessId (assume first addon's business is used or we create a global one)
        // For safety, we just create one Legacy group per orphaned addon if we don't have businessId
        const legacyGroup = await this.addonGroupRepository.save({
          name: 'Legacy Optional Addons',
          businessId: 'legacy-migration',
          isRequired: false,
          minSelect: 0,
          maxSelect: 10,
          selectionType: AddonSelectionTypeEnum.MULTI,
        });

        for (const addon of orphanedAddons) {
          addon.addonGroup = legacyGroup;
          await this.addonsRepository.save(addon);
        }
        
        this.logger.log(`Successfully migrated ${orphanedAddons.length} addons into V2 AddonGroups.`);
      }

      // 3. Backfill discountValue = discountAmount for all existing vouchers
      const cols = await this.dataSource.query(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name='vouchers' AND column_name='discountType'
      `);
      if (cols.length > 0) {
        const checkUnmigrated = await this.dataSource.query(`
          SELECT COUNT(*) as count FROM vouchers WHERE "discountValue" = 0 AND "discountAmount" > 0
        `);
        const count = Number(checkUnmigrated[0]?.count || 0);
        if (count > 0) {
          await this.dataSource.query(`
            UPDATE vouchers 
            SET "discountValue" = "discountAmount" 
            WHERE "discountValue" = 0 AND "discountAmount" > 0
          `);
          this.logger.log('Migration: voucher discountValue backfill complete');
        }
      }

    } catch (error) {
      this.logger.error('Failed during V1 to V2 data migration', error);
    }
  }
}

