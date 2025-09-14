import dotenv from 'dotenv';
dotenv.config();

import express, { Request, Response } from 'express';
import cors from 'cors';
import http from 'http';
import sensorDataRouter from './routes/sensorData';
import userRouter from './routes/user';
import alertRouter from './routes/alert';
import fanControlRouter from './routes/fanControl';
import lightingControlRouter from './routes/lightingControl';
import alertThresholdsRouter from './routes/alertThresholds';
import httpSensorRouter from './routes/httpSensor';
import metricRouter from './routes/metric';
import metricGroupRouter from './routes/metricGroup';
import sectionRouter from './routes/section';
import domeMetricsRouter from './routes/domeMetrics';
import statsRouter from './routes/stats';
import escDataRouter from './routes/escData'; // Import the new ESC data routes
import './services/databaseService';

import { initializeWebSocket } from './services/websocketService';
import './services/mqttService'; // This import initializes the MQTT client and listeners
import { authenticateToken } from './middleware/auth';

const main = async () => {
  

  const app = express();
  const server = http.createServer(app);
  const port = process.env.PORT || 3001;

  const corsOptions = {
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
    optionsSuccessStatus: 200
  };

  app.use(cors(corsOptions));
  app.use(express.json());

  // Existing routes
  app.use('/api', httpSensorRouter);
  app.use('/api', sensorDataRouter);
  app.use('/api', userRouter);
  app.use('/api', authenticateToken, alertRouter);
  app.use('/api', authenticateToken, fanControlRouter);
  app.use('/api', authenticateToken, lightingControlRouter);
  app.use('/api', authenticateToken, alertThresholdsRouter);
  app.use('/api', authenticateToken, statsRouter);
  app.use('/api', metricRouter);
  app.use('/api', metricGroupRouter);
  app.use('/api', sectionRouter);
  app.use('/api', domeMetricsRouter);

  // New ESC data routes
  app.use('/api', escDataRouter);

  app.get('/', (req: Request, res: Response) => {
    res.send('ESC Backend is running!');
  });

  initializeWebSocket(server);

  server.listen(port, () => {
    console.log(`Server is running on port ${port}`);
  });
};

main();
