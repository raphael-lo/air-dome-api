"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mqtt_1 = __importDefault(require("mqtt"));
const influxdbService_1 = require("./influxdbService");
const websocketService_1 = require("./websocketService");
const MQTT_BROKER_URL = process.env.MQTT_BROKER_URL;
if (!MQTT_BROKER_URL) {
    throw new Error('MQTT_BROKER_URL environment variable is not set.');
}
const MQTT_TOPIC = process.env.MQTT_TOPIC || 'air-dome/sensors';
const client = mqtt_1.default.connect(MQTT_BROKER_URL);
client.on('connect', () => {
    console.log('Connected to MQTT broker');
    client.subscribe(MQTT_TOPIC, (err) => {
        if (!err) {
            console.log(`Subscribed to topic: ${MQTT_TOPIC}`);
        }
        else {
            console.error(`Failed to subscribe to topic ${MQTT_TOPIC}:`, err);
        }
    });
});
client.on('message', (topic, message) => {
    try {
        const data = JSON.parse(message.toString());
        console.log('MQTT message parsed:', data); // Log parsed data
        try {
            (0, influxdbService_1.writeSensorData)(data);
            console.log('Data written to InfluxDB.'); // Log successful write
        }
        catch (writeError) {
            console.error('Error writing data to InfluxDB:', writeError); // Log write errors
        }
        try {
            (0, websocketService_1.broadcast)(data);
            console.log('Data broadcasted via WebSocket.'); // Log successful broadcast
        }
        catch (broadcastError) {
            console.error('Error broadcasting data via WebSocket:', broadcastError); // Log broadcast errors
        }
    }
    catch (parseError) {
        console.error('Error parsing MQTT message:', parseError);
    }
});
client.on('error', (error) => {
    console.error('MQTT client error:', error);
});
exports.default = client;
