import db from '../services/databaseService';
import { Alert } from '../models/alert'; // Assuming Alert interface is defined here or in types.ts

export const getAlertsFromDb = async (siteId?: string): Promise<Alert[]> => {
  let query = 'SELECT * FROM alerts';
  const params: string[] = [];

  if (siteId) {
    query += ' WHERE site_id = $1';
    params.push(siteId);
  }

  const { rows } = await db.query(query, params);
  return rows.map(row => ({
    ...row,
    message_params: typeof row.message_params === 'string' ? JSON.parse(row.message_params) : {},
  }));
};

export const acknowledgeAlertInDb = async (alertId: string): Promise<number> => {
  const { rowCount } = await db.query('UPDATE alerts SET status = $1 WHERE id = $2', ['acknowledged', alertId]);
  return rowCount ?? 0;
};