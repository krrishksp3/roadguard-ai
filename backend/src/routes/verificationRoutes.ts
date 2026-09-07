import { Router } from 'express';
import { VerificationController } from '../controllers/verificationController';
import { authenticateJwt, requireRoles } from '../middleware/authMiddleware';

const router = Router();

router.post('/run', authenticateJwt, requireRoles(['AUTHORITY', 'ADMIN']), VerificationController.runVerification);
router.post('/:reportId/decision', authenticateJwt, requireRoles(['AUTHORITY', 'ADMIN']), VerificationController.submitAuthorityDecision);

export default router;
