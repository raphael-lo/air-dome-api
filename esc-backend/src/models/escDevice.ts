
// esc-backend/src/models/escDevice.ts

import { EscDeviceState } from '../types/esc';

export class EscDevice {
  public appKey: string;
  public deviceId: string; // Corresponds to ID in MQTT topic
  public slaveDevAddr: string; // From data message
  public handshakeStatus: 'disconnected' | 'asking' | 'requested' | 'connected';
  public lastLoginId: number | null;
  public lastHeartbeatTime: number | null;
  public lastDataTime: number | null;

  constructor(appKey: string, deviceId: string) {
    this.appKey = appKey;
    this.deviceId = deviceId;
    this.slaveDevAddr = ''; // Will be updated from data messages
    this.handshakeStatus = 'disconnected';
    this.lastLoginId = null;
    this.lastHeartbeatTime = null;
    this.lastDataTime = null;
  }

  public updateHandshakeStatus(status: 'disconnected' | 'asking' | 'requested' | 'connected', lastId: number | null = null): void {
    this.handshakeStatus = status;
    if (lastId !== null) {
      this.lastLoginId = lastId;
    }
  }

  public updateHeartbeat(): void {
    this.lastHeartbeatTime = Date.now();
  }

  public updateDataTime(): void {
    this.lastDataTime = Date.now();
  }

  public setSlaveDevAddr(addr: string): void {
    this.slaveDevAddr = addr;
  }

  public getState(): EscDeviceState {
    return {
      appKey: this.appKey,
      deviceId: this.deviceId,
      slaveDevAddr: this.slaveDevAddr,
      handshakeStatus: this.handshakeStatus,
      lastLoginId: this.lastLoginId,
      lastHeartbeatTime: this.lastHeartbeatTime,
      lastDataTime: this.lastDataTime,
    };
  }
}

// A simple in-memory store for device states
// In a production environment, this would likely be persisted in a database
export const escDevices: Map<string, EscDevice> = new Map(); // Key: `${appKey}:${deviceId}`

export function getOrCreateEscDevice(appKey: string, deviceId: string): EscDevice {
  const key = `${appKey}:${deviceId}`;
  if (!escDevices.has(key)) {
    escDevices.set(key, new EscDevice(appKey, deviceId));
  }
  return escDevices.get(key)!;
}
