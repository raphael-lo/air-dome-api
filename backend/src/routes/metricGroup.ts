import { Router } from 'express';
import { createMetricGroup, getMetricGroups, updateMetricGroup, deleteMetricGroup } from '../controllers/metricGroupController';
import { authenticateToken, authorizeRole, authorizeSiteAccess } from '../middleware/auth';

const router = Router();

router.post('/metric-groups/:siteId', authenticateToken, authorizeRole(['Admin']), authorizeSiteAccess, createMetricGroup);
router.get('/metric-groups/:siteId', authenticateToken, authorizeRole(['Admin']), authorizeSiteAccess, getMetricGroups);
router.put('/metric-groups/:siteId/:id', authenticateToken, authorizeRole(['Admin']), authorizeSiteAccess, updateMetricGroup);
router.delete('/metric-groups/:siteId/:id', authenticateToken, authorizeRole(['Admin']), authorizeSiteAccess, deleteMetricGroup);

export default router;