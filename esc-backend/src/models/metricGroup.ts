import db from '../services/databaseService';

export interface MetricGroup {
  id?: number;
  name: string;
  name_tc?: string;
  icon: string;
  metric1_id: number;
  metric1_display_name: string;
  metric1_display_name_tc?: string;
  metric2_id: number;
  metric2_display_name: string;
  metric2_display_name_tc?: string;
}

export const getMetricGroups = async (): Promise<MetricGroup[]> => {
  const { rows } = await db.query('SELECT *, name_tc, metric1_display_name_tc, metric2_display_name_tc FROM metric_groups', []);
  return rows as MetricGroup[];
};

export const createMetricGroup = async (group: Omit<MetricGroup, 'id'>): Promise<MetricGroup> => {
  const query = 'INSERT INTO metric_groups (name, name_tc, icon, metric1_id, metric1_display_name, metric1_display_name_tc, metric2_id, metric2_display_name, metric2_display_name_tc) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *';
  const params = [group.name, group.name_tc, group.icon, group.metric1_id, group.metric1_display_name, group.metric1_display_name_tc, group.metric2_id, group.metric2_display_name, group.metric2_display_name_tc];
  const { rows } = await db.query(query, params);
  return rows[0];
};

export const updateMetricGroup = async (id: number, group: Omit<MetricGroup, 'id'>): Promise<MetricGroup> => {
  const query = 'UPDATE metric_groups SET name = $1, name_tc = $2, icon = $3, metric1_id = $4, metric1_display_name = $5, metric1_display_name_tc = $6, metric2_id = $7, metric2_display_name = $8, metric2_display_name_tc = $9 WHERE id = $10 RETURNING *';
  const params = [group.name, group.name_tc, group.icon, group.metric1_id, group.metric1_display_name, group.metric1_display_name_tc, group.metric2_id, group.metric2_display_name, group.metric2_display_name_tc, id];
  const { rows } = await db.query(query, params);
  return rows[0];
};

export const deleteMetricGroup = async (id: number): Promise<void> => {
  await db.query('DELETE FROM metric_groups WHERE id = $1', [id]);
};
