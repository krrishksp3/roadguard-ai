import { Router } from 'express';
import { AuthController } from '../controllers/authController';
import { authenticateJwt } from '../middleware/authMiddleware';

const router = Router();

router.post('/register', AuthController.register);
router.post('/login', AuthController.login);
router.get('/profile', authenticateJwt, AuthController.getProfile);

export default router;
