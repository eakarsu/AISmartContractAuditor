import { Router, Response } from 'express';
import prisma from '../lib/prisma';
import { authenticate, AuthRequest } from '../middleware/auth';
import { AIService } from '../services/aiService';

const router = Router();

router.post('/vulnerability-scan', authenticate, async (req: AuthRequest, res: Response) => {
  const start = Date.now();
  try {
    const { sourceCode, language, contractId } = req.body;
    if (!sourceCode) return res.status(400).json({ error: 'sourceCode required' });

    const result = await AIService.scanVulnerabilities(sourceCode, language);

    await prisma.auditHistory.create({
      data: {
        action: 'vulnerability_scan',
        contractId: contractId || null,
        userId: req.userId!,
        input: { language, codeLength: sourceCode.length },
        result,
        status: 'COMPLETED',
        duration: Date.now() - start,
      },
    });

    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/gas-optimization', authenticate, async (req: AuthRequest, res: Response) => {
  const start = Date.now();
  try {
    const { sourceCode, language, contractId } = req.body;
    if (!sourceCode) return res.status(400).json({ error: 'sourceCode required' });

    const result = await AIService.optimizeGas(sourceCode, language);

    await prisma.auditHistory.create({
      data: {
        action: 'gas_optimization',
        contractId: contractId || null,
        userId: req.userId!,
        input: { language, codeLength: sourceCode.length },
        result,
        status: 'COMPLETED',
        duration: Date.now() - start,
      },
    });

    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/compliance-check', authenticate, async (req: AuthRequest, res: Response) => {
  const start = Date.now();
  try {
    const { sourceCode, standard, contractId } = req.body;
    if (!sourceCode) return res.status(400).json({ error: 'sourceCode required' });

    const result = await AIService.checkCompliance(sourceCode, standard);

    await prisma.auditHistory.create({
      data: {
        action: 'compliance_check',
        contractId: contractId || null,
        userId: req.userId!,
        input: { standard, codeLength: sourceCode.length },
        result,
        status: 'COMPLETED',
        duration: Date.now() - start,
      },
    });

    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/test-generation', authenticate, async (req: AuthRequest, res: Response) => {
  const start = Date.now();
  try {
    const { sourceCode, language, contractId } = req.body;
    if (!sourceCode) return res.status(400).json({ error: 'sourceCode required' });

    const result = await AIService.generateTests(sourceCode, language);

    await prisma.auditHistory.create({
      data: {
        action: 'test_generation',
        contractId: contractId || null,
        userId: req.userId!,
        input: { language, codeLength: sourceCode.length },
        result,
        status: 'COMPLETED',
        duration: Date.now() - start,
      },
    });

    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/code-quality', authenticate, async (req: AuthRequest, res: Response) => {
  const start = Date.now();
  try {
    const { sourceCode, language, contractId } = req.body;
    if (!sourceCode) return res.status(400).json({ error: 'sourceCode required' });

    const result = await AIService.analyzeCodeQuality(sourceCode, language);

    await prisma.auditHistory.create({
      data: {
        action: 'code_quality',
        contractId: contractId || null,
        userId: req.userId!,
        input: { language, codeLength: sourceCode.length },
        result,
        status: 'COMPLETED',
        duration: Date.now() - start,
      },
    });

    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/reentrancy-detection', authenticate, async (req: AuthRequest, res: Response) => {
  const start = Date.now();
  try {
    const { sourceCode, contractId } = req.body;
    if (!sourceCode) return res.status(400).json({ error: 'sourceCode required' });

    const result = await AIService.detectReentrancy(sourceCode);

    await prisma.auditHistory.create({
      data: {
        action: 'reentrancy_detection',
        contractId: contractId || null,
        userId: req.userId!,
        input: { codeLength: sourceCode.length },
        result,
        status: 'COMPLETED',
        duration: Date.now() - start,
      },
    });

    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
