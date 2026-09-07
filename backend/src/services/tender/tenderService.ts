import { prisma } from '../../config/prisma';

export class TenderService {
  public static async getAllTenders() {
    return prisma.tender.findMany({
      include: {
        department: true,
        roadSegment: {
          select: {
            id: true,
            code: true,
            name: true,
            healthScore: true,
            openComplaints: true,
            isRecurringHotspot: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  public static async getTenderById(id: string) {
    return prisma.tender.findUnique({
      where: { id },
      include: {
        department: true,
        roadSegment: {
          include: {
            reports: {
              take: 5,
              orderBy: { createdAt: 'desc' },
            },
          },
        },
      },
    });
  }

  public static async getTenderByRoadSegment(roadSegmentId: string) {
    return prisma.tender.findFirst({
      where: { roadSegmentId },
      include: {
        department: true,
        roadSegment: true,
      },
    });
  }
}
