import { Router, Response } from 'express';
import prisma from '../lib/prisma';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();

router.get('/stats', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const [contracts, auditReports, projects, complianceTemplates, auditHistory, criticalVulnerabilities] = await Promise.all([
      prisma.smartContract.count(),
      prisma.auditReport.count(),
      prisma.project.count(),
      prisma.complianceTemplate.count(),
      prisma.auditHistory.count(),
      prisma.vulnerability.count({ where: { severity: 'CRITICAL' } }),
    ]);

    const [vulnerabilityScans, gasOptimizations, complianceChecks, testGenerations, codeQualityAnalyses, reentrancyDetections] = await Promise.all([
      prisma.auditHistory.count({ where: { action: 'vulnerability_scan' } }),
      prisma.auditHistory.count({ where: { action: 'gas_optimization' } }),
      prisma.auditHistory.count({ where: { action: 'compliance_check' } }),
      prisma.auditHistory.count({ where: { action: 'test_generation' } }),
      prisma.auditHistory.count({ where: { action: 'code_quality' } }),
      prisma.auditHistory.count({ where: { action: 'reentrancy_detection' } }),
    ]);

    res.json({
      contracts, auditReports, projects, complianceTemplates, auditHistory,
      criticalVulnerabilities, vulnerabilityScans, gasOptimizations,
      complianceChecks, testGenerations, codeQualityAnalyses, reentrancyDetections,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
