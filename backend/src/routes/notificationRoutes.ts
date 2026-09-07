import { Router } from 'express';
import { prisma } from '../config/prisma';
import { authenticateJwt, AuthenticatedRequest } from '../middleware/authMiddleware';
import { NotificationService } from '../services/notification/notificationService';

const router = Router();

router.get('/', authenticateJwt, async (req: AuthenticatedRequest, res, next) => {
  try {
    const notifications = await NotificationService.getUserNotifications(req.user!.id);
    res.json({ success: true, data: notifications });
  } catch (error) {
    next(error);
  }
});

router.patch('/:id/read', authenticateJwt, async (req, res, next) => {
  try {
    const { id } = req.params;
    await NotificationService.markAsRead(id);
    res.json({ success: true, message: 'Notification marked as read' });
  } catch (error) {
    next(error);
  }
});

export default router;
