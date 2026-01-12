-- Fix sequence sync issue if IDs were inserted manually
SELECT setval('metrics_id_seq', (SELECT MAX(id) FROM metrics));

-- Insert derived virtual metric for Pressure Difference
-- We use a placeholder device_id 'virtual-derived' and a special mqtt_param
INSERT INTO metrics (site_id, topic, device_param, device_id, mqtt_param, display_name, display_name_tc, unit, source, icon) 
VALUES 
((SELECT id FROM sites LIMIT 1), 'air-dome/virtual', 'virtual_id', 'virtual-derived', 'derived_pressure_diff', 'Pressure Difference (Int - Ext)', '壓力差 (內 - 外)', 'Pa', 'air-dome', 'PressureIcon')
ON CONFLICT (topic, device_id, mqtt_param) DO NOTHING;
