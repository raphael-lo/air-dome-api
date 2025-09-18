
import db from '../services/databaseService';

export const assignSiteToUserInDb = async (userId: number, siteId: string): Promise<void> => {
  await db.query('INSERT INTO user_sites (user_id, site_id) VALUES ($1, $2)', [userId, siteId]);
};

export const unassignSiteFromUserInDb = async (userId: number, siteId: string): Promise<number> => {
  const { rowCount } = await db.query('DELETE FROM user_sites WHERE user_id = $1 AND site_id = $2', [userId, siteId]);
  return rowCount ?? 0;
};

export const getSitesForUserFromDb = async (userId: number): Promise<string[]> => {
  const { rows } = await db.query('SELECT site_id FROM user_sites WHERE user_id = $1', [userId]);
  return rows.map(row => row.site_id);
};
