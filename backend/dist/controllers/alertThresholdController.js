"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteAlertThreshold = exports.updateAlertThreshold = exports.getAlertThresholds = void 0;
const databaseService_1 = __importDefault(require("../services/databaseService"));
const uuid_1 = require("uuid");
const mqttService_1 = require("../services/mqttService");
const getAlertThresholds = (req, res) => {
    const { siteId } = req.params;
    databaseService_1.default.all(`SELECT at.*, m.mqtt_param, m.display_name
     FROM alert_thresholds at
     JOIN metrics m ON at.metric_id = m.id
     WHERE at.site_id = ?`, [siteId], (err, rows) => {
        if (err) {
            return res.status(500).json({ message: 'Error getting alert thresholds', error: err.message });
        }
        res.json(rows);
    });
};
exports.getAlertThresholds = getAlertThresholds;
const updateAlertThreshold = (req, res) => {
    const { siteId, metricId } = req.params;
    const { id, min_warning, max_warning, min_alert, max_alert } = req.body;
    // The metricId from the URL is a string, convert it to a number
    const metric_id_num = Number(metricId);
    if (id) {
        // If ID is provided, it's an update operation
        databaseService_1.default.run(`UPDATE alert_thresholds SET
       metric_id = ?,
       min_warning = ?,
       max_warning = ?,
       min_alert = ?,
       max_alert = ?
       WHERE id = ? AND site_id = ?
      `, [metric_id_num, min_warning, max_warning, min_alert, max_alert, id, siteId], function (err) {
            if (err) {
                return res.status(500).json({ message: 'Error updating alert threshold', error: err.message });
            }
            else if (this.changes === 0) {
                return res.status(404).json({ message: 'Alert threshold not found or no changes made' });
            }
            else {
                res.status(200).json({ message: 'Alert threshold updated successfully', changes: this.changes });
                mqttService_1.mqttClient.publish('air-dome/config/update', JSON.stringify({ type: 'thresholds' }));
            }
        });
    }
    else {
        // If no ID, it's an insert operation (with ON CONFLICT for metric_id)
        databaseService_1.default.run(`INSERT INTO alert_thresholds (id, site_id, metric_id, min_warning, max_warning, min_alert, max_alert)
       VALUES (?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(metric_id) DO UPDATE SET
       min_warning = excluded.min_warning,
       max_warning = excluded.max_warning,
       min_alert = excluded.min_alert,
       max_alert = excluded.max_alert
      `, [(0, uuid_1.v4)(), siteId, metric_id_num, min_warning, max_warning, min_alert, max_alert], function (err) {
            if (err) {
                return res.status(500).json({ message: 'Error creating alert threshold', error: err.message });
            }
            else {
                res.status(201).json({ message: 'Alert threshold created successfully', changes: this.changes });
                mqttService_1.mqttClient.publish('air-dome/config/update', JSON.stringify({ type: 'thresholds' }));
            }
        });
    }
};
exports.updateAlertThreshold = updateAlertThreshold;
const deleteAlertThreshold = (req, res) => {
    const { siteId, metricId } = req.params;
    databaseService_1.default.run('DELETE FROM alert_thresholds WHERE site_id = ? AND metric_id = ?', [siteId, metricId], function (err) {
        if (err) {
            return res.status(500).json({ message: 'Error deleting alert threshold', error: err.message });
        }
        else if (this.changes === 0) {
            return res.status(404).json({ message: 'Alert threshold not found' });
        }
        else {
            res.status(200).json({ message: 'Alert threshold deleted successfully' });
            mqttService_1.mqttClient.publish('air-dome/config/update', JSON.stringify({ type: 'thresholds' }));
        }
    });
};
exports.deleteAlertThreshold = deleteAlertThreshold;
