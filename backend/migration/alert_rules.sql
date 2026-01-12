-- Create the alert_rules table
CREATE TABLE IF NOT EXISTS alert_rules (
    id SERIAL PRIMARY KEY,
    site_id TEXT NOT NULL,
    metric_id INTEGER NOT NULL REFERENCES metrics(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    operator TEXT CHECK(operator IN ('>', '<', '=', '>=', '<=')),
    threshold REAL NOT NULL,
    severity TEXT CHECK(severity IN ('critical', 'high', 'medium', 'low', 'info')),
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for faster lookups during MQTT processing
CREATE INDEX IF NOT EXISTS idx_alert_rules_site_metric ON alert_rules(site_id, metric_id);

-- Migration: Convert existing alert_thresholds to alert_rules
-- Warning: min_warning -> Low, max_warning -> Low, min_alert -> High, max_alert -> High
-- 1. Min Warning (<)
INSERT INTO alert_rules (site_id, metric_id, name, operator, threshold, severity, active)
SELECT site_id, metric_id, 'Low Warning', '<', min_warning, 'low', TRUE
FROM alert_thresholds
WHERE min_warning IS NOT NULL;

-- 2. Max Warning (>)
INSERT INTO alert_rules (site_id, metric_id, name, operator, threshold, severity, active)
SELECT site_id, metric_id, 'High Warning', '>', max_warning, 'low', TRUE
FROM alert_thresholds
WHERE max_warning IS NOT NULL;

-- 3. Min Alert (<)
INSERT INTO alert_rules (site_id, metric_id, name, operator, threshold, severity, active)
SELECT site_id, metric_id, 'Low Critical', '<', min_alert, 'high', TRUE
FROM alert_thresholds
WHERE min_alert IS NOT NULL;

-- 4. Max Alert (>)
INSERT INTO alert_rules (site_id, metric_id, name, operator, threshold, severity, active)
SELECT site_id, metric_id, 'High Critical', '>', max_alert, 'high', TRUE
FROM alert_thresholds
WHERE max_alert IS NOT NULL;
