import mqtt from 'mqtt';
import crypto from 'node:crypto';
import { writeMetric } from './influxdbService';
import { broadcast } from './websocketService';
import db from './databaseService';
import { v4 as uuidv4 } from 'uuid';
import { StatusLevel, type AlertThreshold, type Metric } from '../types';

// --- In-memory cache for metric rules and stats ---
type MetricRule = Metric & { topic: string };
let metricRules: MetricRule[] = [];
let alertThresholds: AlertThreshold[] = [];
let lastMetricStatus: Record<string, StatusLevel> = {};
let connectedClients = 0;

// Export stats for other modules to access
export const getStats = () => ({
  connectedClients,
});

const severityOrder = {
  [StatusLevel.Ok]: 0,
  [StatusLevel.Warn]: 1,
  [StatusLevel.Danger]: 2,
};

// --- Helper Functions ---

const getStatusForMetric = (value: number, threshold: AlertThreshold | undefined): StatusLevel => {
  if (!threshold) return StatusLevel.Ok;
  const { min_warning, max_warning, min_alert, max_alert } = threshold;
  if (min_alert !== null && value <= min_alert) return StatusLevel.Danger;
  if (max_alert !== null && value >= max_alert) return StatusLevel.Danger;
  if (min_warning !== null && value <= min_warning) return StatusLevel.Warn;
  if (max_warning !== null && value >= max_warning) return StatusLevel.Warn;
  return StatusLevel.Ok;
};

const createAlert = async (metric: Metric, severity: StatusLevel, value: number, unit?: string | null) => {
    const newAlert = {
        id: uuidv4(),
        site_id: '1', // Assuming a single site for now
        parameter_key: metric.display_name,
        message_key: 'alert_threshold_exceeded',
        message_params: {
            metricName: metric.display_name,
            deviceId: metric.device_id,
            severity: severity,
            value: value,
            unit: unit || '',
        },
        severity,
        timestamp: new Date().toISOString(),
        status: 'active',
    };
    try {
        await db.query(
            'INSERT INTO alerts (id, site_id, parameter_key, message_key, message_params, severity, timestamp, status) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)',
            [newAlert.id, newAlert.site_id, newAlert.parameter_key, newAlert.message_key, JSON.stringify(newAlert.message_params), newAlert.severity, newAlert.timestamp, newAlert.status]
        );
        broadcast({ type: 'new_alert', payload: newAlert });
    } catch (err) {
        console.error('Error creating alert in database:', err);
    }
};

// This function is now more generic
const processMetric = (metricRule: MetricRule, value: any, timestamp: string) => {
    if (typeof value !== 'number') return;

    if (!metricRule.device_id) {
        console.error(`Cannot process metric for rule ID ${metricRule.id} because it has no device_id.`);
        return;
    }

    writeMetric('sensor_data', metricRule.mqtt_param, value, { device_id: metricRule.device_id, topic: metricRule.topic });

    const threshold = alertThresholds.find(t => t.metric_id === metricRule.id);
    const status = getStatusForMetric(value, threshold);
    const metricKey = `${metricRule.topic}:${metricRule.device_id}:${metricRule.mqtt_param}`;
    const lastStatus = lastMetricStatus[metricKey] || StatusLevel.Ok;

    if (severityOrder[status] > severityOrder[lastStatus]) {
        createAlert(metricRule, status, value, metricRule.unit);
    }

    lastMetricStatus[metricKey] = status;

    broadcast({
        topic: metricRule.topic,
        device_id: metricRule.device_id,
        mqtt_param: metricRule.mqtt_param,
        value,
        status,
        timestamp
    });
}

const loadMetricRules = async (): Promise<void> => {
  try {
    const { rows } = await db.query('SELECT * FROM metrics', []);
    metricRules = rows as MetricRule[];
    console.log(`Loaded ${metricRules.length} metric rules into memory.`);
  } catch (err) {
    console.error('Failed to fetch metric rules:', err);
    throw err;
  }
};

const loadAlertThresholds = async (): Promise<void> => {
  try {
    const { rows } = await db.query('SELECT * FROM alert_thresholds', []);
    alertThresholds = rows as AlertThreshold[];
    console.log(`Loaded ${alertThresholds.length} alert thresholds into memory.`);
  } catch (err) {
    console.error('Failed to fetch alert thresholds:', err);
    throw err;
  }
};


// --- MQTT Client Setup ---

const MQTT_BROKER_URL = process.env.MQTT_BROKER_URL;
if (!MQTT_BROKER_URL) {
  throw new Error('MQTT_BROKER_URL environment variable is not set.');
}

export const mqttClient = mqtt.connect(MQTT_BROKER_URL, {
    username: process.env.MQTT_USERNAME,
    password: process.env.MQTT_PASSWORD,
    clientId: `air-dome-backend-${crypto.randomBytes(4).toString('hex')}`,
});

mqttClient.on('connect', async () => {
  try {
    await loadMetricRules();
    await loadAlertThresholds();

    mqttClient.subscribe('#', (err) => {
      if (err) console.error('Failed to subscribe to #', err);
      else console.log('Subscribed to all topics (#) to process messages based on loaded rules.');
    });

    const SYS_TOPIC_CLIENTS_CONNECTED = '$SYS/broker/clients/connected';
    mqttClient.subscribe(SYS_TOPIC_CLIENTS_CONNECTED, (err) => {
        if (err) console.error(`Failed to subscribe to ${SYS_TOPIC_CLIENTS_CONNECTED}`)
    });

    const RELOAD_RULES_TOPIC = 'air-dome/config/reload';
    mqttClient.subscribe(RELOAD_RULES_TOPIC, (err) => {
        if (err) console.error(`Failed to subscribe to ${RELOAD_RULES_TOPIC}`);
    });

    mqttClient.on('message', (topic, message) => {
      if (topic === SYS_TOPIC_CLIENTS_CONNECTED) {
        connectedClients = parseInt(message.toString(), 10);
        return;
      }

      let payload;
      const messageString = message.toString();

      try {
        payload = JSON.parse(messageString);
      } catch (error) {
        console.warn(`Received non-JSON message on topic '${topic}': "${messageString}". Ignoring.`);
        return;
      }

      try {
        if (topic === RELOAD_RULES_TOPIC) {
            console.log('API triggered rule reload. Reloading metric rules from database...');
            loadMetricRules();
            loadAlertThresholds();
            return;
        }

        const timestamp = new Date(Date.now()).toISOString();

        const matchedRules = metricRules.filter(rule => {
            if (rule.topic && rule.topic !== topic) {
                return false;
            }

            if (rule.device_param && rule.device_id) {
                const deviceIdFromPayload = payload[rule.device_param];
                if (deviceIdFromPayload !== rule.device_id) {
                    return false;
                }
            }
            
            return true;
        });

        if (matchedRules.length > 0) {
            const deviceId = matchedRules[0].device_id;

            matchedRules.forEach(metricRule => {
                const metricValue = payload[metricRule.mqtt_param];
                if (metricValue !== undefined) {
                    processMetric(metricRule, metricValue, timestamp);
                }
            });
        }

      } catch (parseError) {
        console.error("Error processing MQTT message:", parseError);
      }
    });

  } catch (error) {
    console.error('Failed to initialize metric rule service:', error);
  }
});

mqttClient.on('error', (error) => {
  console.error('MQTT client error:', error);
});
