import { Router } from 'express';
import { prisma } from '../config/prisma';

const router = Router();

router.get('/', async (req, res, next) => {
  try {
    const departments = await prisma.department.findMany({
      include: {
        _count: { select: { reports: true, roadSegments: true } },
      },
    });
    res.json({ success: true, data: departments });
  } catch (error) {
    next(error);
  }
});

export default router;
