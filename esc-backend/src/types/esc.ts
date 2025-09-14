
// esc-backend/src/types/esc.ts

export interface EscMqttLoginMessage {
  productKey?: string;
  deviceSecret?: string;
  status: 'ask' | 'req' | 'fin' | 'out';
  id: number;
}

export interface EscMqttHeartbeatMessage {
  id: number;
}

export interface YxEntry {
  c: number; // Channel code
  v: number; // Value
  time?: number; // Optional timestamp for the specific entry
}

export interface EscMqttDataMessage {
  id: string; // Unique message ID
  version: string;
  time: number; // Timestamp of the message
  slaveDevAddr: string; // Specific device's unique communication address
  yxList: YxEntry[];
}

export interface EscDeviceState {
  appKey: string;
  deviceId: string; // Corresponds to ID in MQTT topic
  slaveDevAddr: string; // From data message
  handshakeStatus: 'disconnected' | 'asking' | 'requested' | 'connected';
  lastLoginId: number | null; // Last ID from device's login message
  lastHeartbeatTime: number | null;
  lastDataTime: number | null;
}
