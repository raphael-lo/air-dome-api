
import { Router } from 'express';
import { createSite, getSites, getSiteById, updateSite, deleteSite } from '../controllers/siteController';
import { authenticateToken, authorizeRole } from '../middleware/auth';

const router = Router();

router.get('/sites', authenticateToken, getSites);
router.get('/sites/:id', authenticateToken, getSiteById);
router.post('/sites', authenticateToken, authorizeRole(['Admin']), createSite);
router.put('/sites/:id', authenticateToken, authorizeRole(['Admin']), updateSite);
router.delete('/sites/:id', authenticateToken, authorizeRole(['Admin']), deleteSite);

export default router;
