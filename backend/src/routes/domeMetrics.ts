import { Router } from 'express';
import { getDomeMetricsStructure } from '../controllers/domeMetricsController';
import { authenticateToken } from '../middleware/auth';

import { authorizeSiteAccess } from '../middleware/auth';

const router = Router();

router.get('/dome-metrics-structure/:siteId', authenticateToken, authorizeSiteAccess, getDomeMetricsStructure);

export default router;
