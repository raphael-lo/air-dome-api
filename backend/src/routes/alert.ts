import { Router } from 'express';
import * as AlertController from '../controllers/alertController';
import * as AlertRuleController from '../controllers/alertRuleController'; // Import the new controller
import { authenticateToken, authorizeRole, authorizeSiteAccess } from '../middleware/auth';

const router = Router();

// ... existing alert routes ...
router.get('/alerts/:siteId', authenticateToken, authorizeSiteAccess, AlertController.getAlerts);
router.put('/alerts/:siteId/:id/acknowledge', authenticateToken, authorizeSiteAccess, AlertController.acknowledgeAlert);


// --- New Alert Rule Routes ---
router.get('/alert-rules/:siteId', authenticateToken, authorizeSiteAccess, AlertRuleController.getAlertRules);
router.post('/alert-rules/:siteId', authenticateToken, authorizeRole(['Admin']), authorizeSiteAccess, AlertRuleController.createAlertRule);
router.put('/alert-rules/:siteId/:id', authenticateToken, authorizeRole(['Admin']), authorizeSiteAccess, AlertRuleController.updateAlertRule);
router.delete('/alert-rules/:siteId/:id', authenticateToken, authorizeRole(['Admin']), authorizeSiteAccess, AlertRuleController.deleteAlertRule);

// ... existing imports ...
import * as DerivedMetricRuleController from '../controllers/derivedMetricRuleController';

// ... existing routes ...

// --- Derived Metric Rule Routes ---
router.get('/derived-rules/:siteId', authenticateToken, authorizeSiteAccess, DerivedMetricRuleController.getDerivedMetricRules);
router.post('/derived-rules/:siteId', authenticateToken, authorizeRole(['Admin']), authorizeSiteAccess, DerivedMetricRuleController.createDerivedMetricRule);
router.put('/derived-rules/:siteId/:id', authenticateToken, authorizeRole(['Admin']), authorizeSiteAccess, DerivedMetricRuleController.updateDerivedMetricRule);
router.delete('/derived-rules/:siteId/:id', authenticateToken, authorizeRole(['Admin']), authorizeSiteAccess, DerivedMetricRuleController.deleteDerivedMetricRule);

export default router;

