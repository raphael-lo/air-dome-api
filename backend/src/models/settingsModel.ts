import db from '../services/databaseService';

export interface Setting {
  key: string;
  value: string;
}

export const getAllSettings = async (): Promise<Setting[]> => {
  const { rows } = await db.query('SELECT * FROM settings');
  return rows;
};

export const updateSetting = async (key: string, value: string): Promise<Setting> => {
  const { rows } = await db.query(
    'INSERT INTO settings (key, value) VALUES ($1, $2) ON CONFLICT (key) DO UPDATE SET value = $2 RETURNING *',
    [key, value]
  );
  return rows[0];
};
