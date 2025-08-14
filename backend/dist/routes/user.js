"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const userController_1 = require("../controllers/userController");
const databaseService_1 = __importDefault(require("../services/databaseService"));
const router = (0, express_1.Router)();
router.post('/users', userController_1.createUser);
router.post('/login', userController_1.login);
router.get('/users', (req, res) => {
    databaseService_1.default.all('SELECT id, username, role, status, createdAt FROM users', (err, rows) => {
        if (err) {
            res.status(500).json({ message: 'Error fetching users', error: err.message });
        }
        else {
            res.json(rows);
        }
    });
});
router.put('/users/:userId/status', (req, res) => {
    const { userId } = req.params;
    const { status } = req.body;
    if (!status || (status !== 'active' && status !== 'disabled')) {
        return res.status(400).json({ message: 'Invalid status provided' });
    }
    databaseService_1.default.run('UPDATE users SET status = ? WHERE id = ?', [status, userId], function (err) {
        if (err) {
            res.status(500).json({ message: 'Error updating user status', error: err.message });
        }
        else if (this.changes === 0) {
            res.status(404).json({ message: 'User not found' });
        }
        else {
            res.json({ message: 'User status updated successfully' });
        }
    });
});
exports.default = router;
