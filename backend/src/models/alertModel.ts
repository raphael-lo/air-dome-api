import db from '../services/databaseService';
import { Alert } from '../models/alert'; // Assuming Alert interface is defined here or in types.ts

export const getAlertsFromDb = async (siteId?: string, page: number = 1, limit: number = 20): Promise<{ alerts: Alert[], total: number }> => {
  const offset = (page - 1) * limit;

  let countQuery = 'SELECT COUNT(*) FROM alerts';
  let dataQuery = 'SELECT * FROM alerts';
  const params: any[] = [];

  if (siteId) {
    countQuery += ' WHERE site_id = $1';
    dataQuery += ' WHERE site_id = $1';
    params.push(siteId);
  }

  // Get Total Count
  const countResult = await db.query(countQuery, params);
  const total = parseInt(countResult.rows[0].count, 10);

  // Get Paginated Data
  dataQuery += ` ORDER BY timestamp DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
  const dataParams = [...params, limit, offset];

  const { rows } = await db.query(dataQuery, dataParams);

  const alerts = rows.map(row => ({
    ...row,
    message_params: typeof row.message_params === 'string' ? JSON.parse(row.message_params) : {},
  }));

  return { alerts, total };
};

export const acknowledgeAlertInDb = async (siteId: string, alertId: string): Promise<number> => {
  const { rowCount } = await db.query('UPDATE alerts SET status = $1 WHERE id = $2', ['acknowledged', alertId]);
  return rowCount ?? 0;
};

export const acknowledgeAllAlertsInDb = async (siteId: string): Promise<number> => {
  const { rowCount } = await db.query('UPDATE alerts SET status = $1 WHERE site_id = $2 AND status = $3', ['acknowledged', siteId, 'active']);
  return rowCount ?? 0;
};