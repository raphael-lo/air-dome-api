import { Request, Response } from 'express';
import * as AlertRuleModel from '../models/alertRuleModel';
import { mqttClient } from '../services/mqttService';

export const getAlertRules = async (req: Request, res: Response) => {
    const { siteId } = req.params;
    try {
        const rules = await AlertRuleModel.getAlertRules(siteId);
        res.json(rules);
    } catch (error: any) {
        console.error("Error fetching alert rules:", error);
        res.status(500).json({ message: 'Error fetching alert rules', error: error.message });
    }
};

export const createAlertRule = async (req: Request, res: Response) => {
    const { siteId } = req.params;
    const { metric_id, name, operator, threshold, severity, active } = req.body;
    try {
        const rule = await AlertRuleModel.createAlertRule(siteId, metric_id, name, operator, threshold, severity, active);
        res.status(201).json(rule);
        mqttClient.publish('air-dome/config/reload', JSON.stringify({ type: 'rules' }));
    } catch (error: any) {
        console.error("Error creating alert rule:", error);
        res.status(500).json({ message: 'Error creating alert rule', error: error.message });
    }
};

export const updateAlertRule = async (req: Request, res: Response) => {
    const { siteId, id } = req.params;
    try {
        const rule = await AlertRuleModel.updateAlertRule(siteId, Number(id), req.body);
        if (!rule) {
            return res.status(404).json({ message: 'Alert rule not found' });
        }
        res.json(rule);
        mqttClient.publish('air-dome/config/reload', JSON.stringify({ type: 'rules' }));
    } catch (error: any) {
        console.error("Error updating alert rule:", error);
        res.status(500).json({ message: 'Error updating alert rule', error: error.message });
    }
};

export const deleteAlertRule = async (req: Request, res: Response) => {
    const { siteId, id } = req.params;
    try {
        const success = await AlertRuleModel.deleteAlertRule(siteId, Number(id));
        if (!success) {
            return res.status(404).json({ message: 'Alert rule not found' });
        }
        res.status(204).send();
        mqttClient.publish('air-dome/config/reload', JSON.stringify({ type: 'rules' }));
    } catch (error: any) {
        console.error("Error deleting alert rule:", error);
        res.status(500).json({ message: 'Error deleting alert rule', error: error.message });
    }
};
