import db from '../services/databaseService';
import { Metric } from '../types';

export const getMetrics = async (siteId: string, source?: 'air-dome' | 'esc'): Promise<Metric[]> => {
  let sql = `SELECT id, topic, device_param, device_id, mqtt_param, display_name, display_name_tc, icon, unit, source, channel, data_type FROM metrics WHERE site_id = $1`;
  const params: any[] = [siteId];

  if (source) {
    sql += ` AND source = $2`;
    params.push(source);
  }

  const { rows } = await db.query(sql, params);
  return rows as Metric[];
};

export const createMetric = async (metric: Metric): Promise<Metric> => {
  const { site_id, topic, device_param, device_id, mqtt_param, display_name, display_name_tc, icon, unit, source, channel, data_type } = metric;
  const sql = `INSERT INTO metrics (site_id, topic, device_param, device_id, mqtt_param, display_name, display_name_tc, icon, unit, source, channel, data_type)
               VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) RETURNING *`;
  const params = [site_id, topic, device_param, device_id, mqtt_param, display_name, display_name_tc, icon, unit, source, channel, data_type];
  const { rows } = await db.query(sql, params);
  return rows[0] as Metric;
};

export const updateMetric = async (id: number, metric: Metric): Promise<Metric> => {
  const { site_id, topic, device_param, device_id, mqtt_param, display_name, display_name_tc, icon, unit, source, channel, data_type } = metric;
  const sql = `UPDATE metrics SET
                 topic = $1,
                 device_param = $2,
                 device_id = $3,
                 mqtt_param = $4,
                 display_name = $5,
                 display_name_tc = $6,
                 icon = $7,
                 unit = $8,
                 source = $9,
                 channel = $10,
                 data_type = $11
               WHERE id = $12 AND site_id = $13 RETURNING *`;
  const params = [topic, device_param, device_id, mqtt_param, display_name, display_name_tc, icon, unit, source, channel, data_type, id, site_id];
  const { rows } = await db.query(sql, params);
  return rows[0] as Metric;
};

export const deleteMetric = async (id: number, siteId: string): Promise<void> => {
  await db.query('DELETE FROM metrics WHERE id = $1 AND site_id = $2', [id, siteId]);
};