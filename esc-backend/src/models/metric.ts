import db from '../services/databaseService';
import { Metric } from '../types';

export const getMetrics = async (): Promise<Metric[]> => {
  const sql = `SELECT id, topic, device_param, device_id, mqtt_param, display_name, display_name_tc, icon, unit FROM metrics`;
  const { rows } = await db.query(sql, []);
  return rows as Metric[];
};

export const createMetric = async (metric: Metric): Promise<Metric> => {
  const { topic, device_param, device_id, mqtt_param, display_name, display_name_tc, icon, unit } = metric;
  const sql = `INSERT INTO metrics (topic, device_param, device_id, mqtt_param, display_name, display_name_tc, icon, unit)
               VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`;
  const params = [topic, device_param, device_id, mqtt_param, display_name, display_name_tc, icon, unit];
  const { rows } = await db.query(sql, params);
  return rows[0] as Metric;
};

export const updateMetric = async (id: number, metric: Metric): Promise<Metric> => {
  const { topic, device_param, device_id, mqtt_param, display_name, display_name_tc, icon, unit } = metric;
  const sql = `UPDATE metrics SET
                 topic = $1,
                 device_param = $2,
                 device_id = $3,
                 mqtt_param = $4,
                 display_name = $5,
                 display_name_tc = $6,
                 icon = $7,
                 unit = $8
               WHERE id = $9 RETURNING *`;
  const params = [topic, device_param, device_id, mqtt_param, display_name, display_name_tc, icon, unit, id];
  const { rows } = await db.query(sql, params);
  return rows[0] as Metric;
};

export const deleteMetric = async (id: number): Promise<void> => {
  await db.query('DELETE FROM metrics WHERE id = $1', [id]);
};
