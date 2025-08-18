"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.mqttClient = void 0;
const mqtt_1 = __importDefault(require("mqtt"));
const influxdbService_1 = require("./influxdbService");
const websocketService_1 = require("./websocketService");
const databaseService_1 = __importDefault(require("./databaseService"));
const uuid_1 = require("uuid");
const types_1 = require("../types");
// --- In-memory state for alerting ---
let metrics = [];
let alertThresholds = [];
let metricStates = {}; // Key: composite key `device_param/mqtt_param`
const severityOrder = {
    [types_1.StatusLevel.Ok]: 0,
    [types_1.StatusLevel.Warn]: 1,
    [types_1.StatusLevel.Danger]: 2,
};
// --- Helper Functions ---
const getStatusForMetric = (value, threshold) => {
    if (!threshold)
        return types_1.StatusLevel.Ok;
    const { min_warning, max_warning, min_alert, max_alert } = threshold;
    if (min_alert !== null && value <= min_alert)
        return types_1.StatusLevel.Danger;
    if (max_alert !== null && value >= max_alert)
        return types_1.StatusLevel.Danger;
    if (min_warning !== null && value <= min_warning)
        return types_1.StatusLevel.Warn;
    if (max_warning !== null && value >= max_warning)
        return types_1.StatusLevel.Warn;
    return types_1.StatusLevel.Ok;
};
const createAlert = (metric, severity) => {
    const newAlert = {
        id: (0, uuid_1.v4)(),
        site_id: '1', // Assuming a single site for now
        parameter: metric.display_name,
        message: `${metric.display_name} (${metric.device_id}) has exceeded the ${severity} threshold.`,
        severity,
        timestamp: new Date().toISOString(),
        status: 'active',
    };
    databaseService_1.default.run('INSERT INTO alerts (id, site_id, parameter, message, severity, timestamp, status) VALUES (?, ?, ?, ?, ?, ?, ?)', [newAlert.id, newAlert.site_id, newAlert.parameter, newAlert.message, newAlert.severity, newAlert.timestamp, newAlert.status], (err) => {
        if (err) {
            console.error('Error creating alert in database:', err);
        }
        else {
            console.log(`New alert created for ${metric.display_name} with severity ${severity}`);
            console.log(`[MQTT Service] Broadcasting new alert:`, newAlert);
            (0, websocketService_1.broadcast)({ type: 'new_alert', payload: newAlert });
        }
    });
};
const processMetric = (device_param, mqtt_param, value, timestamp) => {
    console.log(`[ProcessMetric] Received: ${device_param}/${mqtt_param} = ${value}`);
    if (typeof value !== 'number')
        return;
    (0, influxdbService_1.writeMetric)('sensor_data', mqtt_param, value, { device_id: device_param });
    const metric = metrics.find(m => m.device_param === device_param && m.mqtt_param === mqtt_param);
    if (!metric) {
        console.warn(`[ProcessMetric] No metric found for device_param: ${device_param}, mqtt_param: ${mqtt_param}`);
        return;
    }
    console.log(`[ProcessMetric] Found metric:`, metric);
    const threshold = alertThresholds.find(t => t.metric_id === metric.id);
    const newStatus = getStatusForMetric(value, threshold);
    console.log(`[ProcessMetric] Value: ${value}, Threshold: ${JSON.stringify(threshold)}, New Status: ${newStatus}`);
    (0, websocketService_1.broadcast)({ [mqtt_param]: { value, status: newStatus, device_id: metric.device_id }, timestamp });
    if (threshold) {
        const stateKey = `${device_param}/${mqtt_param}`;
        const currentStatus = metricStates[stateKey] || types_1.StatusLevel.Ok;
        console.log(`[ProcessMetric] State Key: ${stateKey}, Current Status: ${currentStatus}, New Status: ${newStatus}`);
        if (severityOrder[newStatus] > severityOrder[currentStatus]) {
            console.log(`[ProcessMetric] Status changed for the worse! Creating alert...`);
            createAlert(metric, newStatus);
        }
        metricStates[stateKey] = newStatus;
    }
};
const initializeAlerting = () => {
    console.log('Initializing alerting service...');
    return new Promise((resolve, reject) => {
        databaseService_1.default.all('SELECT * FROM metrics', [], (err, fetchedMetrics) => {
            if (err) {
                console.error('Failed to fetch metrics for alerting:', err);
                return reject(err);
            }
            metrics = fetchedMetrics;
            metricStates = {}; // Reset states
            metrics.forEach(m => {
                const stateKey = `${m.device_param}/${m.mqtt_param}`;
                metricStates[stateKey] = types_1.StatusLevel.Ok;
            });
            console.log(`Initialized states for ${metrics.length} metrics.`);
            databaseService_1.default.all('SELECT * FROM alert_thresholds', [], (err, fetchedThresholds) => {
                if (err) {
                    console.error('Failed to fetch alert thresholds:', err);
                    return reject(err);
                }
                alertThresholds = fetchedThresholds;
                console.log(`Cached ${alertThresholds.length} alert thresholds.`);
                resolve();
            });
        });
    });
};
// --- MQTT Client Setup ---
const MQTT_BROKER_URL = process.env.MQTT_BROKER_URL;
if (!MQTT_BROKER_URL) {
    throw new Error('MQTT_BROKER_URL environment variable is not set.');
}
const MQTT_DATA_TOPIC_PREFIX = process.env.MQTT_DATA_TOPIC_PREFIX || 'air-dome/data';
const MQTT_CONFIG_UPDATE_TOPIC = process.env.MQTT_CONFIG_UPDATE_TOPIC || 'air-dome/config/update';
exports.mqttClient = mqtt_1.default.connect(MQTT_BROKER_URL);
exports.mqttClient.on('connect', () => __awaiter(void 0, void 0, void 0, function* () {
    console.log('Connected to MQTT broker');
    try {
        yield initializeAlerting();
        const dataTopic = `${MQTT_DATA_TOPIC_PREFIX}/#`;
        exports.mqttClient.subscribe(dataTopic, (err) => {
            if (err)
                console.error('Failed to subscribe to data topic:', err);
            else
                console.log(`Subscribed to topic: ${dataTopic}`);
        });
        exports.mqttClient.subscribe(MQTT_CONFIG_UPDATE_TOPIC, (err) => {
            if (err)
                console.error('Failed to subscribe to config update topic:', err);
            else
                console.log(`Subscribed to topic: ${MQTT_CONFIG_UPDATE_TOPIC}`);
        });
        exports.mqttClient.on('message', (topic, message) => {
            try {
                if (topic === MQTT_CONFIG_UPDATE_TOPIC) {
                    console.log('Received config update notification. Reloading thresholds...');
                    initializeAlerting();
                    return;
                }
                if (topic.startsWith(MQTT_DATA_TOPIC_PREFIX)) {
                    const topicParts = topic.substring(MQTT_DATA_TOPIC_PREFIX.length + 1).split('/');
                    if (topicParts.length < 2)
                        return; // Ignore invalid topics
                    const device_param = topicParts[0];
                    const mqtt_param = topicParts[1];
                    const data = JSON.parse(message.toString());
                    const value = data.value;
                    const timestamp = data.timestamp || new Date().toISOString();
                    processMetric(device_param, mqtt_param, value, timestamp);
                }
            }
            catch (parseError) {
                console.error("Error processing MQTT message:", parseError);
            }
        });
    }
    catch (error) {
        console.error('Failed to initialize alerting service:', error);
    }
}));
exports.mqttClient.on('error', (error) => {
    console.error('MQTT client error:', error);
});
