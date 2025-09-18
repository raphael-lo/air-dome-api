
import { Request, Response } from 'express';
import { assignSiteToUserInDb, unassignSiteFromUserInDb, getSitesForUserFromDb } from '../models/userSiteModel';

export const assignSiteToUser = async (req: Request, res: Response) => {
  const { userId, siteId } = req.params;
  try {
    await assignSiteToUserInDb(Number(userId), siteId);
    res.status(201).json({ message: 'Site assigned to user successfully' });
  } catch (err: any) {
    console.error("Error in assignSiteToUser:", err);
    return res.status(500).json({ message: 'Error assigning site to user', error: err.message });
  }
};

export const unassignSiteFromUser = async (req: Request, res: Response) => {
  const { userId, siteId } = req.params;
  try {
    const rowCount = await unassignSiteFromUserInDb(Number(userId), siteId);
    if (rowCount === 0) {
      return res.status(404).json({ message: 'User or site not found, or site not assigned to user' });
    }
    res.status(204).send();
  } catch (err: any) {
    console.error("Error in unassignSiteFromUser:", err);
    return res.status(500).json({ message: 'Error unassigning site from user', error: err.message });
  }
};

export const getSitesForUser = async (req: Request, res: Response) => {
  const { userId } = req.params;
  try {
    const sites = await getSitesForUserFromDb(Number(userId));
    res.json(sites);
  } catch (err: any) {
    console.error("Error in getSitesForUser:", err);
    return res.status(500).json({ message: 'Error fetching sites for user', error: err.message });
  }
};
