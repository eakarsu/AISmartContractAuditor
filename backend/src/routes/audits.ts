import { Router, Response } from 'express';
import prisma from '../lib/prisma';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();

router.get('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const audits = await prisma.auditReport.findMany({
      include: {
        contract: { select: { name: true, language: true } },
        user: { select: { firstName: true, lastName: true } },
        vulnerabilities: true,
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json(audits);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const audit = await prisma.auditReport.findUnique({
      where: { id: String(req.params.id) },
      include: {
        contract: true,
        user: { select: { firstName: true, lastName: true } },
        vulnerabilities: true,
      },
    });
    if (!audit) return res.status(404).json({ error: 'Audit not found' });
    res.json(audit);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { title, contractId, status, overallScore, gasScore, securityScore, codeQualityScore, complianceScore, summary } = req.body;
    const audit = await prisma.auditReport.create({
      data: { title, contractId, userId: req.userId!, status, overallScore, gasScore, securityScore, codeQualityScore, complianceScore, summary },
    });
    res.status(201).json(audit);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { title, status, overallScore, gasScore, securityScore, codeQualityScore, complianceScore, summary } = req.body;
    const audit = await prisma.auditReport.update({
      where: { id: String(req.params.id) },
      data: { title, status, overallScore, gasScore, securityScore, codeQualityScore, complianceScore, summary },
    });
    res.json(audit);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    await prisma.auditReport.delete({ where: { id: String(req.params.id) } });
    res.json({ message: 'Audit report deleted' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
