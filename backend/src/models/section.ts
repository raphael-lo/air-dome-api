import db from '../services/databaseService';

export interface Section {
  id?: number;
  name: string;
  name_tc?: string;
  item_order: number;
}

export interface SectionItem {
  id?: number;
  section_id: number;
  item_id: number;
  item_type: 'metric' | 'group';
  item_order: number;
}

export const getSections = async (): Promise<Section[]> => {
  const { rows } = await db.query('SELECT *, name_tc FROM sections ORDER BY item_order', []);
  return rows.map(row => ({ ...row, item_order: row.item_order ?? 0 }));
};

export const createSection = async (section: { name: string, name_tc?: string, item_order: number }): Promise<Section> => {
  const { rows } = await db.query('INSERT INTO sections (name, name_tc, item_order) VALUES ($1, $2, $3) RETURNING *', [section.name, section.name_tc, section.item_order]);
  return rows[0];
};

export const updateSection = async (id: number, section: { name: string, name_tc?: string, item_order: number }): Promise<Section> => {
  const { rows } = await db.query('UPDATE sections SET name = $1, name_tc = $2, item_order = $3 WHERE id = $4 RETURNING *', [section.name, section.name_tc, section.item_order, id]);
  return rows[0];
};

export const deleteSection = async (id: number): Promise<void> => {
  await db.query('DELETE FROM sections WHERE id = $1', [id]);
};

export const getSectionItems = async (sectionId: number): Promise<SectionItem[]> => {
  const { rows } = await db.query('SELECT * FROM section_items WHERE section_id = $1 ORDER BY item_order', [sectionId]);
  return rows;
};

export const addSectionItem = async (item: Omit<SectionItem, 'id'>): Promise<SectionItem> => {
  const { rows } = await db.query('INSERT INTO section_items (section_id, item_id, item_type, item_order) VALUES ($1, $2, $3, $4) ON CONFLICT DO NOTHING RETURNING *', 
  [item.section_id, item.item_id, item.item_type, item.item_order]);
  return rows[0];
};

export const removeSectionItem = async (id: number): Promise<void> => {
  await db.query('DELETE FROM section_items WHERE id = $1', [id]);
};

export const updateSectionItemOrder = async (items: SectionItem[]) => {
  if (items.length === 0) return;
  const client = await db.getClient();
  try {
    await client.query('BEGIN');
    for (const item of items) {
      await client.query('UPDATE section_items SET item_order = $1 WHERE id = $2', [item.item_order, item.id]);
    }
    await client.query('COMMIT');
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
  }
};

export const updateSectionOrder = async (sections: { id: number, item_order: number }[]) => {
  if (sections.length === 0) return;
  const client = await db.getClient();
  try {
    await client.query('BEGIN');
    for (const section of sections) {
      await client.query('UPDATE sections SET item_order = $1 WHERE id = $2', [section.item_order, section.id]);
    }
    await client.query('COMMIT');
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
  }
};