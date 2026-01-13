import mqtt from 'mqtt';
import crypto from 'node:crypto';
import { writeMetric } from './influxdbService';
import { broadcast } from './websocketService';
import db from './databaseService';
import { v4 as uuidv4 } from 'uuid';
import { StatusLevel, type AlertRule, type Metric, AlertOperator, AlertSeverity, DerivedMetricRule, DerivedMetricOperator } from '../types';

// --- In-memory cache for metric rules and stats ---
type MetricRule = Metric & { topic: string };
let metricRules: MetricRule[] = [];
let alertRules: AlertRule[] = [];
let lastMetricStatus: Record<string, StatusLevel> = {};
let connectedClients = 0;
let derivedRules: DerivedMetricRule[] = [];

// NEW: Cache for calculating derived metrics
const dataCache: Record<string, number> = {};

// Export stats for other modules to access
export const getStats = () => ({
  connectedClients,
});

const severityOrder = {
  [AlertSeverity.INFO]: 0,
  [AlertSeverity.LOW]: 1,
  [AlertSeverity.MEDIUM]: 2,
  [AlertSeverity.HIGH]: 3,
  [AlertSeverity.CRITICAL]: 4,
};

// --- Helper Functions ---

const evaluateRule = (value: number, operator: AlertOperator, threshold: number): boolean => {
  switch (operator) {
    case AlertOperator.GREATER_THAN: return value > threshold;
    case AlertOperator.LESS_THAN: return value < threshold;
    case AlertOperator.EQUALS: return value === threshold;
    case AlertOperator.GREATER_THAN_OR_EQUALS: return value >= threshold;
    case AlertOperator.LESS_THAN_OR_EQUALS: return value <= threshold;
    default: return false;
  }
};

const createAlert = async (metric: Metric, rule: AlertRule, value: number, unit: string = '') => {
  const newAlert = {
    id: uuidv4(),
    site_id: metric.site_id,
    parameter_key: rule.name, // Use rule name as parameter key
    message_key: 'alert_rule_triggered',
    message_params: {
      metricName: metric.display_name,
      deviceId: metric.device_id,
      severity: rule.severity,
      value: value,
      unit: unit || '',
      operator: rule.operator,
      threshold: rule.threshold
    },
    severity: rule.severity,
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

// NEW: Map to store the last calculated status by metric ID
const metricIdToStatus: Record<number, StatusLevel> = {};

const processMetric = (metricRule: MetricRule, value: any, timestamp: string) => {
  if (typeof value !== 'number') return;

  // 1. Write to Cache
  if (metricRule.mqtt_param) {
    dataCache[metricRule.mqtt_param] = value;
    // Also map by ID for easier lookup in dynamic rules
    if (metricRule.id) {
      dataCache[`id_${metricRule.id}`] = value;
    }
  }

  if (!metricRule.device_id) {
    console.error(`Cannot process metric for rule ID ${metricRule.id} because it has no device_id.`);
    return;
  }

  if (metricRule.topic !== 'air-dome/virtual') {
    writeMetric('sensor_data', metricRule.mqtt_param || '', value, { device_id: metricRule.device_id, topic: metricRule.topic });
  }

  // Filter rules for this metric
  const relevantRules = alertRules.filter(r => r.metric_id === metricRule.id && r.active && r.site_id === metricRule.site_id);

  // Evaluate all rules (NATIVE Status)
  let maxSeverity: AlertSeverity | null = null;
  let triggeringRule: AlertRule | null = null;

  for (const rule of relevantRules) {
    if (evaluateRule(value, rule.operator, rule.threshold)) {
      if (maxSeverity === null || severityOrder[rule.severity] > severityOrder[maxSeverity]) {
        maxSeverity = rule.severity;
        triggeringRule = rule;
      }
    }
  }

  // --- INHERITED Status Logic ---
  // Check if this metric is a source for any active derived rules that are in critical state
  let inheritedSeverity: AlertSeverity | null = null;
  if (metricRule.id) {
    // Find derived rules where this metric is a source
    const parentRules = derivedRules.filter(r => r.active && (r.metric1_id === metricRule.id || r.metric2_id === metricRule.id));

    for (const pRule of parentRules) {
      // Get the target metric ID (the derived one)
      const targetId = pRule.target_metric_id;
      // Check its status
      const targetStatus = metricIdToStatus[targetId];
      if (targetStatus === StatusLevel.Danger) {
        // If a parent is Danger, we inherit at least High severity (which maps to Danger)
        if (inheritedSeverity === null || severityOrder[AlertSeverity.HIGH] > severityOrder[inheritedSeverity]) {
          inheritedSeverity = AlertSeverity.HIGH;
        }
      } else if (targetStatus === StatusLevel.Warn) {
        if (inheritedSeverity === null || severityOrder[AlertSeverity.MEDIUM] > severityOrder[inheritedSeverity]) {
          inheritedSeverity = AlertSeverity.MEDIUM;
        }
      }
    }
  }

  // Final Severity is Max(Native, Inherited)
  let finalSeverity = maxSeverity;
  if (inheritedSeverity) {
    if (finalSeverity === null || severityOrder[inheritedSeverity] > severityOrder[finalSeverity]) {
      finalSeverity = inheritedSeverity;
    }
  }

  const metricKey = `${metricRule.topic}:${metricRule.device_id}:${metricRule.mqtt_param}`;
  const currentStatus = finalSeverity ? (severityOrder[finalSeverity] >= 3 ? StatusLevel.Danger : StatusLevel.Warn) : StatusLevel.Ok;

  // Update ID-based status map
  if (metricRule.id) {
    metricIdToStatus[metricRule.id] = currentStatus;
  }

  const lastStatus = lastMetricStatus[metricKey] || StatusLevel.Ok;

  // Creating Alerts: Only create alert if NATIVE rule triggers. 
  // We don't want to double-create alerts for the source metric just because it inherited status.
  // The User will see the Derived Metric alert. The Source Metric visual change is just for UI context.
  if (triggeringRule) {
    if (severityOrder[triggeringRule.severity] > (lastStatus === StatusLevel.Ok ? 0 : (lastStatus === StatusLevel.Warn ? 1 : 2))) {
      createAlert(metricRule, triggeringRule, value, metricRule.unit || '');
    }
  }

  lastMetricStatus[metricKey] = currentStatus;

  broadcast({
    topic: metricRule.topic,
    device_id: metricRule.device_id,
    mqtt_param: metricRule.mqtt_param,
    value,
    status: currentStatus,
    timestamp
  });

  // --- Dynamic Derived Metric Logic ---
  // Forward Propagation: If I am an input, trigger my targets
  if (metricRule.id) {
    const dependentRules = derivedRules.filter(r => r.active && (r.metric1_id === metricRule.id || r.metric2_id === metricRule.id));
    dependentRules.forEach(rule => {
      calculateAndProcessDynamicRule(rule);
    });
  }
}

// Function to force update inputs when a derived metric changes status
const triggerReverseUpdate = (rule: DerivedMetricRule) => {
  // We need to re-process metric1 and metric2 to pick up the new inherited status
  const idsToUpdate = [rule.metric1_id, rule.metric2_id];

  idsToUpdate.forEach(id => {
    const metric = metricRules.find(m => m.id === id);
    if (metric && metric.mqtt_param) {
      const cachedValue = dataCache[metric.mqtt_param];
      if (cachedValue !== undefined) {
        // Re-run processMetric. 
        // It will check 'metricIdToStatus' for the derived metric (which we just updated), 
        // and assume the new inherited status.
        processMetric(metric, cachedValue, new Date().toISOString());
      }
    }
  });
}

const calculateAndProcessDynamicRule = (rule: DerivedMetricRule) => {
  const val1 = dataCache[`id_${rule.metric1_id}`];
  const val2 = dataCache[`id_${rule.metric2_id}`];

  if (val1 !== undefined && val2 !== undefined) {
    let result = 0;
    switch (rule.operator) {
      case DerivedMetricOperator.ADD: result = val1 + val2; break;
      case DerivedMetricOperator.SUBTRACT: result = val1 - val2; break;
      case DerivedMetricOperator.MULTIPLY: result = val1 * val2; break;
      case DerivedMetricOperator.DIVIDE: result = val2 !== 0 ? val1 / val2 : 0; break;
    }

    result = Number(result.toFixed(2));

    // Find the "target" virtual metric definition
    const targetMetric = metricRules.find(m => m.id === rule.target_metric_id);

    if (targetMetric) {
      const timestamp = new Date().toISOString();
      const oldStatus = metricIdToStatus[targetMetric.id!] || StatusLevel.Ok;

      // Recursive call!
      processMetric(targetMetric, result, timestamp);

      const newStatus = metricIdToStatus[targetMetric.id!] || StatusLevel.Ok;

      // Reverse Propagation: If status changed, update inputs
      if (oldStatus !== newStatus) {
        triggerReverseUpdate(rule);
      }
    }
  }
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

const loadAlertRules = async (): Promise<void> => {
  try {
    const { rows } = await db.query('SELECT * FROM alert_rules WHERE active = true', []);
    alertRules = rows as AlertRule[];
    console.log(`Loaded ${alertRules.length} alert rules into memory.`);
  } catch (err) {
    console.error('Failed to fetch alert rules:', err);
    throw err;
  }
};

const loadDerivedRules = async (): Promise<void> => {
  try {
    const { rows } = await db.query('SELECT * FROM derived_metric_rules WHERE active = true', []);
    derivedRules = rows as DerivedMetricRule[];
    console.log(`Loaded ${derivedRules.length} derived metric rules into memory.`);
  } catch (err) {
    console.error('Failed to fetch derived metric rules:', err);
    throw err;
  }
}

// Update load functions
const loadAllRules = async () => {
  await loadMetricRules();
  await loadAlertRules();
  await loadDerivedRules();
}


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
    await loadAllRules();

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
          console.log('API triggered rule reload. Reloading rules...');
          loadAllRules();
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
          matchedRules.forEach(metricRule => {
            if (metricRule.mqtt_param) { // Ensure mqtt_param is not null
              const metricValue = payload[metricRule.mqtt_param];
              if (metricValue !== undefined) {
                processMetric(metricRule, metricValue, timestamp);
              }
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

