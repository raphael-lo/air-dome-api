import { Request, Response } from 'express';
import { getFanSetsFromDb, updateFanSetInDb } from '../models/fanSetModel'; // Import from new model

export const getFanSets = async (req: Request, res: Response) => {
  try {
    const fanSets = await getFanSetsFromDb(); // Call model function
    res.json(fanSets);
  } catch (err: any) {
    console.error("Error in getFanSets:", err);
    res.status(500).json({ message: 'Error fetching fan sets', error: err.message });
  }
};

export const updateFanSet = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { status, mode, inflow, outflow } = req.body;

  if (status === undefined && mode === undefined && inflow === undefined && outflow === undefined) {
    return res.status(400).json({ message: 'No fields to update' });
  }

  try {
    const updatedFanSet = await updateFanSetInDb(id, status, mode, inflow, outflow); // Call model function
    if (!updatedFanSet) {
      res.status(404).json({ message: 'Fan set not found' });
    }
  } catch (err: any) {
    console.error("Error in updateFanSet:", err);
    res.status(500).json({ message: 'Error updating fan set', error: err.message });
  }
};
