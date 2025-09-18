
CREATE TABLE sites (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE user_sites (
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  site_id TEXT REFERENCES sites(id) ON DELETE CASCADE,
  PRIMARY KEY (user_id, site_id)
);

ALTER TABLE metrics ADD COLUMN site_id TEXT REFERENCES sites(id);
ALTER TABLE metric_groups ADD COLUMN site_id TEXT REFERENCES sites(id);
ALTER TABLE sections ADD COLUMN site_id TEXT REFERENCES sites(id);
ALTER TABLE section_items ADD COLUMN site_id TEXT REFERENCES sites(id);
ALTER TABLE fan_sets ADD COLUMN site_id TEXT REFERENCES sites(id);
ALTER TABLE lighting_state ADD COLUMN site_id TEXT REFERENCES sites(id);
