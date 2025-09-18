import { Router } from 'express';
import { createSection, getSections, updateSection, deleteSection, getSectionItems, addSectionItem, removeSectionItem, updateSectionItemOrder, updateSectionOrder } from '../controllers/sectionController';
import { authenticateToken, authorizeRole, authorizeSiteAccess } from '../middleware/auth';

const router = Router();

router.post('/sections/:siteId', authenticateToken, authorizeRole(['Admin']), authorizeSiteAccess, createSection);
router.get('/sections/:siteId', authenticateToken, authorizeRole(['Admin']), authorizeSiteAccess, getSections);
router.put('/sections/:siteId/order', authenticateToken, authorizeRole(['Admin']), authorizeSiteAccess, updateSectionOrder);
router.put('/sections/:siteId/:id', authenticateToken, authorizeRole(['Admin']), authorizeSiteAccess, updateSection);
router.delete('/sections/:siteId/:id', authenticateToken, authorizeRole(['Admin']), authorizeSiteAccess, deleteSection);

router.get('/sections/:siteId/:id/items', authenticateToken, authorizeRole(['Admin']), authorizeSiteAccess, getSectionItems);
router.post('/sections/:siteId/:id/items', authenticateToken, authorizeRole(['Admin']), authorizeSiteAccess, addSectionItem);
router.delete('/sections/:siteId/:id/items/:itemId', authenticateToken, authorizeRole(['Admin']), authorizeSiteAccess, removeSectionItem);
router.put('/sections/:siteId/:id/items/order', authenticateToken, authorizeRole(['Admin']), authorizeSiteAccess, updateSectionItemOrder);

export default router;