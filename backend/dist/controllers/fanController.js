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
    if (status === undefined && mode === undefined && inflow === undefined && outflow === undefined) {
        return res.status(400).json({ message: 'No fields to update' });
    }
    let updateQuery = 'UPDATE fan_sets SET ';
    const params = [];
    if (status !== undefined) {
        updateQuery += 'status = ?, ';
        params.push(status);
    }
    if (mode !== undefined) {
        updateQuery += 'mode = ?, ';
        params.push(mode);
    }
    if (inflow !== undefined) {
        updateQuery += 'inflow = ?, ';
        params.push(inflow);
    }
    if (outflow !== undefined) {
        updateQuery += 'outflow = ?, ';
        params.push(outflow);
    }
    updateQuery = updateQuery.slice(0, -2); // Remove trailing comma and space
    updateQuery += ' WHERE id = ?';
    params.push(id);
    databaseService_1.default.run(updateQuery, params, function (err) {
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
