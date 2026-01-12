import { Request, Response } from 'express';
import * as DerivedMetricModel from '../models/derivedMetricModel';
import { mqttClient } from '../services/mqttService';
import { createMetric } from '../models/metric';

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
        const newMetric = await createMetric({
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
        const success = await DerivedMetricModel.deleteDerivedMetricRule(siteId, Number(id));
        if (!success) {
            return res.status(404).json({ message: 'Derived metric rule not found' });
        }
        // TODO: Should we delete the virtual metric too? 
        // For strictness yes, but for now let's leave it or the user can delete it from Metrics UI.
        // Actually, if we CASCADE delete on the rule -> metric link, deletion is complicated.
        // The foreign key is `target_metric_id` in rule.
        // Let's just delete the rule. The metric becomes an orphan "virtual" metric.
        res.status(204).send();
        mqttClient.publish('air-dome/config/reload', JSON.stringify({ type: 'derived_rules' }));
    } catch (error: any) {
        console.error("Error deleting derived metric rule:", error);
        res.status(500).json({ message: 'Error deleting derived metric rule', error: error.message });
    }
};
