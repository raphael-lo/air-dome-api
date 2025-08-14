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
    const { lightsOn, brightness } = req.body;
    databaseService_1.default.run('UPDATE lighting_state SET lightsOn = ?, brightness = ?', [lightsOn, brightness], function (err) {
        if (err) {
            res.status(500).json({ message: 'Error updating lighting state', error: err.message });
        }
        else if (this.changes === 0) {
            // If no row was updated, it means it didn't exist, so insert it
            databaseService_1.default.run('INSERT INTO lighting_state (lightsOn, brightness) VALUES (?, ?)', [lightsOn, brightness], (err) => {
                if (err) {
                    res.status(500).json({ message: 'Error inserting lighting state', error: err.message });
                }
                else {
                    res.json({ lightsOn, brightness });
                }
            });
        }
        else {
            res.json({ lightsOn, brightness });
        }
    });
};
exports.updateLightingState = updateLightingState;
