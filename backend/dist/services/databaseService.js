"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.initializeDatabase = void 0;
const sqlite3_1 = __importDefault(require("sqlite3"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const DB_FILE = path_1.default.resolve(__dirname, '../../air_dome.db');
const INIT_SQL_FILE = path_1.default.resolve(__dirname, '../config/init.sql');
const db = new sqlite3_1.default.Database(DB_FILE, (err) => {
    if (err) {
        console.error('Error opening database', err.message);
    }
});
const initializeDatabase = () => {
    const initSql = fs_1.default.readFileSync(INIT_SQL_FILE, 'utf-8');
    db.exec(initSql, (err) => {
        if (err) {
            console.error('Error initializing database', err.message);
        }
    });
};
exports.initializeDatabase = initializeDatabase;
exports.default = db;
