import db from '../services/databaseService';
import { DerivedMetricRule, DerivedMetricOperator } from '../types';

export const getDerivedMetricRules = async (siteId: string): Promise<DerivedMetricRule[]> => {
    const query = `
    SELECT 
        dmr.*, 
        tm.display_name as target_metric_name, 
        m1.display_name as metric1_name, 
        m2.display_name as metric2_name
    FROM derived_metric_rules dmr
    JOIN metrics tm ON dmr.target_metric_id = tm.id
    LEFT JOIN metrics m1 ON dmr.metric1_id = m1.id
    LEFT JOIN metrics m2 ON dmr.metric2_id = m2.id
    WHERE dmr.site_id = $1
    ORDER BY dmr.created_at DESC
  `;
    const { rows } = await db.query(query, [siteId]);
    return rows as DerivedMetricRule[];
};

export const getDerivedMetricRuleById = async (siteId: string, id: number): Promise<DerivedMetricRule | null> => {
    const query = `SELECT * FROM derived_metric_rules WHERE id = $1 AND site_id = $2`;
    const { rows } = await db.query(query, [id, siteId]);
    return rows[0] as DerivedMetricRule || null;
};

export const createDerivedMetricRule = async (
    siteId: string,
    target_metric_id: number,
    metric1_id: number,
    metric2_id: number,
    operator: DerivedMetricOperator,
    active: boolean
): Promise<DerivedMetricRule> => {
    const query = `
    INSERT INTO derived_metric_rules (site_id, target_metric_id, metric1_id, metric2_id, operator, active)
    VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING *
  `;
    const params = [siteId, target_metric_id, metric1_id, metric2_id, operator, active];
    const { rows } = await db.query(query, params);
    return rows[0] as DerivedMetricRule;
};

export const updateDerivedMetricRule = async (
    siteId: string,
    id: number,
    ruleData: Partial<DerivedMetricRule>
): Promise<DerivedMetricRule | null> => {
    const { target_metric_id, metric1_id, metric2_id, operator, active } = ruleData;
    const query = `
        UPDATE derived_metric_rules SET
            target_metric_id = COALESCE($1, target_metric_id),
            metric1_id = COALESCE($2, metric1_id),
            metric2_id = COALESCE($3, metric2_id),
            operator = COALESCE($4, operator),
            active = COALESCE($5, active)
        WHERE id = $6 AND site_id = $7
        RETURNING *
    `;
    const params = [target_metric_id, metric1_id, metric2_id, operator, active, id, siteId];
    const { rows } = await db.query(query, params);
    return rows[0] || null;
}

export const deleteDerivedMetricRule = async (siteId: string, id: number): Promise<boolean> => {
    const query = 'DELETE FROM derived_metric_rules WHERE id = $1 AND site_id = $2';
    const { rowCount } = await db.query(query, [id, siteId]);
    return (rowCount || 0) > 0;
};
