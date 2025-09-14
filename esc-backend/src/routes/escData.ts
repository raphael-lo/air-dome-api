
// esc-backend/src/routes/escData.ts

import express from 'express';
import { EscDataController } from '../controllers/escDataController';
import { influxDBService } from '../services/influxdbService';

const router = express.Router();
const escDataController = new EscDataController(influxDBService);

// Get historical data for a specific ESC channel
router.get('/data/history', (req, res) => escDataController.getHistoricalData(req, res));

// Get status of all ESC devices
router.get('/devices/status', (req, res) => escDataController.getDeviceStatus(req, res));

// Get status of a specific ESC device
router.get('/devices/status/:appKey/:deviceId', (req, res) => escDataController.getSpecificDeviceStatus(req, res));

export default router;
