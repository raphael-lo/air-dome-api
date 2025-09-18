CREATE TABLE IF NOT EXISTS sites (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  name_tc TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  username TEXT UNIQUE,
  password TEXT,
  role TEXT DEFAULT 'Operator',
  status TEXT DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_sites (
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  site_id TEXT REFERENCES sites(id) ON DELETE CASCADE,
  PRIMARY KEY (user_id, site_id)
);

CREATE TABLE IF NOT EXISTS metrics (
  id SERIAL PRIMARY KEY,
  site_id TEXT REFERENCES sites(id),
  topic TEXT,
  device_param TEXT,
  device_id TEXT,
  mqtt_param TEXT NOT NULL,
  display_name TEXT NOT NULL,
  display_name_tc TEXT,
  icon TEXT,
  unit TEXT,
  UNIQUE (topic, device_id, mqtt_param)
);

CREATE TABLE IF NOT EXISTS metric_groups (
  id SERIAL PRIMARY KEY,
  site_id TEXT REFERENCES sites(id),
  name TEXT,
  name_tc TEXT,
  icon TEXT,
  metric1_id INTEGER REFERENCES metrics(id),
  metric1_display_name TEXT,
  metric1_display_name_tc TEXT,
  metric2_id INTEGER REFERENCES metrics(id),
  metric2_display_name TEXT,
  metric2_display_name_tc TEXT
);

CREATE TABLE IF NOT EXISTS sections (
  id SERIAL PRIMARY KEY,
  site_id TEXT REFERENCES sites(id),
  name TEXT NOT NULL,
  name_tc TEXT,
  item_order INTEGER
);

CREATE TABLE IF NOT EXISTS section_items (
  id SERIAL PRIMARY KEY,
  site_id TEXT REFERENCES sites(id),
  section_id INTEGER NOT NULL REFERENCES sections(id) ON DELETE CASCADE,
  item_id INTEGER NOT NULL,
  item_type TEXT NOT NULL,
  item_order INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS alerts (
  id TEXT PRIMARY KEY,
  site_id TEXT REFERENCES sites(id),
  parameter_key TEXT,
  message_key TEXT,
  message_params TEXT,
  severity TEXT,
  timestamp TEXT,
  status TEXT
);

CREATE TABLE IF NOT EXISTS fan_sets (
  id TEXT PRIMARY KEY,
  site_id TEXT REFERENCES sites(id),
  name TEXT,
  status TEXT,
  mode TEXT,
  inflow INTEGER,
  outflow INTEGER
);

CREATE TABLE IF NOT EXISTS lighting_state (
  id SERIAL PRIMARY KEY,
  site_id TEXT REFERENCES sites(id),
  lights_on BOOLEAN,
  brightness INTEGER
);

CREATE TABLE IF NOT EXISTS alert_thresholds (
  id TEXT PRIMARY KEY,
  site_id TEXT REFERENCES sites(id),
  metric_id INTEGER UNIQUE REFERENCES metrics(id) ON DELETE CASCADE,
  min_warning REAL,
  max_warning REAL,
  min_alert REAL,
  max_alert REAL
);

COMMIT;