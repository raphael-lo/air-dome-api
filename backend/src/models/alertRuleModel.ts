import db from '../services/databaseService';
import { AlertRule, AlertOperator, AlertSeverity } from '../types';

export const getAlertRules = async (siteId: string): Promise<AlertRule[]> => {
    const query = `
    SELECT ar.*, m.display_name as metric_display_name, m.display_name_tc as metric_display_name_tc, m.mqtt_param as metric_mqtt_param
    FROM alert_rules ar
    JOIN metrics m ON ar.metric_id = m.id
    WHERE ar.site_id = $1
    ORDER BY ar.created_at DESC
  `;
    const { rows } = await db.query(query, [siteId]);
    return rows as AlertRule[];
};

export const createAlertRule = async (
    siteId: string,
    metric_id: number,
    name: string,
    operator: AlertOperator,
    threshold: number,
    severity: AlertSeverity,
    active: boolean
): Promise<AlertRule> => {
    const query = `
    INSERT INTO alert_rules (site_id, metric_id, name, operator, threshold, severity, active)
    VALUES ($1, $2, $3, $4, $5, $6, $7)
    RETURNING *
  `;
    const params = [siteId, metric_id, name, operator, threshold, severity, active];
    const { rows } = await db.query(query, params);
    return rows[0] as AlertRule;
};

export const updateAlertRule = async (
    siteId: string,
    id: number,
    ruleData: Partial<AlertRule>
): Promise<AlertRule | null> => {
    // Dynamic update query builder could be used here, but for now specific fields are fine or we can do a full update
    // Let's assume full update for simplicity or critical fields
    const { name, operator, threshold, severity, active, metric_id } = ruleData;

    const query = `
        UPDATE alert_rules SET
            name = COALESCE($1, name),
            operator = COALESCE($2, operator),
            threshold = COALESCE($3, threshold),
            severity = COALESCE($4, severity),
            active = COALESCE($5, active),
            metric_id = COALESCE($6, metric_id),
            updated_at = NOW()
        WHERE id = $7 AND site_id = $8
        RETURNING *
    `;
    const params = [name, operator, threshold, severity, active, metric_id, id, siteId];
    const { rows } = await db.query(query, params);
    return rows[0] || null;

};

export const deleteAlertRule = async (siteId: string, id: number): Promise<boolean> => {
    const query = 'DELETE FROM alert_rules WHERE id = $1 AND site_id = $2';
    const { rowCount } = await db.query(query, [id, siteId]);
    return (rowCount || 0) > 0;
};
