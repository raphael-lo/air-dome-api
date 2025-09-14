
// esc-backend/src/controllers/escMqttController.ts

import { MqttClient } from 'mqtt';
import { EscMqttLoginMessage, EscMqttHeartbeatMessage, EscMqttDataMessage, YxEntry } from '../types/esc';
import { getOrCreateEscDevice } from '../models/escDevice';
import { InfluxDBService } from '../services/influxdbService'; // Assuming this exists and is exported

export class EscMqttController {
  private mqttClient: MqttClient;
  private influxDBService: InfluxDBService;

  constructor(mqttClient: MqttClient, influxDBService: InfluxDBService) {
    this.mqttClient = mqttClient;
    this.influxDBService = influxDBService;
  }

  public handleLoginMessage(topic: string, message: EscMqttLoginMessage): void {
    const [,, appKey, deviceId] = topic.split('/'); // iot/rx/${AppKey}/${ID}/login
    const device = getOrCreateEscDevice(appKey, deviceId);

    console.log(`[ESC MQTT] Login message from ${appKey}/${deviceId}:`, message);

    switch (message.status) {
      case 'ask':
        if (device.handshakeStatus === 'disconnected' || device.handshakeStatus === 'asking') {
          device.updateHandshakeStatus('requested', message.id);
          const responseTopic = `iot/rx/${appKey}/${deviceId}/login`;
          const responsePayload = {
            status: 'req',
            id: message.id + 1,
          };
          this.mqttClient.publish(responseTopic, JSON.stringify(responsePayload));
          console.log(`[ESC MQTT] Responded to ${appKey}/${deviceId} with req, id: ${responsePayload.id}`);
        }
        break;
      case 'fin':
        if (device.handshakeStatus === 'requested' && message.id === (device.lastLoginId || 0) + 3) {
          device.updateHandshakeStatus('connected');
          console.log(`[ESC MQTT] Handshake complete for ${appKey}/${deviceId}`);
        } else {
          console.warn(`[ESC MQTT] Unexpected 'fin' status for ${appKey}/${deviceId}. Expected ID: ${(device.lastLoginId || 0) + 3}, Received ID: ${message.id}`);
        }
        break;
      case 'out':
        device.updateHandshakeStatus('disconnected');
        console.log(`[ESC MQTT] Device ${appKey}/${deviceId} logged out.`);
        break;
      default:
        console.warn(`[ESC MQTT] Unknown login status: ${message.status} from ${appKey}/${deviceId}`);
    }
  }

  public handleHeartbeatMessage(topic: string, message: EscMqttHeartbeatMessage): void {
    const [,, appKey, deviceId] = topic.split('/'); // iot/rx/${AppKey}/${ID}/heartbeat
    const device = getOrCreateEscDevice(appKey, deviceId);
    device.updateHeartbeat();
    console.log(`[ESC MQTT] Heartbeat from ${appKey}/${deviceId}, id: ${message.id}`);
  }

  public handleDataMessage(topic: string, message: EscMqttDataMessage): void {
    const [,, appKey, deviceId] = topic.split('/'); // iot/rx/${AppKey}/${ID}/resultYx
    const device = getOrCreateEscDevice(appKey, deviceId);
    device.updateDataTime();
    device.setSlaveDevAddr(message.slaveDevAddr);

    console.log(`[ESC MQTT] Data message from ${appKey}/${deviceId} (Slave: ${message.slaveDevAddr}), ID: ${message.id}, YX Count: ${message.yxList.length}`);

    if (device.handshakeStatus !== 'connected') {
      console.warn(`[ESC MQTT] Received data from unhandshaked device ${appKey}/${deviceId}. Data will be processed but consider reviewing handshake.`);
    }

    // Prepare data for InfluxDB
    const points = message.yxList.map((entry: YxEntry) => {
      return {
        measurement: 'esc_metrics',
        tags: {
          appKey: appKey,
          deviceId: deviceId,
          slaveDevAddr: message.slaveDevAddr,
          channel: entry.c.toString(), // Use channel code as a tag
        },
        fields: {
          value: entry.v,
        },
        timestamp: entry.time || message.time, // Use entry time if available, else message time
      };
    });

    if (points.length > 0) {
      this.influxDBService.writePoints(points)
        .then(() => console.log(`[ESC MQTT] Wrote ${points.length} data points to InfluxDB for ${appKey}/${deviceId}`))
        .catch(error => console.error(`[ESC MQTT] Error writing data points to InfluxDB for ${appKey}/${deviceId}:`, error));
    }
  }
}
