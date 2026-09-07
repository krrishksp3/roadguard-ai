import { prisma } from '../../config/prisma';

export class NotificationService {
  public static async notify(userId: string, title: string, message: string, reportId?: string, type = 'INFO') {
    try {
      return await prisma.notification.create({
        data: {
          userId,
          title,
          message,
          reportId,
          type,
        },
      });
    } catch (err) {
      console.error('[NotificationService] Failed to record notification:', err);
    }
  }

  public static async getUserNotifications(userId: string) {
    return prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });
  }

  public static async markAsRead(notificationId: string) {
    return prisma.notification.update({
      where: { id: notificationId },
      data: { isRead: true },
    });
  }
}
