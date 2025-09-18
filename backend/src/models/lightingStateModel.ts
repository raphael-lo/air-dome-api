import db from '../services/databaseService';
import { LightingState } from '../models/lightingState'; // Assuming LightingState interface is defined here or in types.ts

export const getLightingStateFromDb = async (siteId: string): Promise<LightingState> => {
  let { rows } = await db.query('SELECT * FROM lighting_state WHERE site_id = $1 LIMIT 1', [siteId]);
  if (rows.length === 0) {
    // Initialize if not found
    const defaultState = { lights_on: false, brightness: 0 };
    const insertResult = await db.query('INSERT INTO lighting_state (site_id, lights_on, brightness) VALUES ($1, $2, $3) RETURNING *', [siteId, defaultState.lights_on, defaultState.brightness]);
    rows = insertResult.rows;
  }
  return rows[0];
};

export const updateLightingStateInDb = async (siteId: string, lights_on?: boolean, brightness?: number): Promise<LightingState> => {
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

  const updateQuery = `UPDATE lighting_state SET ${fields.join(', ')} WHERE site_id = $${paramIndex} RETURNING *`;

  params.push(siteId);

  const { rows } = await db.query(updateQuery, params);
  return rows[0];
};