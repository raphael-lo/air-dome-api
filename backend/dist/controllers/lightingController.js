"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateLightingState = exports.getLightingState = void 0;
const databaseService_1 = __importDefault(require("../services/databaseService"));
const getLightingState = (req, res) => {
    databaseService_1.default.get('SELECT * FROM lighting_state LIMIT 1', (err, row) => {
        if (err) {
            res.status(500).json({ message: 'Error fetching lighting state', error: err.message });
        }
        else if (!row) {
            // Initialize if not found
            const defaultState = { lightsOn: false, brightness: 0 };
            databaseService_1.default.run('INSERT INTO lighting_state (lightsOn, brightness) VALUES (?, ?)', [defaultState.lightsOn, defaultState.brightness], (err) => {
                if (err) {
                    res.status(500).json({ message: 'Error initializing lighting state', error: err.message });
                }
                else {
                    res.json(defaultState);
                }
            });
        }
        else {
            res.json(row);
        }
    });
};
exports.getLightingState = getLightingState;
const updateLightingState = (req, res) => {
    const { lights_on, brightness } = req.body;
    if (lights_on === undefined && brightness === undefined) {
        return res.status(400).json({ message: 'No fields to update' });
    }
    let updateQuery = 'UPDATE lighting_state SET ';
    const params = [];
    if (lights_on !== undefined) {
        updateQuery += 'lights_on = ?, ';
        params.push(lights_on);
    }
    if (brightness !== undefined) {
        updateQuery += 'brightness = ?, ';
        params.push(brightness);
    }
    updateQuery = updateQuery.slice(0, -2); // Remove trailing comma and space
    databaseService_1.default.run(updateQuery, params, function (err) {
        if (err) {
            res.status(500).json({ message: 'Error updating lighting state', error: err.message });
        }
        else {
            databaseService_1.default.get('SELECT * FROM lighting_state LIMIT 1', (err, row) => {
                if (err) {
                    res.status(500).json({ message: 'Error fetching updated lighting state', error: err.message });
                }
                else {
                    res.json(row);
                }
            });
        }
    });
};
exports.updateLightingState = updateLightingState;
