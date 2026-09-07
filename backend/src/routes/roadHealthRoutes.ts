import { Router } from 'express';
import { RoadHealthController } from '../controllers/roadHealthController';

const router = Router();

router.get('/', RoadHealthController.getAll);
router.get('/hotspots', RoadHealthController.getRecurringHotspots);
router.get('/resolve', RoadHealthController.resolveJurisdiction);
router.get('/:id', RoadHealthController.getById);

export default router;
