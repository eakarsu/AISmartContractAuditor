import { Router, Response, Request } from 'express';
import rateLimit from 'express-rate-limit';
import prisma from '../lib/prisma';
import { authenticate, AuthRequest } from '../middleware/auth';
import { AIService } from '../services/aiService';
import { SeverityLevel } from '@prisma/client';

const router = Router();

// ─── Rate Limiter ──────────────────────────────────────────────────────────────
const aiRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 20,
  keyGenerator: (req: Request) => {
    const authReq = req as AuthRequest;
    return authReq.user ? `user:${authReq.user.id}` : req.ip || 'unknown';
  },
  message: { error: 'Too many AI requests. Limit is 20 per hour.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Apply rate limiter + auth to all AI routes
router.use(authenticate);
router.use(aiRateLimiter);

// ─── Helper: wire vulnerability scan results to DB ─────────────────────────────
async function createVulnerabilitiesFromScan(
  scanResult: any,
  contractId: string,
  auditReportId?: string
): Promise<void> {
  const vulns = scanResult?.vulnerabilities;
  if (!Array.isArray(vulns) || vulns.length === 0) return;

  const validSeverities = Object.values(SeverityLevel);

  const data = vulns
    .filter((v: any) => v && v.title && v.severity)
    .map((v: any) => {
      const sev = (v.severity || '').toUpperCase();
      const severity: SeverityLevel = validSeverities.includes(sev as SeverityLevel)
        ? (sev as SeverityLevel)
        : SeverityLevel.LOW;
      return {
        contractId,
        auditReportId: auditReportId || null,
        title: String(v.title || 'Unknown Vulnerability'),
        description: String(v.description || ''),
        severity,
        category: String(v.category || 'other'),
        lineNumber: v.lineNumber ? parseInt(v.lineNumber) : null,
        codeSnippet: v.codeSnippet ? String(v.codeSnippet) : null,
        recommendation: v.recommendation ? String(v.recommendation) : null,
        isReentrancy: v.category === 'reentrancy',
        status: 'open',
      };
    });

  if (data.length > 0) {
    await prisma.vulnerability.createMany({ data, skipDuplicates: false });
  }
}

// ─── Helper: wire scan result to AuditReport fields ───────────────────────────
async function updateAuditReportFromScan(
  auditReportId: string,
  scanType: string,
  result: any
): Promise<void> {
  if (!auditReportId) return;
  const updateData: any = {};

  if (scanType === 'vulnerability_scan') {
    updateData.securityScore = result?.riskScore !== undefined ? 100 - result.riskScore : null;
    updateData.summary = result?.summary || null;
  } else if (scanType === 'gas_optimization') {
    updateData.gasScore = result?.gasScore ?? null;
    updateData.gasOptimizations = result?.optimizations ?? null;
  } else if (scanType === 'compliance_check') {
    updateData.complianceScore = result?.complianceScore ?? null;
    updateData.complianceResults = result?.results ?? null;
  } else if (scanType === 'code_quality') {
    updateData.codeQualityScore = result?.overallScore ?? null;
    updateData.codeQualityDetails = result ?? null;
  } else if (scanType === 'test_generation') {
    updateData.testCases = result?.testCases ?? null;
  }

  if (Object.keys(updateData).length > 0) {
    await prisma.auditReport.update({
      where: { id: auditReportId },
      data: updateData,
    }).catch(() => {}); // non-critical
  }
}

// ─── POST /api/ai/vulnerability-scan ──────────────────────────────────────────
router.post('/vulnerability-scan', async (req: AuthRequest, res: Response) => {
  const start = Date.now();
  try {
    const { sourceCode, language, contractId, auditReportId } = req.body;
    if (!sourceCode) return res.status(400).json({ error: 'sourceCode required' });
    if (Buffer.byteLength(sourceCode, 'utf8') > 50 * 1024) {
      return res.status(400).json({ error: 'sourceCode exceeds 50KB limit' });
    }

    const result = await AIService.scanVulnerabilities(sourceCode, language);

    const history = await prisma.auditHistory.create({
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

    // Wire to Vulnerability table
    if (contractId) {
      await createVulnerabilitiesFromScan(result, contractId, auditReportId);
    }

    // Wire to AuditReport
    if (auditReportId) {
      await updateAuditReportFromScan(auditReportId, 'vulnerability_scan', result);
    }

    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to scan vulnerabilities' });
  }
});

// ─── POST /api/ai/gas-optimization ────────────────────────────────────────────
router.post('/gas-optimization', async (req: AuthRequest, res: Response) => {
  const start = Date.now();
  try {
    const { sourceCode, language, contractId, auditReportId } = req.body;
    if (!sourceCode) return res.status(400).json({ error: 'sourceCode required' });
    if (Buffer.byteLength(sourceCode, 'utf8') > 50 * 1024) {
      return res.status(400).json({ error: 'sourceCode exceeds 50KB limit' });
    }

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

    if (auditReportId) await updateAuditReportFromScan(auditReportId, 'gas_optimization', result);

    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to optimize gas' });
  }
});

// ─── POST /api/ai/compliance-check ────────────────────────────────────────────
router.post('/compliance-check', async (req: AuthRequest, res: Response) => {
  const start = Date.now();
  try {
    const { sourceCode, standard, contractId, auditReportId, templateId } = req.body;
    if (!sourceCode) return res.status(400).json({ error: 'sourceCode required' });
    if (Buffer.byteLength(sourceCode, 'utf8') > 50 * 1024) {
      return res.status(400).json({ error: 'sourceCode exceeds 50KB limit' });
    }

    let effectiveStandard = standard;
    let templateRules: any = null;

    // Fetch from DB template if templateId provided
    if (templateId) {
      const template = await prisma.complianceTemplate.findUnique({ where: { id: templateId } });
      if (template) {
        effectiveStandard = template.name;
        templateRules = template.rules;
      }
    } else if (standard) {
      // Try to find matching active template by name
      const template = await prisma.complianceTemplate.findFirst({
        where: { standard: standard as any, isActive: true },
      });
      if (template) templateRules = template.rules;
    }

    const result = await AIService.checkCompliance(sourceCode, effectiveStandard, templateRules);

    await prisma.auditHistory.create({
      data: {
        action: 'compliance_check',
        contractId: contractId || null,
        userId: req.userId!,
        input: { standard: effectiveStandard, codeLength: sourceCode.length, templateId },
        result,
        status: 'COMPLETED',
        duration: Date.now() - start,
      },
    });

    if (auditReportId) await updateAuditReportFromScan(auditReportId, 'compliance_check', result);

    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to check compliance' });
  }
});

// ─── POST /api/ai/test-generation ─────────────────────────────────────────────
router.post('/test-generation', async (req: AuthRequest, res: Response) => {
  const start = Date.now();
  try {
    const { sourceCode, language, contractId, auditReportId } = req.body;
    if (!sourceCode) return res.status(400).json({ error: 'sourceCode required' });
    if (Buffer.byteLength(sourceCode, 'utf8') > 50 * 1024) {
      return res.status(400).json({ error: 'sourceCode exceeds 50KB limit' });
    }

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

    if (auditReportId) await updateAuditReportFromScan(auditReportId, 'test_generation', result);

    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to generate tests' });
  }
});

// ─── POST /api/ai/code-quality ────────────────────────────────────────────────
router.post('/code-quality', async (req: AuthRequest, res: Response) => {
  const start = Date.now();
  try {
    const { sourceCode, language, contractId, auditReportId } = req.body;
    if (!sourceCode) return res.status(400).json({ error: 'sourceCode required' });
    if (Buffer.byteLength(sourceCode, 'utf8') > 50 * 1024) {
      return res.status(400).json({ error: 'sourceCode exceeds 50KB limit' });
    }

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

    if (auditReportId) await updateAuditReportFromScan(auditReportId, 'code_quality', result);

    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to analyze code quality' });
  }
});

// ─── POST /api/ai/reentrancy-detection ────────────────────────────────────────
router.post('/reentrancy-detection', async (req: AuthRequest, res: Response) => {
  const start = Date.now();
  try {
    const { sourceCode, contractId } = req.body;
    if (!sourceCode) return res.status(400).json({ error: 'sourceCode required' });
    if (Buffer.byteLength(sourceCode, 'utf8') > 50 * 1024) {
      return res.status(400).json({ error: 'sourceCode exceeds 50KB limit' });
    }

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

    // Also save reentrancy issues to Vulnerability table
    if (contractId && result?.reentrancyRisks?.length > 0) {
      const vulnData = result.reentrancyRisks
        .filter((r: any) => r.severity && ['HIGH', 'CRITICAL', 'MEDIUM'].includes(r.severity))
        .map((r: any) => ({
          contractId,
          title: `Reentrancy: ${r.functionName || 'Unknown Function'}`,
          description: r.description || '',
          severity: (r.severity as SeverityLevel) || SeverityLevel.HIGH,
          category: 'reentrancy',
          recommendation: r.recommendation || null,
          isReentrancy: true,
          status: 'open',
        }));
      if (vulnData.length > 0) {
        await prisma.vulnerability.createMany({ data: vulnData }).catch(() => {});
      }
    }

    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to detect reentrancy' });
  }
});

// ─── POST /api/ai/batch-scan ──────────────────────────────────────────────────
router.post('/batch-scan', async (req: AuthRequest, res: Response) => {
  const start = Date.now();
  try {
    const { contractIds, scanTypes = ['vulnerability_scan'] } = req.body;
    if (!Array.isArray(contractIds) || contractIds.length === 0) {
      return res.status(400).json({ error: 'contractIds array is required' });
    }
    if (contractIds.length > 5) {
      return res.status(400).json({ error: 'Maximum 5 contracts per batch scan' });
    }

    const results: any[] = [];

    for (const contractId of contractIds) {
      const contract = await prisma.smartContract.findUnique({ where: { id: contractId } });
      if (!contract) {
        results.push({ contractId, error: 'Contract not found' });
        continue;
      }

      const contractResults: any = { contractId, contractName: contract.name, scans: {} };

      for (const scanType of scanTypes) {
        try {
          let scanResult: any;
          if (scanType === 'vulnerability_scan') {
            scanResult = await AIService.scanVulnerabilities(contract.sourceCode, contract.language);
            await createVulnerabilitiesFromScan(scanResult, contractId);
          } else if (scanType === 'gas_optimization') {
            scanResult = await AIService.optimizeGas(contract.sourceCode, contract.language);
          } else if (scanType === 'code_quality') {
            scanResult = await AIService.analyzeCodeQuality(contract.sourceCode, contract.language);
          }

          if (scanResult) {
            contractResults.scans[scanType] = scanResult;
            await prisma.auditHistory.create({
              data: {
                action: scanType,
                contractId,
                userId: req.userId!,
                input: { batchScan: true, language: contract.language },
                result: scanResult,
                status: 'COMPLETED',
                duration: 0,
              },
            });
          }
        } catch (e: any) {
          contractResults.scans[scanType] = { error: 'Scan failed' };
        }
      }

      results.push(contractResults);
    }

    res.json({
      batchId: Date.now().toString(),
      contractsScanned: contractIds.length,
      duration: Date.now() - start,
      results,
    });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to run batch scan' });
  }
});

// ─── POST /api/ai/auto-fix/:vulnerabilityId ───────────────────────────────────
router.post('/auto-fix/:vulnerabilityId', async (req: AuthRequest, res: Response) => {
  try {
    const vulnId = Array.isArray(req.params.vulnerabilityId) ? req.params.vulnerabilityId[0] : req.params.vulnerabilityId;
    const vuln = await prisma.vulnerability.findUnique({
      where: { id: vulnId },
    });
    if (!vuln) return res.status(404).json({ error: 'Vulnerability not found' });

    const contract = await prisma.smartContract.findUnique({ where: { id: vuln.contractId } });
    if (!contract) return res.status(404).json({ error: 'Contract not found' });

    const fix = await AIService.generateAutoFix(vuln, contract.sourceCode);

    // Create Fix record
    const fixRecord = await prisma.fix.create({
      data: {
        vulnerabilityId: vuln.id,
        originalCode: vuln.codeSnippet || contract.sourceCode.slice(0, 2000),
        patchedCode: fix.patchedCode || null,
        explanation: fix.explanation || null,
        diffSummary: fix.diffSummary || null,
        status: 'suggested',
      },
    });

    // Re-scan patched code if provided
    let reScanResult = null;
    if (fix.patchedCode && fix.patchedCode.length > 50) {
      reScanResult = await AIService.scanVulnerabilities(fix.patchedCode, contract.language as string);

      // If clean, update vulnerability status
      const remaining = (reScanResult?.vulnerabilities || []).filter((v: any) =>
        v.title?.toLowerCase().includes(vuln.title.toLowerCase().split(':')[0])
      );

      if (remaining.length === 0) {
        await prisma.vulnerability.update({
          where: { id: vuln.id },
          data: { status: 'fixed' },
        });
      }

      await prisma.fix.update({
        where: { id: fixRecord.id },
        data: { scanResult: reScanResult },
      });
    }

    res.json({ fix: fixRecord, reScanResult, vulnerability: vuln });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to generate auto-fix' });
  }
});

// ─── GET /api/ai/audit-pdf/:id ────────────────────────────────────────────────
// Delegates to /api/audits/:id/pdf — kept for backwards compatibility
router.get('/audit-pdf/:id', async (req: AuthRequest, res: Response) => {
  try {
    const auditId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const audit = await prisma.auditReport.findUnique({ where: { id: auditId } });
    if (!audit) return res.status(404).json({ error: 'Audit report not found' });

    const [contract, user, vulnerabilities] = await Promise.all([
      prisma.smartContract.findUnique({ where: { id: audit.contractId } }),
      prisma.user.findUnique({ where: { id: audit.userId }, select: { firstName: true, lastName: true } }),
      prisma.vulnerability.findMany({ where: { auditReportId: auditId }, orderBy: { severity: 'asc' } }),
    ]);

    const PDFDocument = require('pdfkit');
    const doc = new PDFDocument({ margin: 50 });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="audit-${auditId}.pdf"`);
    doc.pipe(res);

    doc.fontSize(26).font('Helvetica-Bold').text('Smart Contract Audit Report', { align: 'center' });
    doc.moveDown(0.5);
    doc.fontSize(14).font('Helvetica').text(audit.title, { align: 'center' });
    doc.moveDown(0.5);
    doc.fontSize(11)
      .text(`Contract: ${contract?.name || 'Unknown'}`, { align: 'center' })
      .text(`Auditor: ${user?.firstName || ''} ${user?.lastName || ''}`, { align: 'center' })
      .text(`Date: ${new Date(audit.createdAt).toLocaleDateString()}`, { align: 'center' })
      .text(`Status: ${audit.status}`, { align: 'center' });
    doc.addPage();

    doc.fontSize(18).font('Helvetica-Bold').text('Executive Summary');
    doc.moveDown(0.5);
    doc.fontSize(11).font('Helvetica').text(audit.summary || 'No summary provided.');
    doc.moveDown();

    doc.fontSize(16).font('Helvetica-Bold').text('Audit Scores');
    doc.moveDown(0.5);
    const scores: Array<[string, number | null]> = [
      ['Overall', audit.overallScore],
      ['Security', audit.securityScore],
      ['Gas', audit.gasScore],
      ['Code Quality', audit.codeQualityScore],
      ['Compliance', audit.complianceScore],
    ];
    for (const [label, val] of scores) {
      doc.fontSize(11).font('Helvetica').text(`${label}: ${val !== null ? Number(val).toFixed(1) + '/100' : 'N/A'}`);
    }
    doc.moveDown();

    if (vulnerabilities.length > 0) {
      doc.addPage();
      doc.fontSize(18).font('Helvetica-Bold').text(`Vulnerabilities (${vulnerabilities.length})`);
      doc.moveDown(0.5);
      const sevOrder = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'INFORMATIONAL'];
      const sorted = [...vulnerabilities].sort((a, b) => sevOrder.indexOf(a.severity) - sevOrder.indexOf(b.severity));
      for (const v of sorted) {
        doc.fontSize(12).font('Helvetica-Bold').text(`[${v.severity}] ${v.title}`);
        doc.fontSize(10).font('Helvetica').text(`Category: ${v.category}`).text(v.description);
        if (v.recommendation) doc.text(`Fix: ${v.recommendation}`);
        doc.moveDown(0.5);
      }
    }

    const gasOpts = audit.gasOptimizations as any;
    const optimizations = Array.isArray(gasOpts) ? gasOpts : gasOpts?.optimizations;
    if (Array.isArray(optimizations) && optimizations.length > 0) {
      doc.addPage();
      doc.fontSize(18).font('Helvetica-Bold').text('Gas Optimizations');
      doc.moveDown(0.5);
      for (const opt of optimizations.slice(0, 20)) {
        doc.fontSize(12).font('Helvetica-Bold').text(opt.title || 'Optimization');
        doc.fontSize(10).font('Helvetica').text(opt.description || '');
        if (opt.estimatedSavings) doc.text(`Savings: ${opt.estimatedSavings}`);
        doc.moveDown(0.5);
      }
    }

    doc.end();
  } catch (error: any) {
    if (!res.headersSent) res.status(500).json({ error: 'Failed to generate PDF' });
  }
});

// ─── POST /api/ai/contract-pattern-recognition ────────────────────────────────
router.post('/contract-pattern-recognition', async (req: AuthRequest, res: Response) => {
  try {
    const { contractId, sourceCode, language } = req.body || {};
    let code = sourceCode;
    let resolvedContractId = contractId;
    if (!code && contractId) {
      const c = await prisma.smartContract.findUnique({ where: { id: contractId } });
      if (!c) return res.status(404).json({ error: 'Contract not found' });
      code = c.sourceCode;
      resolvedContractId = c.id;
    }
    if (!code) return res.status(400).json({ error: 'sourceCode or contractId is required' });
    const result = await AIService.recognizePatterns(code, language || 'Solidity');
    res.json({ contractId: resolvedContractId, result });
  } catch (error: any) {
    console.error('contract-pattern-recognition error:', error);
    res.status(500).json({ error: error.message || 'Pattern recognition failed' });
  }
});

// ─── POST /api/ai/gas-estimation ───────────────────────────────────────────────
router.post('/gas-estimation', async (req: AuthRequest, res: Response) => {
  try {
    const { contractId, sourceCode, expectedFunctions } = req.body || {};
    let code = sourceCode;
    let resolvedContractId = contractId;
    if (!code && contractId) {
      const c = await prisma.smartContract.findUnique({ where: { id: contractId } });
      if (!c) return res.status(404).json({ error: 'Contract not found' });
      code = c.sourceCode;
      resolvedContractId = c.id;
    }
    if (!code) return res.status(400).json({ error: 'sourceCode or contractId is required' });
    const result = await AIService.estimateGas(code, Array.isArray(expectedFunctions) ? expectedFunctions : []);
    res.json({ contractId: resolvedContractId, result });
  } catch (error: any) {
    console.error('gas-estimation error:', error);
    res.status(500).json({ error: error.message || 'Gas estimation failed' });
  }
});

// ─── POST /api/ai/fork-analysis ────────────────────────────────────────────────
router.post('/fork-analysis', async (req: AuthRequest, res: Response) => {
  try {
    const { contractId, sourceCode, similarContractName } = req.body || {};
    let code = sourceCode;
    let resolvedContractId = contractId;
    if (!code && contractId) {
      const c = await prisma.smartContract.findUnique({ where: { id: contractId } });
      if (!c) return res.status(404).json({ error: 'Contract not found' });
      code = c.sourceCode;
      resolvedContractId = c.id;
    }
    if (!code) return res.status(400).json({ error: 'sourceCode or contractId is required' });
    const result = await AIService.forkAnalysis(code, similarContractName || '');
    res.json({ contractId: resolvedContractId, result });
  } catch (error: any) {
    console.error('fork-analysis error:', error);
    res.status(500).json({ error: error.message || 'Fork analysis failed' });
  }
});

// ─── POST /api/ai/upgrade-path-recommendation ─────────────────────────────────
router.post('/upgrade-path-recommendation', async (req: AuthRequest, res: Response) => {
  try {
    if (!process.env.OPENROUTER_API_KEY) {
      return res.status(503).json({ error: 'AI provider not configured. Set OPENROUTER_API_KEY in backend/.env to enable this endpoint.' });
    }
    const { contractId, sourceCode, currentPattern, targetGoal } = req.body || {};
    let code = sourceCode;
    let resolvedContractId = contractId;
    if (!code && contractId) {
      const c = await prisma.smartContract.findUnique({ where: { id: contractId } });
      if (!c) return res.status(404).json({ error: 'Contract not found' });
      code = c.sourceCode;
      resolvedContractId = c.id;
    }
    if (!code) return res.status(400).json({ error: 'sourceCode or contractId is required' });
    const result = await AIService.upgradePathRecommendation(code, currentPattern, targetGoal);
    res.json({ contractId: resolvedContractId, result });
  } catch (error: any) {
    console.error('upgrade-path-recommendation error:', error);
    res.status(500).json({ error: error.message || 'Upgrade path recommendation failed' });
  }
});

// ─── POST /api/ai/formal-verification-suggestion ──────────────────────────────
router.post('/formal-verification-suggestion', async (req: AuthRequest, res: Response) => {
  try {
    if (!process.env.OPENROUTER_API_KEY) {
      return res.status(503).json({ error: 'AI provider not configured. Set OPENROUTER_API_KEY in backend/.env to enable this endpoint.' });
    }
    const { contractId, sourceCode, propertiesOfInterest } = req.body || {};
    let code = sourceCode;
    let resolvedContractId = contractId;
    if (!code && contractId) {
      const c = await prisma.smartContract.findUnique({ where: { id: contractId } });
      if (!c) return res.status(404).json({ error: 'Contract not found' });
      code = c.sourceCode;
      resolvedContractId = c.id;
    }
    if (!code) return res.status(400).json({ error: 'sourceCode or contractId is required' });
    const props = Array.isArray(propertiesOfInterest) ? propertiesOfInterest : [];
    const result = await AIService.formalVerificationSuggestions(code, props);
    res.json({ contractId: resolvedContractId, result });
  } catch (error: any) {
    console.error('formal-verification-suggestion error:', error);
    res.status(500).json({ error: error.message || 'Formal verification suggestion failed' });
  }
});

export default router;
