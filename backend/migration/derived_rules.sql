-- Create table for storing derived metric formulas
CREATE TABLE IF NOT EXISTS derived_metric_rules (
    id SERIAL PRIMARY KEY,
    site_id TEXT NOT NULL,
    target_metric_id INTEGER UNIQUE REFERENCES metrics(id) ON DELETE CASCADE, -- The virtual metric triggers
    metric1_id INTEGER REFERENCES metrics(id),
    metric2_id INTEGER REFERENCES metrics(id),
    operator TEXT CHECK(operator IN ('ADD', 'SUBTRACT', 'MULTIPLY', 'DIVIDE')),
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for faster lookups during processing
CREATE INDEX IF NOT EXISTS idx_derived_rules_metrics ON derived_metric_rules(metric1_id, metric2_id);

-- Migration of the hardcoded pressure diff (optional, but good practice)
-- First, ensure the 'derived_pressure_diff' metric exists (created in previous step)
-- We won't insert a rule yet because we need the IDs, better to let user create it via UI or generic seed.
-- But for continuity, if we knew the IDs we could insert it.
