import { Request, Response, NextFunction } from 'express';
import { TenderService } from '../services/tender/tenderService';

export class TenderController {
  public static async getAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenders = await TenderService.getAllTenders();
      res.status(200).json({ success: true, data: tenders });
    } catch (error) {
      next(error);
    }
  }

  public static async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const tender = await TenderService.getTenderById(id);

      if (!tender) {
        res.status(404).json({ success: false, message: 'Tender not found' });
        return;
      }

      res.status(200).json({ success: true, data: tender });
    } catch (error) {
      next(error);
    }
  }
}
