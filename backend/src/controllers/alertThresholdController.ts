import { Request, Response } from 'express';
import { getAlertThresholdsFromDb, createAlertThresholdInDb, updateAlertThresholdInDb, deleteAlertThresholdInDb } from '../models/alertThresholdModel'; // Import from new model
import { mqttClient } from '../services/mqttService';

export const getAlertThresholds = async (req: Request, res: Response) => {
  const { siteId } = req.params;
  try {
    const thresholds = await getAlertThresholdsFromDb(siteId); // Call model function
    res.json(thresholds);
  } catch (err: any) {
    console.error("Error in getAlertThresholds:", err);
    res.status(500).json({ message: 'Error getting alert thresholds', error: err.message });
  }
};

export const createAlertThreshold = async (req: Request, res: Response) => {
  const { siteId } = req.params;
  const { metric_id, min_warning, max_warning, min_alert, max_alert } = req.body;

  try {
    const newThreshold = await createAlertThresholdInDb(siteId, metric_id, min_warning, max_warning, min_alert, max_alert); // Call model function
    res.status(201).json(newThreshold);
    mqttClient.publish('air-dome/config/update', JSON.stringify({ type: 'thresholds' }));
  } catch (err: any) {
    console.error("Error in createAlertThreshold:", err);
    res.status(500).json({ message: 'Error creating or updating alert threshold', error: err.message });
  }
};

export const updateAlertThreshold = async (req: Request, res: Response) => {
  const { siteId, id: thresholdId } = req.params;
  const { metric_id, min_warning, max_warning, min_alert, max_alert } = req.body;

  try {
    const updatedThreshold = await updateAlertThresholdInDb(siteId, thresholdId, metric_id, min_warning, max_warning, min_alert, max_alert); // Call model function
    if (!updatedThreshold) {
      return res.status(404).json({ message: 'Alert threshold not found' });
    }
    res.status(200).json(updatedThreshold);
    mqttClient.publish('air-dome/config/update', JSON.stringify({ type: 'thresholds' }));
  } catch (err: any) {
    console.error("Error in updateAlertThreshold:", err);
    res.status(500).json({ message: 'Error updating alert threshold', error: err.message });
  }
};

export const deleteAlertThreshold = async (req: Request, res: Response) => {
  const { siteId, id: thresholdId } = req.params;
  try {
    const rowCount = await deleteAlertThresholdInDb(siteId, thresholdId); // Call model function
    if (rowCount === 0) {
      return res.status(404).json({ message: 'Alert threshold not found' });
    }
    res.status(200).json({ message: 'Alert threshold deleted successfully' });
    mqttClient.publish('air-dome/config/update', JSON.stringify({ type: 'thresholds' }));
  } catch (err: any) {
    console.error("Error in deleteAlertThreshold:", err);
    res.status(500).json({ message: 'Error deleting alert threshold', error: err.message });
  }
};

export const reloadConfig = (req: Request, res: Response) => {
  try {
    mqttClient.publish('air-dome/config/reload', JSON.stringify({})); // Publish empty JSON object to trigger reload
    res.status(200).json({ message: 'Config reload triggered' });
  } catch (error) {
    console.error('Error triggering config reload:', error);
    res.status(500).json({ message: 'Failed to trigger config reload' });
  }
};