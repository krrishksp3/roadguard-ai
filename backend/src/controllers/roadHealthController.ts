import { Request, Response, NextFunction } from 'express';
import { RoadHealthService } from '../services/roadHealth/roadHealthService';
import { JurisdictionService } from '../services/jurisdiction/jurisdictionService';
import { prisma } from '../config/prisma';

export class RoadHealthController {
  public static async getAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const roadHealthData = await RoadHealthService.getAllRoadHealth();
      res.status(200).json({ success: true, data: roadHealthData });
    } catch (error) {
      next(error);
    }
  }

  public static async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const segment = await prisma.roadSegment.findUnique({
        where: { id },
        include: {
          department: true,
          tender: true,
          reports: {
            orderBy: [{ riskScore: 'desc' }, { createdAt: 'desc' }],
            include: { aiAnalysis: true, priorityAssessment: true },
          },
        },
      });

      if (!segment) {
        res.status(404).json({ success: false, message: 'Road segment not found' });
        return;
      }

      res.status(200).json({ success: true, data: segment });
    } catch (error) {
      next(error);
    }
  }

  public static async getRecurringHotspots(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const hotspots = await prisma.roadSegment.findMany({
        where: { isRecurringHotspot: true },
        include: {
          department: true,
          tender: true,
          reports: {
            take: 3,
            orderBy: { createdAt: 'desc' },
          },
        },
        orderBy: { recurringDamageCount: 'desc' },
      });

      res.status(200).json({ success: true, data: hotspots });
    } catch (error) {
      next(error);
    }
  }

  public static async resolveJurisdiction(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const lat = parseFloat(req.query.lat as string);
      const lng = parseFloat(req.query.lng as string);

      if (isNaN(lat) || isNaN(lng)) {
        res.status(400).json({ success: false, message: 'Valid lat and lng query parameters are required' });
        return;
      }

      const result = await JurisdictionService.resolveJurisdiction(lat, lng);
      res.status(200).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }
}
