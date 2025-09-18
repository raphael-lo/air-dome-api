
import { Request, Response } from 'express';
import { createSiteInDb, getSitesFromDb, getSiteByIdFromDb, updateSiteInDb, deleteSiteInDb } from '../models/siteModel';

export const createSite = async (req: Request, res: Response) => {
  const { id, name, name_tc } = req.body;
  if (!id || !name || !name_tc) {
    return res.status(400).json({ message: 'Site ID, name, and name_tc are required' });
  }
  try {
    const newSite = await createSiteInDb(id, name, name_tc);
    res.status(201).json(newSite);
  } catch (err: any) {
    console.error("Error in createSite:", err);
    return res.status(500).json({ message: 'Error creating site', error: err.message });
  }
};

export const getSites = async (req: Request, res: Response) => {
  try {
    const sites = await getSitesFromDb();
    res.json(sites);
  } catch (err: any) {
    console.error("Error in getSites:", err);
    return res.status(500).json({ message: 'Error fetching sites', error: err.message });
  }
};

export const getSiteById = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const site = await getSiteByIdFromDb(id);
    if (!site) {
      return res.status(404).json({ message: 'Site not found' });
    }
    res.json(site);
  } catch (err: any) {
    console.error("Error in getSiteById:", err);
    return res.status(500).json({ message: 'Error fetching site', error: err.message });
  }
};

export const updateSite = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { name, name_tc } = req.body;
  if (!name || !name_tc) {
    return res.status(400).json({ message: 'Name and name_tc are required' });
  }
  try {
    const updatedSite = await updateSiteInDb(id, name, name_tc);
    if (!updatedSite) {
      return res.status(404).json({ message: 'Site not found' });
    }
    res.json(updatedSite);
  } catch (err: any) {
    console.error('Error in updateSite:', err);
    return res.status(500).json({ message: 'Error updating site', error: err.message });
  }
};

export const deleteSite = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const rowCount = await deleteSiteInDb(id);
    if (rowCount === 0) {
      return res.status(404).json({ message: 'Site not found' });
    }
    res.status(204).send();
  } catch (err: any) {
    console.error("Error in deleteSite:", err);
    return res.status(500).json({ message: 'Error deleting site', error: err.message });
  }
};
