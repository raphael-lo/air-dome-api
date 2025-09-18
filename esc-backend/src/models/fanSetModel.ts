import db from '../services/databaseService';
import { FanSet } from '../models/fanSet'; // Assuming FanSet interface is defined here or in types.ts

export const getFanSetsFromDb = async (): Promise<FanSet[]> => {
  const { rows } = await db.query('SELECT * FROM fan_sets', []);
  return rows;
};

export const updateFanSetInDb = async (id: string, status?: string, mode?: string, inflow?: number, outflow?: number): Promise<FanSet | null> => {
  const fields: string[] = [];
  const params: any[] = [];
  let paramIndex = 1;

  if (status !== undefined) {
    fields.push(`status = $${paramIndex++}`);
    params.push(status);
  }

  if (mode !== undefined) {
    fields.push(`mode = $${paramIndex++}`);
    params.push(mode);
  }

  if (inflow !== undefined) {
    fields.push(`inflow = $${paramIndex++}`);
    params.push(inflow);
  }

  if (outflow !== undefined) {
    fields.push(`outflow = $${paramIndex++}`);
    params.push(outflow);
  }

  params.push(id);
  const updateQuery = `UPDATE fan_sets SET ${fields.join(', ')} WHERE id = $${paramIndex} RETURNING *`;

  const { rows, rowCount } = await db.query(updateQuery, params);
  return (rowCount !== null && rowCount > 0) ? rows[0] : null;
};