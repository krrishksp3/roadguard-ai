import { Router } from 'express';
import { TenderController } from '../controllers/tenderController';

const router = Router();

router.get('/', TenderController.getAll);
router.get('/:id', TenderController.getById);

export default router;
