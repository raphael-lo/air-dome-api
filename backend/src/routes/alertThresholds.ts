import { Router } from 'express';
import { getAlertThresholds, createAlertThreshold, updateAlertThreshold, deleteAlertThreshold, reloadConfig } from '../controllers/alertThresholdController';
import { authenticateToken, authorizeRole, authorizeSiteAccess } from '../middleware/auth';

const router = Router();

router.get('/alert-thresholds/:siteId', authenticateToken, authorizeSiteAccess, getAlertThresholds);
router.post('/alert-thresholds/:siteId', authenticateToken, authorizeRole(['Admin']), authorizeSiteAccess, createAlertThreshold);
router.put('/alert-thresholds/:siteId/:id', authenticateToken, authorizeRole(['Admin']), authorizeSiteAccess, updateAlertThreshold);
router.delete('/alert-thresholds/:siteId/:id', authenticateToken, authorizeRole(['Admin']), authorizeSiteAccess, deleteAlertThreshold);
router.post('/config/reload', authenticateToken, reloadConfig); // New endpoint for config reload

export default router;
