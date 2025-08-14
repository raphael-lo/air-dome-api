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
exports.queryHistoricalData = exports.querySensorData = exports.writeSensorData = void 0;
const influxdb_client_1 = require("@influxdata/influxdb-client");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const url = process.env.INFLUXDB_URL || '';
const token = process.env.INFLUXDB_TOKEN || '';
const org = process.env.INFLUXDB_ORG || '';
const bucket = process.env.INFLUXDB_BUCKET || '';
const influxDB = new influxdb_client_1.InfluxDB({ url, token });
const writeApi = influxDB.getWriteApi(org, bucket);
const writeSensorData = (data) => {
    const point = new influxdb_client_1.Point('sensor_data')
        .floatField('internalPressure', data.internalPressure)
        .floatField('externalPressure', data.externalPressure)
        .floatField('internalTemperature', data.internalTemperature)
        .floatField('externalTemperature', data.externalTemperature)
        .floatField('internalHumidity', data.internalHumidity)
        .floatField('externalHumidity', data.externalHumidity)
        .floatField('internalWindSpeed', data.internalWindSpeed)
        .floatField('externalWindSpeed', data.externalWindSpeed)
        .floatField('internalPM25', data.internalPM25)
        .floatField('externalPM25', data.externalPM25)
        .floatField('internalCO2', data.internalCO2)
        .floatField('externalCO2', data.externalCO2)
        .floatField('internalO2', data.internalO2)
        .floatField('externalO2', data.externalO2)
        .floatField('internalCO', data.internalCO)
        .floatField('externalCO', data.externalCO)
        .floatField('airExchangeRate', data.airExchangeRate)
        .floatField('internalNoise', data.internalNoise)
        .floatField('externalNoise', data.externalNoise)
        .floatField('internalLux', data.internalLux)
        .stringField('lightingStatus', data.lightingStatus)
        .floatField('basePressure', data.basePressure)
        .floatField('fanSpeed', data.fanSpeed)
        .timestamp(new Date(data.timestamp));
    writeApi.writePoint(point);
    writeApi.flush();
};
exports.writeSensorData = writeSensorData;
const querySensorData = (...args_1) => __awaiter(void 0, [...args_1], void 0, function* (range = '-1h') {
    const queryApi = influxDB.getQueryApi(org);
    const query = `from(bucket: "${bucket}") |> range(start: ${range}) |> filter(fn: (r) => r._measurement == "sensor_data")`;
    const result = yield queryApi.collectRows(query);
    return result;
});
exports.querySensorData = querySensorData;
const getRangeInMinutes = (range) => {
    const value = parseInt(range.slice(1, -1)); // Remove '-' and 'm'/'h'
    const unit = range.slice(-1);
    if (unit === 'm') {
        return value;
    }
    else if (unit === 'h') {
        return value * 60;
    }
    return 0; // Should not happen with valid ranges
};
const queryHistoricalData = (measurement_1, field_1, ...args_1) => __awaiter(void 0, [measurement_1, field_1, ...args_1], void 0, function* (measurement, field, range = '-24h', maxPoints = 40) {
    const queryApi = influxDB.getQueryApi(org);
    const rangeMinutes = getRangeInMinutes(range);
    let every = `${Math.max(1, Math.floor(rangeMinutes / maxPoints))}m`; // Ensure at least 1 minute interval
    // Adjust 'every' for very short ranges to avoid 0 or too small intervals
    if (rangeMinutes < maxPoints) {
        every = '1m'; // For ranges smaller than maxPoints, aggregate by 1 minute
    }
    const query = `
    from(bucket: "${bucket}")
    |> range(start: ${range})
    |> filter(fn: (r) => r._measurement == "${measurement}" and r._field == "${field}")
    |> aggregateWindow(every: ${every}, fn: mean, createEmpty: true)
    |> yield(name: "mean")
  `;
    const result = yield queryApi.collectRows(query);
    return result.map((row) => ({ _time: row._time, _value: row._value }));
});
exports.queryHistoricalData = queryHistoricalData;
