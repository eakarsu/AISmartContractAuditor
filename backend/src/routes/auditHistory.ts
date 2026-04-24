import { Router, Response } from 'express';
import prisma from '../lib/prisma';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();

router.get('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const history = await prisma.auditHistory.findMany({
      include: {
        contract: { select: { name: true, language: true } },
        user: { select: { firstName: true, lastName: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json(history);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const entry = await prisma.auditHistory.findUnique({
      where: { id: String(req.params.id) },
      include: {
        contract: true,
        user: { select: { firstName: true, lastName: true } },
      },
    });
    if (!entry) return res.status(404).json({ error: 'History entry not found' });
    res.json(entry);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
