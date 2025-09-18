import { Request, Response } from 'express';
import * as sectionModel from '../models/section';

export const createSection = async (req: Request, res: Response) => {
    const { siteId } = req.params;
    try {
        const section = await sectionModel.createSection({ ...req.body, site_id: siteId });
        res.status(201).json(section);
    } catch (error: any) {
        console.error("Error in controller:", error);
        res.status(500).json({ message: 'Error creating section', error: error.message });
    }
};

export const getSections = async (req: Request, res: Response) => {
    const { siteId } = req.params;
    try {
        const sections = await sectionModel.getSections(siteId);
        res.json(sections);
    } catch (error: any) {
        console.error("Error in controller:", error);
        res.status(500).json({ message: 'Error fetching sections', error: error.message });
    }
};

export const updateSection = async (req: Request, res: Response) => {
    const { siteId, id } = req.params;
    try {
        const section = await sectionModel.updateSection(Number(id), { ...req.body, site_id: siteId });
        res.json(section);
    } catch (error: any) {
        console.error("Error in controller:", error);
        res.status(500).json({ message: 'Error updating section', error: error.message });
    }
};

export const deleteSection = async (req: Request, res: Response) => {
    const { siteId, id } = req.params;
    try {
        await sectionModel.deleteSection(Number(id), siteId);
        res.status(204).send();
    } catch (error: any) {
        console.error("Error in controller:", error);
        res.status(500).json({ message: 'Error deleting section', error: error.message });
    }
};

export const getSectionItems = async (req: Request, res: Response) => {
    const { siteId, id } = req.params;
    try {
        const items = await sectionModel.getSectionItems(Number(id), siteId);
        res.json(items);
    } catch (error: any) {
        console.error("Error in controller:", error);
        res.status(500).json({ message: 'Error fetching section items', error: error.message });
    }
};

export const addSectionItem = async (req: Request, res: Response) => {
    const { siteId, id } = req.params;
    try {
        const sectionId = Number(id);
        const { item_id, item_type, item_order } = req.body;
        const newItem = { section_id: sectionId, item_id, item_type, item_order, site_id: siteId };
        const item = await sectionModel.addSectionItem(newItem);
        res.status(201).json(item);
    } catch (error: any) {
        console.error("Error in controller:", error);
        res.status(500).json({ message: 'Error adding section item', error: error.message });
    }
};

export const removeSectionItem = async (req: Request, res: Response) => {
    const { siteId, itemId } = req.params;
    try {
        await sectionModel.removeSectionItem(Number(itemId), siteId);
        res.status(204).send();
    } catch (error: any) {
        console.error("Error in controller:", error);
        res.status(500).json({ message: 'Error removing section item', error: error.message });
    }
};

export const updateSectionItemOrder = async (req: Request, res: Response) => {
    const { siteId } = req.params;
    try {
        await sectionModel.updateSectionItemOrder(req.body, siteId);
        res.status(204).send();
    } catch (error: any) {
        console.error("Error in controller:", error);
        res.status(500).json({ message: 'Error updating section item order', error: error.message });
    }
};

export const updateSectionOrder = async (req: Request, res: Response) => {
    const { siteId } = req.params;
    try {
        await sectionModel.updateSectionOrder(req.body, siteId);
        res.status(204).send();
    } catch (error: any) {
        console.error("Error in controller:", error);
        res.status(500).json({ message: 'Error updating section order', error: error.message });
    }
};
