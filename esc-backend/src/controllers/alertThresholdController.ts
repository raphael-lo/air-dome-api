import { Request, Response } from 'express';
import db from '../services/databaseService';
import { v4 as uuidv4 } from 'uuid';
import { mqttClient } from '../services/mqttService';

export const getAlertThresholds = async (req: Request, res: Response) => {
  const { siteId } = req.params;
  try {
    const { rows } = await db.query(
      `SELECT at.*, m.mqtt_param, m.display_name
       FROM alert_thresholds at
       JOIN metrics m ON at.metric_id = m.id
       WHERE at.site_id = $1`,
      [siteId]
    );
    res.json(rows);
  } catch (err: any) {
    res.status(500).json({ message: 'Error getting alert thresholds', error: err.message });
  }
};

export const createAlertThreshold = async (req: Request, res: Response) => {
  const { siteId } = req.params;
  const { metric_id, min_warning, max_warning, min_alert, max_alert } = req.body;

  const query = `
    INSERT INTO alert_thresholds (id, site_id, metric_id, min_warning, max_warning, min_alert, max_alert)
    VALUES ($1, $2, $3, $4, $5, $6, $7)
    ON CONFLICT(metric_id) DO UPDATE SET
      min_warning = EXCLUDED.min_warning,
      max_warning = EXCLUDED.max_warning,
      min_alert = EXCLUDED.min_alert,
      max_alert = EXCLUDED.max_alert
    RETURNING *
  `;
  const params = [uuidv4(), siteId, metric_id, min_warning, max_warning, min_alert, max_alert];

  try {
    const { rows } = await db.query(query, params);
    res.status(201).json(rows[0]);
    mqttClient.publish('air-dome/config/update', JSON.stringify({ type: 'thresholds' }));
  } catch (err: any) {
    res.status(500).json({ message: 'Error creating or updating alert threshold', error: err.message });
  }
};

export const updateAlertThreshold = async (req: Request, res: Response) => {
  const { siteId, id: thresholdId } = req.params;
  const { metric_id, min_warning, max_warning, min_alert, max_alert } = req.body;

  const query = `
    UPDATE alert_thresholds SET
      metric_id = $1,
      min_warning = $2,
      max_warning = $3,
      min_alert = $4,
      max_alert = $5
    WHERE id = $6 AND site_id = $7
    RETURNING *
  `;
  const params = [metric_id, min_warning, max_warning, min_alert, max_alert, thresholdId, siteId];

  try {
    const { rows, rowCount } = await db.query(query, params);
    if (rowCount === 0) {
      return res.status(404).json({ message: 'Alert threshold not found' });
    }
    res.status(200).json(rows[0]);
    mqttClient.publish('air-dome/config/update', JSON.stringify({ type: 'thresholds' }));
  } catch (err: any) {
    res.status(500).json({ message: 'Error updating alert threshold', error: err.message });
  }
};

export const deleteAlertThreshold = async (req: Request, res: Response) => {
  const { siteId, id: thresholdId } = req.params;
  try {
    const { rowCount } = await db.query('DELETE FROM alert_thresholds WHERE site_id = $1 AND id = $2', [siteId, thresholdId]);
    if (rowCount === 0) {
      return res.status(404).json({ message: 'Alert threshold not found' });
    }
    res.status(200).json({ message: 'Alert threshold deleted successfully' });
    mqttClient.publish('air-dome/config/update', JSON.stringify({ type: 'thresholds' }));
  } catch (err: any) {
    res.status(500).json({ message: 'Error deleting alert threshold', error: err.message });
  }
};

export const reloadConfig = (req: Request, res: Response) => {
  try {
    mqttClient.publish('air-dome/config/reload', JSON.stringify({})); // Publish empty JSON object to trigger reload
    res.status(200).json({ message: 'Config reload triggered' });
  } catch (error: any) {
        console.error("Error in controller:", error);
    console.error('Error triggering config reload:', error);
    res.status(500).json({ message: 'Failed to trigger config reload' });
  }
};
