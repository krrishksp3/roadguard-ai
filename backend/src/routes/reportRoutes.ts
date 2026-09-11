import { Router } from 'express';
import { ReportController } from '../controllers/reportController';
import { authenticateJwt, optionalAuthenticateJwt, requireRoles } from '../middleware/authMiddleware';

const router = Router();

// Public & Citizen reporting routes
router.get('/', ReportController.getAllReports);
router.get('/my-reports', authenticateJwt, ReportController.getCitizenReports);
router.get('/my', authenticateJwt, ReportController.getCitizenReports);
router.get('/:id', ReportController.getReportById);
router.post('/', optionalAuthenticateJwt, ReportController.createReport);

// Authority status progression, escalation & after-repair evidence
router.patch('/:id/status', authenticateJwt, requireRoles(['AUTHORITY', 'ADMIN']), ReportController.updateReportStatus);
router.post('/:id/escalate', authenticateJwt, requireRoles(['AUTHORITY', 'ADMIN']), ReportController.escalateReport);
router.post('/:id/after-photo', authenticateJwt, requireRoles(['AUTHORITY', 'ADMIN']), ReportController.uploadAfterRepairPhoto);

export default router;
