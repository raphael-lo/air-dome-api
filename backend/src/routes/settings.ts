import express from 'express';
import * as settingsController from '../controllers/settingsController';
import { isAdmin } from '../middleware/auth'; // Assuming you have an isAdmin middleware

const router = express.Router();

// GET all settings (accessible to all authenticated users)
router.get('/', settingsController.getAllSettings);

// POST to update settings (restricted to admins)
router.post('/', isAdmin, settingsController.updateSettings);

export default router;
