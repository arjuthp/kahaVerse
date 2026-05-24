import { DataSource } from 'typeorm';

/**
 * Database Helper for E2E Tests
 * Manages test database setup and cleanup
 */

export class DatabaseHelper {
  /**
   * Clean all tables (for test isolation)
   * Uses raw SQL to avoid entity metadata issues
   */
  static async cleanDatabase(dataSource: DataSource): Promise<void> {
    try {
      // Disable foreign key checks
      await dataSource.query('SET session_replication_role = replica;');

      // Get all table names from the database
      const tables = await dataSource.query(`
        SELECT tablename 
        FROM pg_tables 
        WHERE schemaname = 'public'
        AND tablename != 'migrations'
      `);

      // Truncate all tables
      for (const { tablename } of tables) {
        await dataSource.query(`TRUNCATE TABLE "${tablename}" CASCADE;`);
      }

      // Re-enable foreign key checks
      await dataSource.query('SET session_replication_role = DEFAULT;');
    } catch (error) {
      console.error('Error cleaning database:', error);
      throw error;
    }
  }

  /**
   * Seed minimal test data using raw SQL with proper UUIDs
   * Returns the created IDs for use in tests
   */
  static async seedTestData(dataSource: DataSource): Promise<{
    categoryIds: string[];
    menuIds: string[];
  }> {
    try {
      // Use timestamp to make names unique across test runs
      const timestamp = Date.now();
      
      // Seed categories - let database generate UUIDs
      const categories = await dataSource.query(`
        INSERT INTO "category" (name, description, "businessId", "isActive", position, "createdAt", "updatedAt")
        VALUES 
          ('E2E Test Category ${timestamp}', 'Category for E2E testing', 'biz-e2e-001', true, 1, NOW(), NOW()),
          ('E2E Burgers ${timestamp}', 'Burger category', 'biz-e2e-001', true, 2, NOW(), NOW())
        RETURNING id;
      `);

      const categoryIds = categories.map((c: any) => c.id);

      // Seed menus - MenuEntity table name defaults to "menu_entity"
      const menus = await dataSource.query(`
        INSERT INTO "menu_entity" (name, description, "businessId", "categoryId", price, "isAvailable", "allowAddOns", "createdAt", "updatedAt")
        VALUES 
          ('E2E Test Burger ${timestamp}', 'Test burger for E2E', 'biz-e2e-001', $1, 15.99, true, true, NOW(), NOW())
        RETURNING id;
      `, [categoryIds[1]]);

      const menuIds = menus.map((m: any) => m.id);

      return { categoryIds, menuIds };
    } catch (error) {
      console.error('Error seeding test data:', error);
      throw error;
    }
  }

  /**
   * Reset database to clean state
   * Returns seeded data IDs
   */
  static async resetDatabase(dataSource: DataSource): Promise<{
    categoryIds: string[];
    menuIds: string[];
  }> {
    await this.cleanDatabase(dataSource);
    return await this.seedTestData(dataSource);
  }
}
