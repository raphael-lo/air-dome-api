-- Data Migration Script

-- 1. Create a default site
ALTER TABLE sites ADD COLUMN name_tc TEXT;
INSERT INTO sites (id, name, name_tc) VALUES ('default_site', 'Default Site', '預設站點') ON CONFLICT (id) DO NOTHING;

-- 2. Update existing tables with the default site_id
UPDATE metrics SET site_id = 'default_site' WHERE site_id IS NULL;
UPDATE metric_groups SET site_id = 'default_site' WHERE site_id IS NULL;
UPDATE sections SET site_id = 'default_site' WHERE site_id IS NULL;
UPDATE section_items SET site_id = 'default_site' WHERE site_id IS NULL;
UPDATE fan_sets SET site_id = 'default_site' WHERE site_id IS NULL;
UPDATE lighting_state SET site_id = 'default_site' WHERE site_id IS NULL;
UPDATE alerts SET site_id = 'default_site' WHERE site_id IS NULL;
UPDATE alert_thresholds SET site_id = 'default_site' WHERE site_id IS NULL;

-- 3. Assign all existing users to the default site
INSERT INTO user_sites (user_id, site_id)
SELECT id, 'default_site' FROM users
ON CONFLICT (user_id, site_id) DO NOTHING;
