import sqlite3 from 'sqlite3';
import path from 'path';
import fs from 'fs';

// Use environment variable for DB file path
const DB_FILE = process.env.DATABASE_URL;

if (!DB_FILE) {
  console.error('DATABASE_URL environment variable is not set. Cannot connect to database.');
  process.exit(1);
}

// Ensure the directory for the DB file exists
const dbDir = path.dirname(DB_FILE);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const db = new sqlite3.Database(DB_FILE, (err) => {
  if (err) {
    console.error('Error opening database', err.message);
  } else {
    console.log(`Connected to the SQLite database at ${DB_FILE}`);
  }
});

export const initializeDatabase = () => {
  const initSql = fs.readFileSync(path.resolve(__dirname, '../config/init.sql'), 'utf-8');
  db.exec(initSql, (err) => {
    if (err) {
      console.error('Error initializing database', err.message);
    }
  });
};

export default db;
