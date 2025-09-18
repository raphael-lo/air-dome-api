import { Router } from 'express';
import { getFanSets, updateFanSet } from '../controllers/fanController';

import { authenticateToken, authorizeSiteAccess } from '../middleware/auth';

const router = Router();

router.get('/fan-sets/:siteId', authenticateToken, authorizeSiteAccess, getFanSets);
router.put('/fan-sets/:siteId/:id', authenticateToken, authorizeSiteAccess, updateFanSet);

export default router;
