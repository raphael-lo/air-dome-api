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
exports.updateUserStatus = exports.updateUser = exports.getUsers = exports.login = exports.createUser = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const databaseService_1 = __importDefault(require("../services/databaseService"));
const createUser = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { username, password, role } = req.body;
    if (!username || !password) {
        return res.status(400).json({ message: 'Username and password are required' });
    }
    if (!['Admin', 'Operator', 'Viewer'].includes(role)) {
        return res.status(400).json({ message: 'Invalid role' });
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
    console.log('Login attempt for username:', username);
    if (!username || !password) {
        return res.status(400).json({ message: 'Username and password are required' });
    }
    databaseService_1.default.get('SELECT * FROM users WHERE username = ?', [username], (err, row) => __awaiter(void 0, void 0, void 0, function* () {
        if (err) {
            console.error('Database error during login:', err.message);
            return res.status(500).json({ message: 'Error logging in', error: err.message });
        }
        if (!row) {
            console.log('User not found:', username);
            return res.status(401).json({ message: 'Invalid credentials' });
        }
        console.log('User found. Stored password hash:', row.password);
        console.log('Password received from request:', password);
        const isPasswordValid = yield bcryptjs_1.default.compare(password, row.password);
        console.log('Bcrypt comparison result (isPasswordValid):', isPasswordValid);
        if (!isPasswordValid) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }
        const token = jsonwebtoken_1.default.sign({ id: row.id, username: row.username, role: row.role, status: row.status }, process.env.JWT_SECRET || 'your_jwt_secret');
        res.json({ message: 'Logged in successfully', token });
    }));
};
exports.login = login;
const getUsers = (req, res) => {
    databaseService_1.default.all('SELECT id, username, role, status, created_at FROM users', [], (err, rows) => {
        if (err) {
            return res.status(500).json({ message: 'Error fetching users', error: err.message });
        }
        res.json(rows);
    });
};
exports.getUsers = getUsers;
const updateUser = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    const { username, password, role } = req.body;
    // @ts-ignore
    console.log('req.user:', req.user);
    console.log(`Updating user ${id} with:`, { username, password, role });
    if (!username && !password && !role) {
        return res.status(400).json({ message: 'No fields to update' });
    }
    let updateQuery = 'UPDATE users SET ';
    const params = [];
    if (username) {
        updateQuery += 'username = ?, ';
        params.push(username);
    }
    if (password) {
        const hashedPassword = yield bcryptjs_1.default.hash(password, 10);
        updateQuery += 'password = ?, ';
        params.push(hashedPassword);
    }
    if (role) {
        if (!['Admin', 'Operator', 'Viewer'].includes(role)) {
            return res.status(400).json({ message: 'Invalid role' });
        }
        updateQuery += 'role = ?, ';
        params.push(role);
    }
    updateQuery = updateQuery.slice(0, -2); // Remove trailing comma and space
    updateQuery += ' WHERE id = ?';
    params.push(id);
    console.log('Executing query:', updateQuery, params);
    databaseService_1.default.run(updateQuery, params, function (err) {
        if (err) {
            console.error('Error updating user:', err.message);
            return res.status(500).json({ message: 'Error updating user', error: err.message });
        }
        if (this.changes === 0) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.json({ message: 'User updated successfully' });
    });
});
exports.updateUser = updateUser;
const updateUserStatus = (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    if (!status || !['active', 'disabled'].includes(status)) {
        return res.status(400).json({ message: 'Invalid status' });
    }
    databaseService_1.default.run('UPDATE users SET status = ? WHERE id = ?', [status, id], function (err) {
        if (err) {
            return res.status(500).json({ message: 'Error updating user status', error: err.message });
        }
        if (this.changes === 0) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.json({ message: 'User status updated successfully' });
    });
};
exports.updateUserStatus = updateUserStatus;
