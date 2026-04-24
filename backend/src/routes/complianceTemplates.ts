import { Router, Response } from 'express';
import prisma from '../lib/prisma';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();

router.get('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const templates = await prisma.complianceTemplate.findMany({ orderBy: { createdAt: 'desc' } });
    res.json(templates);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const template = await prisma.complianceTemplate.findUnique({ where: { id: String(req.params.id) } });
    if (!template) return res.status(404).json({ error: 'Template not found' });
    res.json(template);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { name, standard, description, rules, version, isActive } = req.body;
    const template = await prisma.complianceTemplate.create({
      data: { name, standard, description, rules, version, isActive },
    });
    res.status(201).json(template);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { name, standard, description, rules, version, isActive } = req.body;
    const template = await prisma.complianceTemplate.update({
      where: { id: String(req.params.id) },
      data: { name, standard, description, rules, version, isActive },
    });
    res.json(template);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    await prisma.complianceTemplate.delete({ where: { id: String(req.params.id) } });
    res.json({ message: 'Template deleted' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
