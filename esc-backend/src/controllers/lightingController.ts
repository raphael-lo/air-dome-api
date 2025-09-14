import { Request, Response } from 'express';
import db from '../services/databaseService';

export const getLightingState = async (req: Request, res: Response) => {
  try {
    let { rows } = await db.query('SELECT * FROM lighting_state LIMIT 1', []);
    if (rows.length === 0) {
      // Initialize if not found
      const defaultState = { lights_on: false, brightness: 0 };
      const insertResult = await db.query('INSERT INTO lighting_state (lights_on, brightness) VALUES ($1, $2) RETURNING *', [defaultState.lights_on, defaultState.brightness]);
      rows = insertResult.rows;
    }
    res.json(rows[0]);
  } catch (err: any) {
    res.status(500).json({ message: 'Error fetching lighting state', error: err.message });
  }
};

export const updateLightingState = async (req: Request, res: Response) => {
  const { lights_on, brightness } = req.body;

  if (lights_on === undefined && brightness === undefined) {
    return res.status(400).json({ message: 'No fields to update' });
  }

  const fields: string[] = [];
  const params: any[] = [];
  let paramIndex = 1;

  if (lights_on !== undefined) {
    fields.push(`lights_on = $${paramIndex++}`);
    params.push(lights_on);
  }

  if (brightness !== undefined) {
    fields.push(`brightness = $${paramIndex++}`);
    params.push(brightness);
  }

  const updateQuery = `UPDATE lighting_state SET ${fields.join(', ')} RETURNING *`;

  try {
    const { rows } = await db.query(updateQuery, params);
    res.json(rows[0]);
  } catch (err: any) {
    res.status(500).json({ message: 'Error updating lighting state', error: err.message });
  }
};