import { Request, Response } from 'express';
import { getAlertsFromDb, acknowledgeAlertInDb, acknowledgeAllAlertsInDb } from '../models/alertModel'; // Import from new model
import { broadcast } from '../services/websocketService'; // Import broadcast

export const getAlerts = async (req: Request, res: Response) => {
  const { siteId, page, limit } = req.query;
  const pageNum = page ? parseInt(page as string, 10) : 1;
  const limitNum = limit ? parseInt(limit as string, 10) : 20;

  try {
    const result = await getAlertsFromDb(siteId as string, pageNum, limitNum); // Call model function
    res.json(result);
  } catch (err: any) {
    console.error("Error in getAlerts:", err);
    res.status(500).json({ message: 'Error fetching alerts', error: err.message });
  }
};

export const acknowledgeAlert = async (req: Request, res: Response) => {
  const { siteId, id: alertId } = req.params;

  try {
    const rowCount = await acknowledgeAlertInDb(siteId, alertId); // Call model function
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


export const acknowledgeAllAlerts = async (req: Request, res: Response) => {
  const { siteId } = req.params;

  try {
    const rowCount = await acknowledgeAllAlertsInDb(siteId); // Call new model function
    if (rowCount > 0) {
      // Ideally we would broadcast individual IDs, but for "All" we might need a new message type or just rely on refresh.
      // Sending a generic 'alerts_updated' event or similar to trigger a refetch would be good.
      // For now, let's assuming client refetches. We can broadcast a generic update if needed.
      broadcast({ type: 'alerts_updated', payload: { siteId } });
    }
    res.json({ message: `Successfully acknowledged ${rowCount} alerts` });
  } catch (err: any) {
    console.error("Error in acknowledgeAllAlerts:", err);
    res.status(500).json({ message: 'Error acknowledging all alerts', error: err.message });
  }
};
