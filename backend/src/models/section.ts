import db from '../services/databaseService';

export interface Section {
  id?: number;
  site_id: string;
  name: string;
  name_tc?: string;
  item_order: number;
}

export interface SectionItem {
  id?: number;
  site_id: string;
  section_id: number;
  item_id: number;
  item_type: 'metric' | 'group';
  item_order: number;
}

export const getSections = async (siteId: string): Promise<Section[]> => {
  const { rows } = await db.query('SELECT *, name_tc FROM sections WHERE site_id = $1 ORDER BY item_order', [siteId]);
  return rows.map(row => ({ ...row, item_order: row.item_order ?? 0 }));
};

export const createSection = async (section: { site_id: string, name: string, name_tc?: string, item_order: number }): Promise<Section> => {
  const { rows } = await db.query('INSERT INTO sections (site_id, name, name_tc, item_order) VALUES ($1, $2, $3, $4) RETURNING *', [section.site_id, section.name, section.name_tc, section.item_order]);
  return rows[0];
};

export const updateSection = async (id: number, section: { site_id: string, name: string, name_tc?: string, item_order: number }): Promise<Section> => {
  const { rows } = await db.query('UPDATE sections SET name = $1, name_tc = $2, item_order = $3 WHERE id = $4 AND site_id = $5 RETURNING *', [section.name, section.name_tc, section.item_order, id, section.site_id]);
  return rows[0];
};

export const deleteSection = async (id: number, siteId: string): Promise<void> => {
  await db.query('DELETE FROM sections WHERE id = $1 AND site_id = $2', [id, siteId]);
};

export const getSectionItems = async (sectionId: number, siteId: string): Promise<SectionItem[]> => {
  const { rows } = await db.query('SELECT * FROM section_items WHERE section_id = $1 AND site_id = $2 ORDER BY item_order', [sectionId, siteId]);
  return rows;
};

export const addSectionItem = async (item: Omit<SectionItem, 'id'>): Promise<SectionItem> => {
  const { rows } = await db.query('INSERT INTO section_items (site_id, section_id, item_id, item_type, item_order) VALUES ($1, $2, $3, $4, $5) ON CONFLICT DO NOTHING RETURNING *', 
  [item.site_id, item.section_id, item.item_id, item.item_type, item.item_order]);
  return rows[0];
};

export const removeSectionItem = async (id: number, siteId: string): Promise<void> => {
  await db.query('DELETE FROM section_items WHERE id = $1 AND site_id = $2', [id, siteId]);
};

export const updateSectionItemOrder = async (items: SectionItem[], siteId: string) => {
  if (items.length === 0) return;
  const client = await db.getClient();
  try {
    await client.query('BEGIN');
    for (const item of items) {
      await client.query('UPDATE section_items SET item_order = $1 WHERE id = $2 AND site_id = $3', [item.item_order, item.id, siteId]);
    }
    await client.query('COMMIT');
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
  }
};

export const updateSectionOrder = async (sections: { id: number, item_order: number }[], siteId: string) => {
  if (sections.length === 0) return;
  const client = await db.getClient();
  try {
    await client.query('BEGIN');
    for (const section of sections) {
      await client.query('UPDATE sections SET item_order = $1 WHERE id = $2 AND site_id = $3', [section.item_order, section.id, siteId]);
    }
    await client.query('COMMIT');
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
  }
};
