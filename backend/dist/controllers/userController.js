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
exports.login = exports.createUser = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const databaseService_1 = __importDefault(require("../services/databaseService"));
const createUser = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { username, password, role } = req.body;
    if (!username || !password) {
        return res.status(400).json({ message: 'Username and password are required' });
    }
    const hashedPassword = yield bcryptjs_1.default.hash(password, 10);
    databaseService_1.default.run('INSERT INTO users (username, password, role, status) VALUES (?, ?, ?, ?)', [username, hashedPassword, role || 'Operator', 'active'], function (err) {
        if (err) {
            if (err.message.includes('UNIQUE constraint failed')) {
                return res.status(409).json({ message: 'Username already exists' });
            }
            return res.status(500).json({ message: 'Error creating user', error: err.message });
        }
        res.status(201).json({ message: 'User created', userId: this.lastID });
    });
});
exports.createUser = createUser;
const login = (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
        return res.status(400).json({ message: 'Username and password are required' });
    }
    databaseService_1.default.get('SELECT * FROM users WHERE username = ?', [username], (err, row) => __awaiter(void 0, void 0, void 0, function* () {
        if (err) {
            return res.status(500).json({ message: 'Error logging in', error: err.message });
        }
        if (!row) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }
        const isPasswordValid = yield bcryptjs_1.default.compare(password, row.password);
        if (!isPasswordValid) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }
        const token = jsonwebtoken_1.default.sign({ id: row.id, username: row.username, role: row.role, status: row.status }, process.env.JWT_SECRET || 'your_jwt_secret');
        res.json({ message: 'Logged in successfully', token });
    }));
};
exports.login = login;
