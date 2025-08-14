"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateFanSet = exports.getFanSets = void 0;
const databaseService_1 = __importDefault(require("../services/databaseService"));
const getFanSets = (req, res) => {
    databaseService_1.default.all('SELECT * FROM fan_sets', (err, rows) => {
        if (err) {
            res.status(500).json({ message: 'Error fetching fan sets', error: err.message });
        }
        else {
            res.json(rows);
        }
    });
};
exports.getFanSets = getFanSets;
const updateFanSet = (req, res) => {
    const { id } = req.params;
    const { status, mode, inflow, outflow } = req.body;
    databaseService_1.default.run('UPDATE fan_sets SET status = ?, mode = ?, inflow = ?, outflow = ? WHERE id = ?', [status, mode, inflow, outflow, id], function (err) {
        if (err) {
            res.status(500).json({ message: 'Error updating fan set', error: err.message });
        }
        else if (this.changes === 0) {
            res.status(404).json({ message: 'Fan set not found' });
        }
        else {
            databaseService_1.default.get('SELECT * FROM fan_sets WHERE id = ?', [id], (err, row) => {
                if (err) {
                    res.status(500).json({ message: 'Error fetching updated fan set', error: err.message });
                }
                else {
                    res.json(row);
                }
            });
        }
    });
};
exports.updateFanSet = updateFanSet;
