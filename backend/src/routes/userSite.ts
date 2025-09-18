
import { Router } from 'express';
import { assignSiteToUser, unassignSiteFromUser, getSitesForUser } from '../controllers/userSiteController';
import { authenticateToken, authorizeRole } from '../middleware/auth';

const router = Router();

router.get('/users/:userId/sites', authenticateToken, getSitesForUser);
router.post('/users/:userId/sites/:siteId', authenticateToken, authorizeRole(['Admin']), assignSiteToUser);
router.delete('/users/:userId/sites/:siteId', authenticateToken, authorizeRole(['Admin']), unassignSiteFromUser);

export default router;
