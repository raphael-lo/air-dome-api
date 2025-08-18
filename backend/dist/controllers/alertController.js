"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.acknowledgeAlert = exports.getAlerts = void 0;
const databaseService_1 = __importDefault(require("../services/databaseService"));
const getAlerts = (req, res) => {
    const { site_id } = req.query;
    let query = 'SELECT * FROM alerts';
    const params = [];
    if (site_id) {
        query += ' WHERE site_id = ?';
        params.push(site_id);
    }
    databaseService_1.default.all(query, params, (err, rows) => {
        if (err) {
            res.status(500).json({ message: 'Error fetching alerts', error: err.message });
        }
        else {
            res.json(rows);
        }
    });
};
exports.getAlerts = getAlerts;
const acknowledgeAlert = (req, res) => {
    const { alertId } = req.params;
    databaseService_1.default.run('UPDATE alerts SET status = ? WHERE id = ?', ['acknowledged', alertId], function (err) {
        if (err) {
            res.status(500).json({ message: 'Error acknowledging alert', error: err.message });
        }
        else if (this.changes === 0) {
            res.status(404).json({ message: 'Alert not found' });
        }
        else {
            res.json({ message: 'Alert acknowledged successfully' });
        }
    });
};
exports.acknowledgeAlert = acknowledgeAlert;
