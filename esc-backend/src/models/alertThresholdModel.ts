import db from '../services/databaseService';
import { v4 as uuidv4 } from 'uuid';
import type { AlertThreshold } from '../types'; // Assuming AlertThreshold interface is defined here or in types.ts

export const getAlertThresholdsFromDb = async (siteId: string): Promise<AlertThreshold[]> => {
  const { rows } = await db.query(
    `SELECT at.*, m.mqtt_param, m.display_name
     FROM alert_thresholds at
     JOIN metrics m ON at.metric_id = m.id
     WHERE at.site_id = $1`,
    [siteId]
  );
  return rows;
};

export const createAlertThresholdInDb = async (siteId: string, metric_id: number, min_warning: number, max_warning: number, min_alert: number, max_alert: number): Promise<AlertThreshold> => {
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
  const { rows } = await db.query(query, params);
  return rows[0];
};

export const updateAlertThresholdInDb = async (siteId: string, thresholdId: string, metric_id: number, min_warning: number, max_warning: number, min_alert: number, max_alert: number): Promise<AlertThreshold | null> => {
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
  const { rows, rowCount } = await db.query(query, params);
  return (rowCount !== null && rowCount > 0) ? rows[0] : null; // Explicitly check for null
};

export const deleteAlertThresholdInDb = async (siteId: string, thresholdId: string): Promise<number> => {
  const { rowCount } = await db.query('DELETE FROM alert_thresholds WHERE site_id = $1 AND id = $2', [siteId, thresholdId]);
  return rowCount ?? 0; // Ensure it always returns a number
};