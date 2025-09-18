import { Router } from 'express';
import { getLightingState, updateLightingState } from '../controllers/lightingController';

import { authenticateToken, authorizeSiteAccess } from '../middleware/auth';

const router = Router();

router.get('/lighting-state/:siteId', authenticateToken, authorizeSiteAccess, getLightingState);
router.put('/lighting-state/:siteId', authenticateToken, authorizeSiteAccess, updateLightingState);

export default router;
