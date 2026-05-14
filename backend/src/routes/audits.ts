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

// GET /api/audits/:id/pdf — Generate PDF audit report
router.get('/:id/pdf', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const audit = await prisma.auditReport.findUnique({
      where: { id: String(req.params.id) },
      include: {
        contract: true,
        vulnerabilities: { orderBy: { severity: 'asc' } },
        user: { select: { firstName: true, lastName: true, email: true } },
      },
    });
    if (!audit) return res.status(404).json({ error: 'Audit report not found' });

    const PDFDocument = require('pdfkit');
    const doc = new PDFDocument({ margin: 50 });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="audit-${audit.id}.pdf"`);
    doc.pipe(res);

    // Cover Page
    doc.fontSize(26).font('Helvetica-Bold').text('Smart Contract Audit Report', { align: 'center' });
    doc.moveDown(0.5);
    doc.fontSize(14).font('Helvetica').text(audit.title, { align: 'center' });
    doc.moveDown(0.5);
    doc.fontSize(11)
      .text(`Contract: ${audit.contract.name}`, { align: 'center' })
      .text(`Language: ${audit.contract.language}`, { align: 'center' })
      .text(`Auditor: ${audit.user.firstName} ${audit.user.lastName}`, { align: 'center' })
      .text(`Date: ${new Date(audit.createdAt).toLocaleDateString()}`, { align: 'center' })
      .text(`Status: ${audit.status}`, { align: 'center' });
    doc.addPage();

    // Executive Summary
    doc.fontSize(18).font('Helvetica-Bold').text('Executive Summary');
    doc.moveDown(0.5);
    doc.fontSize(11).font('Helvetica').text(audit.summary || 'No summary provided.');
    doc.moveDown();

    // Scores
    doc.fontSize(16).font('Helvetica-Bold').text('Audit Scores');
    doc.moveDown(0.5);
    const scores = [
      ['Overall', audit.overallScore],
      ['Security', audit.securityScore],
      ['Gas Efficiency', audit.gasScore],
      ['Code Quality', audit.codeQualityScore],
      ['Compliance', audit.complianceScore],
    ];
    for (const [label, val] of scores) {
      const display = val !== null && val !== undefined ? `${Number(val).toFixed(1)}/100` : 'N/A';
      doc.fontSize(11).font('Helvetica').text(`${label}: ${display}`);
    }
    doc.moveDown();

    // Vulnerabilities
    if (audit.vulnerabilities.length > 0) {
      doc.addPage();
      doc.fontSize(18).font('Helvetica-Bold').text(`Vulnerabilities (${audit.vulnerabilities.length})`);
      doc.moveDown(0.5);

      const sevOrder = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'INFORMATIONAL'];
      const sorted = [...audit.vulnerabilities].sort(
        (a, b) => sevOrder.indexOf(a.severity) - sevOrder.indexOf(b.severity)
      );

      for (const v of sorted) {
        doc.fontSize(12).font('Helvetica-Bold').text(`[${v.severity}] ${v.title}`);
        doc.fontSize(10).font('Helvetica')
          .text(`Category: ${v.category}`)
          .text(v.description);
        if (v.recommendation) doc.text(`Fix: ${v.recommendation}`);
        doc.moveDown(0.5);
      }
    }

    // Gas Optimizations
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
    if (!res.headersSent) {
      res.status(500).json({ error: 'Failed to generate PDF' });
    }
  }
});

export default router;
