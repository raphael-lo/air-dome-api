import { Pool } from 'pg';
import sqlite3 from 'sqlite3';
import dotenv from 'dotenv';
import * as fs from 'fs';

dotenv.config();

// List of tables to migrate, in an order that respects most foreign key constraints.
const TABLES_TO_MIGRATE = [
  'users',
  'metrics',
  'metric_groups',
  'sections',
  'section_items',
  'alerts',
  'fan_sets',
  'lighting_state',
  'alert_thresholds',
];

// --- PostgreSQL Connection ---
const pgPool = new Pool({
  host: process.env.POSTGRES_HOST,
  port: process.env.POSTGRES_PORT ? parseInt(process.env.POSTGRES_PORT, 10) : 5432,
  user: process.env.POSTGRES_USER,
  password: process.env.POSTGRES_PASSWORD,
  database: process.env.POSTGRES_DB,
});

/**
 * Migrates a single table from a SQLite database to PostgreSQL.
 */
async function migrateTable(sqliteDb: sqlite3.Database, pgClient: any, tableName: string) {
  console.log(`  Migrating table: ${tableName}...`);

  const rows = await new Promise<any[]>((resolve, reject) => {
    sqliteDb.all(`SELECT * FROM ${tableName}`, [], (err, rows) => {
      if (err) return reject(err);
      resolve(rows);
    });
  });

  if (rows.length === 0) {
    console.log(`    -> No rows to migrate for ${tableName}.`);
    return;
  }

  const client = await pgClient.connect();
  try {
    for (const row of rows) {
      const columns = Object.keys(row).join(', ');
      const values = Object.values(row);
      const placeholders = values.map((_, i) => `$${i + 1}`).join(', ');
      const query = `INSERT INTO ${tableName} (${columns}) VALUES (${placeholders}) ON CONFLICT DO NOTHING`;
      await client.query(query, values);
    }
    console.log(`    -> Successfully migrated ${rows.length} rows to ${tableName}.`);
  } finally {
    client.release();
  }
}

/**
 * Main function to run the migration for a given SQLite database file.
 */
async function runMigration(sqliteDbPath: string) {
  console.log(`
Starting migration for database: ${sqliteDbPath}`);

  const sqliteDb = new sqlite3.Database(sqliteDbPath, sqlite3.OPEN_READONLY, (err) => {
    if (err) {
      console.error(`Error opening SQLite database at ${sqliteDbPath}:`, err.message);
      process.exit(1);
    }
  });

  try {
    for (const table of TABLES_TO_MIGRATE) {
      await migrateTable(sqliteDb, pgPool, table);
    }
    console.log(`
✅ Migration completed for ${sqliteDbPath}.`);
  } catch (err: any) {
    console.error(`
❌ An error occurred during the migration for ${sqliteDbPath}:`, err.message);
  } finally {
    sqliteDb.close();
  }
}

/**
 * Orchestrates the entire migration process.
 */
async function main() {
  console.log('--- Database Migration Script ---');

  // --- IMPORTANT ---
  // Adjust the paths to your old SQLite database files here.
  const airDomeDbPath = './db_backup/air_dome.db';
  const escDbPath = './db_backup/esc.db';

  if (fs.existsSync(airDomeDbPath)) {
    await runMigration(airDomeDbPath);
  } else {
    console.log(`
Skipping migration for Air Dome: database file not found at ${airDomeDbPath}`);
  }

  if (fs.existsSync(escDbPath)) {
    await runMigration(escDbPath);
  } else {
    console.log(`
Skipping migration for ESC: database file not found at ${escDbPath}`);
  }

  await pgPool.end();
  console.log('\n--- Migration script finished. ---');
}

main();