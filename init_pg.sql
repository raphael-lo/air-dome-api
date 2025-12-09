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
  source TEXT DEFAULT 'air-dome',
  channel INTEGER,
  data_type TEXT,
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


-- Seed Data

-- Sites
INSERT INTO sites (id, name, name_tc) VALUES ('site_a', 'Default Site', '預設站點') ON CONFLICT (id) DO NOTHING;

-- Users
INSERT INTO users (username, password, role, status, created_at) 
VALUES ('admin', '$2b$10$wydOzraZ12j.hmkQnTeumOKGxj2eR/I3zjN2JSL0sxDqdiFIfP1WS', 'Admin', 'active', NOW()) 
ON CONFLICT (username) DO NOTHING;

-- User Sites
INSERT INTO user_sites (user_id, site_id) 
VALUES ((SELECT id FROM users WHERE username='admin'), 'site_a') 
ON CONFLICT (user_id, site_id) DO NOTHING;

-- Metrics
INSERT INTO metrics (site_id, topic, device_param, device_id, mqtt_param, display_name, display_name_tc, unit, icon, source) 
VALUES 
('site_a', 'air-dome/data', 'sensor_id', 'sensor-1', 'internalPressure', 'Internal Pressure', '內部壓力', 'Pa', 'PressureIcon', 'air-dome'),
('site_a', 'air-dome/data', 'sensor_id', 'sensor-2', 'externalPressure', 'External Pressure', '外部壓力', 'Pa', 'PressureIcon', 'air-dome'),
('site_a', 'air-dome/data', 'sensor_id', 'sensor-3', 'internalTemperature', 'Internal Temperature', '內部溫度', '°C', 'TempIcon', 'air-dome'),
('site_a', 'air-dome/data', 'sensor_id', 'sensor-4', 'externalTemperature', 'External Temperature', '外部溫度', '°C', 'TempIcon', 'air-dome'),
('site_a', 'air-dome/data', 'sensor_id', 'sensor-21', 'fanSpeed', 'Fan Speed', '風扇速度', 'RPM', 'FanIcon', 'air-dome')
ON CONFLICT (topic, device_id, mqtt_param) DO NOTHING;

-- Metric Groups
INSERT INTO metric_groups (site_id, name, name_tc, icon, metric1_id, metric2_id) 
VALUES 
('site_a', 'Group Pressure', '壓力', 'PressureIcon', 
  (SELECT id FROM metrics WHERE mqtt_param='internalPressure'), 
  (SELECT id FROM metrics WHERE mqtt_param='externalPressure')),
('site_a', 'Group Temperature', '溫度', 'TempIcon', 
  (SELECT id FROM metrics WHERE mqtt_param='internalTemperature'), 
  (SELECT id FROM metrics WHERE mqtt_param='externalTemperature'));

-- Sections
INSERT INTO sections (site_id, name, item_order) 
VALUES 
('site_a', 'Dome Integrity', 0),
('site_a', 'Environment', 1),
('site_a', 'Air Quality', 2),
('site_a', 'Systems Status', 3);

-- Section Items
INSERT INTO section_items (site_id, section_id, item_id, item_type, item_order) 
VALUES 
('site_a', (SELECT id FROM sections WHERE name='Dome Integrity'), (SELECT id FROM metric_groups WHERE name='Group Pressure'), 'group', 0),
('site_a', (SELECT id FROM sections WHERE name='Dome Integrity'), (SELECT id FROM metrics WHERE mqtt_param='fanSpeed'), 'metric', 1),
('site_a', (SELECT id FROM sections WHERE name='Environment'), (SELECT id FROM metric_groups WHERE name='Group Temperature'), 'group', 0);

-- Fan Sets
INSERT INTO fan_sets (id, site_id, name, status, mode, inflow, outflow) 
VALUES 
('fan_set_1', 'site_a', 'Fan Set 1', 'on', 'auto', 75, 60),
('fan_set_2', 'site_a', 'Fan Set 2', 'on', 'manual', 50, 50)
ON CONFLICT (id) DO NOTHING;

-- Lighting State
INSERT INTO lighting_state (site_id, lights_on, brightness) 
VALUES ('site_a', true, 80);

-- Alert Thresholds
INSERT INTO alert_thresholds (id, site_id, metric_id, min_warning, max_warning, min_alert, max_alert)
VALUES
('threshold-internal-pressure', 'site_a', (SELECT id FROM metrics WHERE mqtt_param='internalPressure'), 100, 150, 50, 200),
('threshold-external-temperature', 'site_a', (SELECT id FROM metrics WHERE mqtt_param='externalTemperature'), -5, 35, -10, 40)
ON CONFLICT (id) DO NOTHING;

COMMIT;