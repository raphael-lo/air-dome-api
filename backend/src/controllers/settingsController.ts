import { Request, Response } from 'express';
import * as SettingsModel from '../models/settingsModel';

export const getAllSettings = async (req: Request, res: Response) => {
  try {
    const settings = await SettingsModel.getAllSettings();
    // Convert array to a key-value object for easier use on the frontend
    const settingsObj = settings.reduce((acc, setting) => {
      acc[setting.key] = setting.value;
      return acc;
    }, {} as { [key: string]: string });
    res.json(settingsObj);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching settings', error });
  }
};

export const updateSettings = async (req: Request, res: Response) => {
  try {
    const settings: { [key: string]: string } = req.body;
    const updatePromises = Object.entries(settings).map(([key, value]) => {
      return SettingsModel.updateSetting(key, value);
    });

    await Promise.all(updatePromises);

    res.status(200).json({ message: 'Settings updated successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error updating settings', error });
  }
};
