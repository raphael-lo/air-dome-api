import db from '../src/services/databaseService';

const migrate = async () => {
  const client = await db.getClient();
  try {
    await client.query('BEGIN');

    // 1. Create a default site
    const defaultSiteId = 'default_site';
    const defaultSiteName = 'Default Site';
    const defaultSiteNameTc = '預設站點';
    await client.query('INSERT INTO sites (id, name, name_tc) VALUES ($1, $2, $3) ON CONFLICT (id) DO NOTHING', [defaultSiteId, defaultSiteName, defaultSiteNameTc]);

    // 2. Update existing tables with the default site_id
    const tablesToUpdate = ['metrics', 'metric_groups', 'sections', 'section_items', 'fan_sets', 'lighting_state', 'alerts', 'alert_thresholds'];
    for (const table of tablesToUpdate) {
      await client.query(`UPDATE ${table} SET site_id = $1 WHERE site_id IS NULL`, [defaultSiteId]);
    }

    // 3. Assign all existing users to the default site
    const { rows: users } = await client.query('SELECT id FROM users');
    for (const user of users) {
      await client.query('INSERT INTO user_sites (user_id, site_id) VALUES ($1, $2) ON CONFLICT DO NOTHING', [user.id, defaultSiteId]);
    }

    await client.query('COMMIT');
    console.log('Data migration successful.');
  } catch (e) {
    await client.query('ROLLBACK');
    console.error('Data migration failed:', e);
  } finally {
    client.release();
  }
};

migrate();
