import { Router } from 'express';
import { getAlerts, acknowledgeAlert } from '../controllers/alertController';

import { authenticateToken, authorizeSiteAccess } from '../middleware/auth';

const router = Router();

router.get('/alerts', authenticateToken, authorizeSiteAccess, getAlerts);
router.post('/:siteId/alerts/:alertId/acknowledge', authenticateToken, authorizeSiteAccess, acknowledgeAlert);

export default router;
