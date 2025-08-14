"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.postSensorData = void 0;
const mqttService_1 = __importDefault(require("../services/mqttService"));
const postSensorData = (req, res) => {
    const data = req.body;
    const topic = process.env.MQTT_TOPIC || 'air-dome/sensors';
    // Basic validation
    if (!data || typeof data !== 'object') {
        return res.status(400).json({ message: 'Invalid data format' });
    }
    try {
        const message = JSON.stringify(data);
        mqttService_1.default.publish(topic, message, (err) => {
            if (err) {
                console.error('Failed to publish to MQTT', err);
                return res.status(500).json({ message: 'Failed to publish to MQTT' });
            }
            res.status(202).json({ message: 'Data accepted and forwarded to MQTT' });
        });
    }
    catch (error) {
        console.error('Error processing request', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};
exports.postSensorData = postSensorData;
