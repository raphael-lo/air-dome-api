import { Request, Response } from 'express';
import { getLightingStateFromDb, updateLightingStateInDb } from '../models/lightingStateModel'; // Import from new model

export const getLightingState = async (req: Request, res: Response) => {
  const { siteId } = req.params;
  try {
    const lightingState = await getLightingStateFromDb(siteId); // Call model function
    res.json(lightingState);
  } catch (err: any) {
    console.error("Error in getLightingState:", err);
    res.status(500).json({ message: 'Error fetching lighting state', error: err.message });
  }
};

export const updateLightingState = async (req: Request, res: Response) => {
  const { siteId } = req.params;
  const { lights_on, brightness } = req.body;

  if (lights_on === undefined && brightness === undefined) {
    return res.status(400).json({ message: 'No fields to update' });
  }

  try {
    const updatedState = await updateLightingStateInDb(siteId, lights_on, brightness); // Call model function
    res.json(updatedState);
  } catch (err: any) {
    console.error("Error in updateLightingState:", err);
    res.status(500).json({ message: 'Error updating lighting state', error: err.message });
  }
};