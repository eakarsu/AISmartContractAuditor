import { Router, Response } from 'express';
import prisma from '../lib/prisma';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();

router.get('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const contracts = await prisma.smartContract.findMany({
      include: { project: true, user: { select: { firstName: true, lastName: true } } },
      orderBy: { createdAt: 'desc' },
    });
    res.json(contracts);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const contract = await prisma.smartContract.findUnique({
      where: { id: String(req.params.id) },
      include: {
        project: true,
        user: { select: { firstName: true, lastName: true } },
        vulnerabilities: true,
        auditReports: true,
      },
    });
    if (!contract) return res.status(404).json({ error: 'Contract not found' });
    res.json(contract);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { name, fileName, sourceCode, language, version, description, projectId } = req.body;
    const contract = await prisma.smartContract.create({
      data: { name, fileName, sourceCode, language, version, description, projectId, userId: req.userId! },
    });
    res.status(201).json(contract);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { name, fileName, sourceCode, language, version, description, projectId } = req.body;
    const contract = await prisma.smartContract.update({
      where: { id: String(req.params.id) },
      data: { name, fileName, sourceCode, language, version, description, projectId },
    });
    res.json(contract);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    await prisma.smartContract.delete({ where: { id: String(req.params.id) } });
    res.json({ message: 'Contract deleted' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
