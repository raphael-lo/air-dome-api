"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateAlertThreshold = exports.getAlertThresholds = void 0;
const databaseService_1 = __importDefault(require("../services/databaseService"));
const getAlertThresholds = (req, res) => {
    const { siteId } = req.params;
    databaseService_1.default.all('SELECT * FROM alert_thresholds WHERE siteId = ?', [siteId], (err, rows) => {
        if (err) {
            res.status(500).json({ message: 'Error getting alert thresholds', error: err.message });
        }
        else {
            res.json(rows);
        }
    });
};
exports.getAlertThresholds = getAlertThresholds;
const updateAlertThreshold = (req, res) => {
    const { siteId, metricName } = req.params;
    const { minWarning, maxWarning, minAlert, maxAlert } = req.body;
    databaseService_1.default.run(`INSERT INTO alert_thresholds (id, siteId, metricName, minWarning, maxWarning, minAlert, maxAlert)
     VALUES (?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(metricName) DO UPDATE SET
     minWarning = excluded.minWarning,
     maxWarning = excluded.maxWarning,
     minAlert = excluded.minAlert,
     maxAlert = excluded.maxAlert
    `, [`${siteId}-${metricName}`, siteId, metricName, minWarning, maxWarning, minAlert, maxAlert], function (err) {
        if (err) {
            res.status(500).json({ message: 'Error updating alert threshold', error: err.message });
        }
        else {
            res.status(200).json({ message: 'Alert threshold updated successfully', changes: this.changes });
        }
    });
};
exports.updateAlertThreshold = updateAlertThreshold;
