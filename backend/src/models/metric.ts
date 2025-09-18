import db from '../services/databaseService';
import { Metric } from '../types';

export const getMetrics = async (siteId: string): Promise<Metric[]> => {
  const sql = `SELECT id, topic, device_param, device_id, mqtt_param, display_name, display_name_tc, icon, unit FROM metrics WHERE site_id = $1`;
  const { rows } = await db.query(sql, [siteId]);
  return rows as Metric[];
};

export const createMetric = async (metric: Metric): Promise<Metric> => {
  const { site_id, topic, device_param, device_id, mqtt_param, display_name, display_name_tc, icon, unit } = metric;
  const sql = `INSERT INTO metrics (site_id, topic, device_param, device_id, mqtt_param, display_name, display_name_tc, icon, unit)
               VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`;
  const params = [site_id, topic, device_param, device_id, mqtt_param, display_name, display_name_tc, icon, unit];
  const { rows } = await db.query(sql, params);
  return rows[0] as Metric;
};

export const updateMetric = async (id: number, metric: Metric): Promise<Metric> => {
  const { site_id, topic, device_param, device_id, mqtt_param, display_name, display_name_tc, icon, unit } = metric;
  const sql = `UPDATE metrics SET
                 topic = $1,
                 device_param = $2,
                 device_id = $3,
                 mqtt_param = $4,
                 display_name = $5,
                 display_name_tc = $6,
                 icon = $7,
                 unit = $8
               WHERE id = $9 AND site_id = $10 RETURNING *`;
  const params = [topic, device_param, device_id, mqtt_param, display_name, display_name_tc, icon, unit, id, site_id];
  const { rows } = await db.query(sql, params);
  return rows[0] as Metric;
};

export const deleteMetric = async (id: number, siteId: string): Promise<void> => {
  await db.query('DELETE FROM metrics WHERE id = $1 AND site_id = $2', [id, siteId]);
};