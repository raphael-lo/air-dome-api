"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const sqlite3_1 = __importDefault(require("sqlite3"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const DB_FILE = path_1.default.resolve(__dirname, 'air_dome.db');
const INIT_SQL_FILE = path_1.default.resolve(__dirname, './src/config/init.sql');
const db = new sqlite3_1.default.Database(DB_FILE, (err) => {
    if (err) {
        console.error('Error opening database', err.message);
    }
});
const createTables = () => __awaiter(void 0, void 0, void 0, function* () {
    const initSql = fs_1.default.readFileSync(INIT_SQL_FILE, 'utf-8');
    db.exec(initSql, function (err) {
        if (err) {
            console.error('Error initializing database:', err.message);
        }
        else {
            console.log('Tables created successfully');
            // Add a check to see if tables exist after creation
            db.all("SELECT name FROM sqlite_master WHERE type='table';", (err, tables) => {
                if (err) {
                    console.error('Error checking tables:', err.message);
                }
                else {
                    console.log('Tables found after init:', tables);
                }
            });
        }
        db.close();
    });
});
createTables();
