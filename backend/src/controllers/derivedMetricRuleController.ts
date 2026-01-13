import { Request, Response } from 'express';
import * as DerivedMetricModel from '../models/derivedMetricModel';
import { mqttClient } from '../services/mqttService';
import * as MetricModel from '../models/metric';

export const getDerivedMetricRules = async (req: Request, res: Response) => {
    const { siteId } = req.params;
    try {
        const rules = await DerivedMetricModel.getDerivedMetricRules(siteId);
        res.json(rules);
    } catch (error: any) {
        console.error("Error fetching derived metric rules:", error);
        res.status(500).json({ message: 'Error fetching derived metric rules', error: error.message });
    }
};

export const createDerivedMetricRule = async (req: Request, res: Response) => {
    const { siteId } = req.params;
    const { name, metric1_id, metric2_id, operator, active } = req.body;

    try {
        // 1. Create the Virtual Metric first
        // We auto-generate the mqtt_param based on name or random
        const mqtt_param = `derived_${name.replace(/\s+/g, '_').toLowerCase()}_${Date.now()}`;
        const newMetric = await MetricModel.createMetric({
            site_id: siteId,
            display_name: name,
            display_name_tc: name, // User can update later
            mqtt_param: mqtt_param,
            device_id: 'virtual-derived',
            // Default icon/unit?
            unit: '',
            source: 'air-dome', // Or 'virtual' if we add that type enum support, sticking to air-dome for compat
            icon: 'Activity', // Default icon
            topic: 'air-dome/virtual'
        });

        // 2. Create the Rule linked to this new metric
        const rule = await DerivedMetricModel.createDerivedMetricRule(
            siteId,
            newMetric.id!,
            metric1_id,
            metric2_id,
            operator,
            active
        );

        res.status(201).json(rule);
        mqttClient.publish('air-dome/config/reload', JSON.stringify({ type: 'derived_rules' }));
    } catch (error: any) {
        console.error("Error creating derived metric rule:", error);
        res.status(500).json({ message: 'Error creating derived metric rule', error: error.message });
    }
};

export const updateDerivedMetricRule = async (req: Request, res: Response) => {
    const { siteId, id } = req.params;
    try {
        const rule = await DerivedMetricModel.updateDerivedMetricRule(siteId, Number(id), req.body);
        if (!rule) {
            return res.status(404).json({ message: 'Derived metric rule not found' });
        }
        res.json(rule);
        mqttClient.publish('air-dome/config/reload', JSON.stringify({ type: 'derived_rules' }));
    } catch (error: any) {
        console.error("Error updating derived metric rule:", error);
        res.status(500).json({ message: 'Error updating derived metric rule', error: error.message });
    }
};

export const deleteDerivedMetricRule = async (req: Request, res: Response) => {
    const { siteId, id } = req.params;
    try {
        // 1. Get the rule first to find the target_metric_id
        const rule = await DerivedMetricModel.getDerivedMetricRuleById(siteId, Number(id));

        if (!rule) {
            return res.status(404).json({ message: 'Derived metric rule not found' });
        }

        // 2. Delete the rule
        const success = await DerivedMetricModel.deleteDerivedMetricRule(siteId, Number(id));

        // 3. Delete the associated virtual metric if rule deletion was successful
        if (success && rule.target_metric_id) {
            try {
                // Determine if we should also delete the metric? Yes, for derived metrics, the metric is virtual and owned by the rule.
                await MetricModel.deleteMetric(rule.target_metric_id, siteId);
            } catch (err) {
                console.error("Failed to delete associated virtual metric:", err);
                // Continue, as the rule is already deleted.
            }
        }

        res.status(204).send();
        mqttClient.publish('air-dome/config/reload', JSON.stringify({ type: 'derived_rules' }));
    } catch (error: any) {
        console.error("Error deleting derived metric rule:", error);
        res.status(500).json({ message: 'Error deleting derived metric rule', error: error.message });
    }
};
