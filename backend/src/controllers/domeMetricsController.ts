import { Request, Response } from 'express';
import { getDomeMetricsStructureFromDb } from '../models/domeMetricsModel'; // Import from new model

export const getDomeMetricsStructure = async (req: Request, res: Response) => {
  const { siteId } = req.params;
  try {
    const structure = await getDomeMetricsStructureFromDb(siteId); // Call model function
    res.json(structure);
  } catch (err: any) {
    console.error("Error in getDomeMetricsStructure:", err);
    res.status(500).json({ message: 'Error fetching dome metrics structure', error: err.message });
  }
};