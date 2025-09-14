
// esc-backend/src/controllers/escDataController.ts

import { Request, Response } from 'express';
import { InfluxDBService } from '../services/influxdbService';
import { escDevices, EscDevice } from '../models/escDevice';

export class EscDataController {
  private influxDBService: InfluxDBService;

  constructor(influxDBService: InfluxDBService) {
    this.influxDBService = influxDBService;
  }

  public async getHistoricalData(req: Request, res: Response): Promise<void> {
    try {
      const { appKey, deviceId, slaveDevAddr, channel, range = '-24h' } = req.query;

      if (!appKey || !deviceId || !channel) {
        res.status(400).json({ error: 'Missing required query parameters: appKey, deviceId, channel.' });
        return;
      }

      // Construct the Flux query dynamically
      let query = `
        from(bucket: "${process.env.INFLUXDB_BUCKET}")
        |> range(start: ${range})
        |> filter(fn: (r) => r._measurement == "esc_metrics")
        |> filter(fn: (r) => r.appKey == "${appKey}")
        |> filter(fn: (r) => r.deviceId == "${deviceId}")
        |> filter(fn: (r) => r.channel == "${channel}")
      `;

      if (slaveDevAddr) {
        query += `
        |> filter(fn: (r) => r.slaveDevAddr == "${slaveDevAddr}")
        `;
      }

      query += `
        |> keep(columns: ["_time", "_value"])
        |> yield(name: "mean")
      `;

      const results = await this.influxDBService.queryRaw(query); // Assuming a queryRaw method exists or will be added

      res.json(results.map((row: any) => ({ time: row._time, value: row._value })));
    } catch (error: any) {
        console.error("Error in controller:", error);
      console.error('Error fetching historical ESC data:', error);
      res.status(500).json({ error: 'Failed to fetch historical data.' });
    }
  }

  public getDeviceStatus(req: Request, res: Response): Response {
    const allDeviceStates = Array.from(escDevices.values()).map(device => device.getState());
    return res.json(allDeviceStates);
  }

  public getSpecificDeviceStatus(req: Request, res: Response): Response {
    const { appKey, deviceId } = req.params;
    if (!appKey || !deviceId) {
      return res.status(400).json({ error: 'Missing appKey or deviceId in parameters.' });
    }
    const device = escDevices.get(`${appKey}:${deviceId}`);
    if (device) {
      return res.json(device.getState());
    } else {
      return res.status(404).json({ error: 'Device not found.' });
    }
  }
}
