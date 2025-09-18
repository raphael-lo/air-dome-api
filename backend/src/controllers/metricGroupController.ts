import { Request, Response } from 'express';
import * as metricGroupModel from '../models/metricGroup';

export const createMetricGroup = async (req: Request, res: Response) => {
    const { siteId } = req.params;
    try {
        const group = await metricGroupModel.createMetricGroup({ ...req.body, site_id: siteId });
        res.status(201).json(group);
    } catch (error: any) {
        console.error("Error in controller:", error);
        res.status(500).json({ message: 'Error creating metric group', error: error.message });
    }
};

export const getMetricGroups = async (req: Request, res: Response) => {
    const { siteId } = req.params;
    try {
        const groups = await metricGroupModel.getMetricGroups(siteId);
        res.json(groups);
    } catch (error: any) {
        console.error("Error in controller:", error);
        res.status(500).json({ message: 'Error fetching metric groups', error: error.message });
    }
};

export const updateMetricGroup = async (req: Request, res: Response) => {
    const { siteId, id } = req.params;
    try {
        const group = await metricGroupModel.updateMetricGroup(Number(id), { ...req.body, site_id: siteId });
        res.json(group);
    } catch (error: any) {
        console.error("Error in controller:", error);
        res.status(500).json({ message: 'Error updating metric group', error: error.message });
    }
};

export const deleteMetricGroup = async (req: Request, res: Response) => {
    const { siteId, id } = req.params;
    try {
        await metricGroupModel.deleteMetricGroup(Number(id), siteId);
        res.status(204).send();
    } catch (error: any) {
        console.error("Error in controller:", error);
        res.status(500).json({ message: 'Error deleting metric group', error: error.message });
    }
};
