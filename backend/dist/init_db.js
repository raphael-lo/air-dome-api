"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.initializeDatabase = void 0;
const sqlite3_1 = __importDefault(require("sqlite3"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const DB_FILE = process.env.DATABASE_URL;
// The path to init.sql is now relative to this file's location in src/
const INIT_SQL_FILE = path_1.default.resolve(__dirname, './config/init.sql');
const initializeDatabase = () => {
    return new Promise((resolve, reject) => {
        if (!DB_FILE) {
            const err = new Error('DATABASE_URL environment variable is not set. Cannot initialize database.');
            console.error(err.message);
            return reject(err);
        }
        // The running directory is backend/, so this path is correct
        const dbDir = path_1.default.dirname(DB_FILE);
        if (!fs_1.default.existsSync(dbDir)) {
            fs_1.default.mkdirSync(dbDir, { recursive: true });
        }
        const db = new sqlite3_1.default.Database(DB_FILE, (err) => {
            if (err) {
                console.error('Error opening database', err.message);
                return reject(err);
            }
        });
        const initSql = fs_1.default.readFileSync(INIT_SQL_FILE, 'utf-8');
        db.exec(initSql, function (err) {
            if (err) {
                console.error('Error initializing database:', err.message);
                db.close();
                return reject(err);
            }
            else {
                console.log('Database tables created or already exist.');
                db.close();
                return resolve();
            }
        });
    });
};
exports.initializeDatabase = initializeDatabase;
//# sourceMappingURL=init_db.js.map