import { AppDataSource } from '../data-source';

async function test() {
  await AppDataSource.initialize();
  console.log('Entities loaded by TypeORM:');
  AppDataSource.entityMetadatas.forEach(meta => {
    console.log(`- ${meta.name} (table: ${meta.tableName})`);
  });
  await AppDataSource.destroy();
}

test().catch(console.error);
