import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { authenticate } from '../middleware/auth';
import { AIService } from '../services/aiService';

const router = Router();

export const FEATURES = Object.freeze({
  "cf-comparative-contract-analysis": "Comparative Contract Analysis",
  "cf-continuous-monitoring-of-deployed-contracts": "Continuous Monitoring Of Deployed Contracts",
  "cf-formal-verification-integration": "Formal Verification Integration",
  "cf-gas-optimization-simulation": "Gas Optimization Simulation",
  "cf-test-generation-with-coverage": "Test Generation With Coverage",
  "cf-upgrade-path-advisor": "Upgrade Path Advisor",
  "gap-limited-contract-source-upload-no-solidity-p": "Limited Contract Source Upload No Solidity P",
  "gap-no-continuous-monitoring-of-deployed-contrac": "No Continuous Monitoring Of Deployed Contrac",
  "gap-no-contractpatternrecognition-vulnerable-pat": "No Contractpatternrecognition Vulnerable Pat",
  "gap-no-forkanalysis-compare-to-similar-contracts": "No Forkanalysis Compare To Similar Contracts",
  "gap-no-formalverificationsuggestion-ai": "No Formalverificationsuggestion Ai",
  "gap-no-gas-optimization-simulation-environment": "No Gas Optimization Simulation Environment",
  "gap-no-gasestimation-deployment-cost-ai": "No Gasestimation Deployment Cost Ai",
  "gap-no-multichain-support-evmonly-assumed": "No Multichain Support Evmonly Assumed",
  "gap-no-notificationswebhook-for-findings": "No Notificationswebhook For Findings",
  "gap-no-remediation-tracking-vulnerability-closeo": "No Remediation Tracking Vulnerability Closeo",
  "gap-no-test-coverage-reporting": "No Test Coverage Reporting",
  "gap-no-upgradepathrecommendation-proxy-patterns": "No Upgradepathrecommendation Proxy Patterns",
});

router.use(rateLimit({ windowMs: 60 * 60 * 1000, max: 20, standardHeaders: true, legacyHeaders: false }));

for (const [endpoint, title] of Object.entries(FEATURES)) {
  router.post(`/${endpoint}`, authenticate, async (req, res) => {
    const input = typeof req.body?.input === 'string' ? req.body.input.trim() : '';
    if (input.length < 10) return res.status(400).json({ error: 'ValidationError', message: 'Input must contain at least 10 characters.' });
    if (!process.env.OPENROUTER_API_KEY) return res.status(503).json({ error: 'AIServiceNotConfigured', message: 'OPENROUTER_API_KEY is required for AI analysis.' });
    try {
      const result = await AIService.analyzeGeneratedFeature(title, input.slice(0, 12000));
      return res.json({
        feature: endpoint,
        title,
        result,
        model: process.env.OPENROUTER_MODEL || 'anthropic/claude-3-5-sonnet-20241022',
        disclaimer: 'Security decision support only. Verify findings with qualified auditors, tests, and independent review before deployment.',
      });
    } catch (error) {
      console.error(`[generated-ai:${endpoint}]`, error instanceof Error ? error.message : error);
      return res.status(502).json({ error: 'AIServiceError', message: 'The AI provider could not complete this analysis. Please retry or escalate for manual review.' });
    }
  });
}

export default router;

