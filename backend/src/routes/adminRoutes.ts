import { Router } from 'express';
import { AdminController } from '../controllers/adminController';
import { authenticateJwt, requireRoles } from '../middleware/authMiddleware';

const router = Router();

// District Admin Oversight & Directives (Role: ADMIN only)
router.get('/overview', authenticateJwt, requireRoles(['ADMIN']), AdminController.getOverview);
router.post('/action', authenticateJwt, requireRoles(['ADMIN']), AdminController.takeAction);

export default router;
