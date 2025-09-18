import { Request, Response } from 'express';
import * as metricModel from '../models/metric';

export const createMetric = async (req: Request, res: Response) => {
    const { siteId } = req.params;
    try {
        const metric = await metricModel.createMetric({ ...req.body, site_id: siteId });
        res.status(201).json(metric);
    } catch (error: any) {
        console.error("Error creating metric:", error);
        res.status(500).json({ message: 'Error creating metric', error: error.message });
    }
};

export const getMetrics = async (req: Request, res: Response) => {
    const { siteId } = req.params;
    try {
        const metrics = await metricModel.getMetrics(siteId);
        res.json(metrics);
    } catch (error: any) {
        console.error("Error fetching metrics:", error);
        res.status(500).json({ message: 'Error fetching metrics', error: error.message });
    }
};

export const updateMetric = async (req: Request, res: Response) => {
    const { siteId, id } = req.params;
    try {
        const metric = await metricModel.updateMetric(Number(id), { ...req.body, site_id: siteId });
        res.json(metric);
    } catch (error: any) {
        console.error("Error updating metric:", error);
        res.status(500).json({ message: 'Error updating metric', error: error.message });
    }
};

export const deleteMetric = async (req: Request, res: Response) => {
    const { siteId, id } = req.params;
    try {
        await metricModel.deleteMetric(Number(id), siteId);
        res.status(204).send();
    } catch (error: any) {
        console.error("Error deleting metric:", error);
        res.status(500).json({ message: 'Error deleting metric', error: error.message });
    }
};