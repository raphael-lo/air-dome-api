import { Request, Response } from 'express';
import db from '../services/databaseService';
import { broadcast } from '../services/websocketService'; // Import broadcast

export const getAlerts = async (req: Request, res: Response) => {
  const { site_id } = req.query;
  let query = 'SELECT * FROM alerts';
  const params: string[] = [];

  if (site_id) {
    query += ' WHERE site_id = $1';
    params.push(site_id as string);
  }

  try {
    const { rows } = await db.query(query, params);
    const parsedRows = rows.map(row => ({
      ...row,
      message_params: typeof row.message_params === 'string' ? JSON.parse(row.message_params) : {},
    }));
    res.json(parsedRows);
  } catch (err: any) {
    res.status(500).json({ message: 'Error fetching alerts', error: err.message });
  }
};

export const acknowledgeAlert = async (req: Request, res: Response) => {
  const { alertId } = req.params;

  try {
    const { rowCount } = await db.query('UPDATE alerts SET status = $1 WHERE id = $2', ['acknowledged', alertId]);
    if (rowCount === 0) {
      res.status(404).json({ message: 'Alert not found' });
    } else {
      // After successful update, broadcast the change
      broadcast({ type: 'alert_status_updated', payload: { id: alertId, status: 'acknowledged' } });
      res.json({ message: 'Alert acknowledged successfully' });
    }
  } catch (err: any) {
    res.status(500).json({ message: 'Error acknowledging alert', error: err.message });
  }
};