import { Router } from 'express';
import { createMetric, getMetrics, updateMetric, deleteMetric } from '../controllers/metricController';
import { authenticateToken, authorizeRole, authorizeSiteAccess } from '../middleware/auth';

const router = Router();

router.post('/metrics/:siteId', authenticateToken, authorizeRole(['Admin']), authorizeSiteAccess, createMetric);
router.get('/metrics/:siteId', authenticateToken, authorizeSiteAccess, getMetrics);
router.put('/metrics/:siteId/:id', authenticateToken, authorizeRole(['Admin']), authorizeSiteAccess, updateMetric);
router.delete('/metrics/:siteId/:id', authenticateToken, authorizeRole(['Admin']), authorizeSiteAccess, deleteMetric);

export default router;