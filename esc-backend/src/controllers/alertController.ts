import { Request, Response } from 'express';
import { getAlertsFromDb, acknowledgeAlertInDb } from '../models/alertModel'; // Import from new model
import { broadcast } from '../services/websocketService'; // Import broadcast

export const getAlerts = async (req: Request, res: Response) => {
  const { site_id } = req.query;
  try {
    const alerts = await getAlertsFromDb(site_id as string); // Call model function
    res.json(alerts);
  } catch (err: any) {
    console.error("Error in getAlerts:", err);
    res.status(500).json({ message: 'Error fetching alerts', error: err.message });
  }
};

export const acknowledgeAlert = async (req: Request, res: Response) => {
  const { alertId } = req.params;

  try {
    const rowCount = await acknowledgeAlertInDb(alertId); // Call model function
    if (rowCount === 0) {
      res.status(404).json({ message: 'Alert not found' });
    } else {
      broadcast({ type: 'alert_status_updated', payload: { id: alertId, status: 'acknowledged' } });
      res.json({ message: 'Alert acknowledged successfully' });
    }
  } catch (err: any) {
    console.error("Error in acknowledgeAlert:", err);
    res.status(500).json({ message: 'Error acknowledging alert', error: err.message });
  }
};
