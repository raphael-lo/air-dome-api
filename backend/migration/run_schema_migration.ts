import db from '../src/services/databaseService';
import fs from 'fs';
import path from 'path';

const migrate = async () => {
  const client = await db.getClient();
  try {
    console.log('Starting schema migration...');
    const migrationFilePath = path.join(__dirname, '../../migration/add_esc_support.sql');
    const migrationSql = fs.readFileSync(migrationFilePath, 'utf8');

    await client.query(migrationSql);

    console.log('Schema migration successful.');
  } catch (e) {
    console.error('Schema migration failed:', e);
    // No rollback needed for DDL changes in PostgreSQL in this manner
  } finally {
    client.release();
  }
};

migrate();
