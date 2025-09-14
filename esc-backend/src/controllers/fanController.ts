import { Request, Response } from 'express';
import db from '../services/databaseService';

export const getFanSets = async (req: Request, res: Response) => {
  try {
    const { rows } = await db.query('SELECT * FROM fan_sets', []);
    res.json(rows);
  } catch (err: any) {
    res.status(500).json({ message: 'Error fetching fan sets', error: err.message });
  }
};

export const updateFanSet = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { status, mode, inflow, outflow } = req.body;

  if (status === undefined && mode === undefined && inflow === undefined && outflow === undefined) {
    return res.status(400).json({ message: 'No fields to update' });
  }

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

  try {
    const { rows, rowCount } = await db.query(updateQuery, params);
    if (rowCount === 0) {
      res.status(404).json({ message: 'Fan set not found' });
    } else {
      res.json(rows[0]);
    }
  } catch (err: any) {
    res.status(500).json({ message: 'Error updating fan set', error: err.message });
  }
};