import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { MenuRepository, MenuVariantRepository, AddonGroupRepository, AddonsRepository } from 'src/repositories';
import { AddonSelectionTypeEnum } from 'common/enums';

@Injectable()
export class DatabaseMigrationService implements OnModuleInit {
  private readonly logger = new Logger(DatabaseMigrationService.name);

  constructor(
    private readonly menuRepository: MenuRepository,
    private readonly menuVariantRepository: MenuVariantRepository,
    private readonly addonGroupRepository: AddonGroupRepository,
    private readonly addonsRepository: AddonsRepository,
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

    } catch (error) {
      this.logger.error('Failed during V1 to V2 data migration', error);
    }
  }
}
