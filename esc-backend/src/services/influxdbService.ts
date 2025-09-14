import { InfluxDB, Point, WriteApi } from '@influxdata/influxdb-client';

const url = process.env.INFLUXDB_URL || 'http://localhost:8086';
const token = process.env.INFLUXDB_TOKEN || 'my-super-secret-token';
const org = process.env.INFLUXDB_ORG || 'my-org';
const bucket = process.env.INFLUXDB_BUCKET || 'my-bucket';

interface InfluxPointData {
  measurement: string;
  tags?: Record<string, string>;
  fields: Record<string, any>;
  timestamp?: number; // Unix timestamp in milliseconds
}

export class InfluxDBService {
  private influxDB: InfluxDB;
  private writeApi: WriteApi;
  private queryApi: ReturnType<InfluxDB['getQueryApi']>;
  private org: string;
  private bucket: string;

  constructor() {
    this.influxDB = new InfluxDB({ url, token });
    this.org = org;
    this.bucket = bucket;
    this.writeApi = this.influxDB.getWriteApi(this.org, this.bucket);
    this.queryApi = this.influxDB.getQueryApi(this.org);
  }

  public writeMetric(measurement: string, field: string, value: number, tags?: Record<string, string>): void {
    const point = new Point(measurement)
      .floatField(field, value)
      .timestamp(new Date());

    if (tags) {
      for (const [key, val] of Object.entries(tags)) {
        point.tag(key, val);
      }
    }

    this.writeApi.writePoint(point);
    this.writeApi.flush(); 
  }

  public async writePoints(points: InfluxPointData[]): Promise<void> {
    const influxPoints = points.map(data => {
      const point = new Point(data.measurement);

      if (data.tags) {
        for (const [key, val] of Object.entries(data.tags)) {
          point.tag(key, val);
        }
      }

      for (const [key, val] of Object.entries(data.fields)) {
        if (typeof val === 'number') {
          point.floatField(key, val);
        } else if (typeof val === 'string') {
          point.stringField(key, val);
        } else if (typeof val === 'boolean') {
          point.booleanField(key, val);
        }
      }

      if (data.timestamp) {
        point.timestamp(new Date(data.timestamp));
      } else {
        point.timestamp(new Date());
      }
      return point;
    });

    this.writeApi.writePoints(influxPoints);
    try {
        await this.writeApi.flush();
    } catch (error) {
        console.error('Error flushing InfluxDB points:', error);
    }
  }

  public async queryRaw(fluxQuery: string): Promise<any[]> {
    const queryApi = this.influxDB.getQueryApi(this.org);
    try {
      const results = await queryApi.collectRows(fluxQuery);
      return results;
    } catch (error) {
      console.error('Error executing raw InfluxDB query:', error);
      throw error;
    }
  }

  public async querySensorData(range: string = '-1h'): Promise<any> {
    const query = `from(bucket: "${this.bucket}") |> range(start: ${range}) |> filter(fn: (r) => r._measurement == "sensor_data")`;
    const result = await this.queryApi.collectRows(query);
    return result;
  }

  private getRangeInSeconds(range: string): number {
    const value = parseInt(range.slice(1, -1));
    const unit = range.slice(-1);
    if (unit === 'm') {
      return value * 60;
    } else if (unit === 'h') {
      return value * 60 * 60;
    }
    return 0;
  }

  public async queryHistoricalData(measurement: string, field: string, range: string = '-24h', maxPointsOrTopic?: number | string, device_id?: string, maxPoints?: number): Promise<any[]> {
    let topic: string | undefined;
    let actualMaxPoints: number = 40;

    if (typeof maxPointsOrTopic === 'string') {
      topic = maxPointsOrTopic;
      actualMaxPoints = maxPoints || 40;
    } else if (typeof maxPointsOrTopic === 'number') {
      actualMaxPoints = maxPointsOrTopic;
    }

    const rangeSeconds = this.getRangeInSeconds(range);
    let every = `${Math.max(1, Math.floor(rangeSeconds / actualMaxPoints))}s`;

    if (rangeSeconds < actualMaxPoints) {
      every = '1m';
    }

    let query = `
    from(bucket: "${this.bucket}")
    |> range(start: ${range})
    |> filter(fn: (r) => r._measurement == "${measurement}" and r._field == "${field}")`;

    if (topic && device_id) {
      query += `
    |> filter(fn: (r) => r.topic == "${topic}" and r.device_id == "${device_id}")`;
    }

    query += `
    |> aggregateWindow(every: ${every}, fn: mean, createEmpty: true)
    |> yield(name: "mean")
  `;
    const result = await this.queryApi.collectRows(query);
    return result.map((row: any) => ({ _time: row._time, _value: row._value }));
  }
}

export const influxDBService = new InfluxDBService();
