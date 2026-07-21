import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

// Validate env vars at startup
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { errorHandler } from './middleware/errorHandler';

import authRoutes from './routes/auth';
import contractRoutes from './routes/contracts';
import projectRoutes from './routes/projects';
import auditRoutes from './routes/audits';
import complianceTemplateRoutes from './routes/complianceTemplates';
import auditHistoryRoutes from './routes/auditHistory';
import dashboardRoutes from './routes/dashboard';
import aiRoutes from './routes/ai';
import contractWorkflowRoutes from './routes/contractWorkflow';
import { authenticate } from './middleware/auth';
import './config/security';
import prisma from './lib/prisma';

const app = express();
const PORT = process.env.BACKEND_PORT || 4000;

app.use(helmet());
app.use(cors({ origin: process.env.CLIENT_URL || process.env.CORS_ORIGIN || 'http://localhost:3000', credentials: true }));
app.use(morgan('dev'));
app.use(express.json({ limit: '10mb' }));

app.use('/api/auth', authRoutes);
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});
app.use('/api/contract-workflow', contractWorkflowRoutes);
app.use(/^\/api\/(?:gap-|ai(?:\/|$)|ai-)/, authenticate, (_req, res) => res.status(503).json({
  error: 'Generated AI and gap routes are quarantined; use /api/contract-workflow', retryable: false,
}));
app.use('/api/contracts', contractRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/audits', auditRoutes);
app.use('/api/compliance-templates', complianceTemplateRoutes);
app.use('/api/audit-history', auditHistoryRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/ai', aiRoutes); // Rate limiter applied inside aiRoutes

// AI feature mount: continuous-monitor
import aiContinuousmonitorRoutes from './routes/ai-continuous-monitor';
// === Batch 07 Gaps & Frontend Mounts ===
import _b07_no_contractpatternrecognition_vulnerable_pat from './routes/gap-no-contractpatternrecognition-vulnerable-pat';
import _b07_no_gasestimation_deployment_cost_ai from './routes/gap-no-gasestimation-deployment-cost-ai';
import _b07_no_forkanalysis_compare_to_similar_contracts from './routes/gap-no-forkanalysis-compare-to-similar-contracts';
import _b07_no_upgradepathrecommendation_proxy_patterns from './routes/gap-no-upgradepathrecommendation-proxy-patterns';
import _b07_no_formalverificationsuggestion_ai from './routes/gap-no-formalverificationsuggestion-ai';
import _b07_limited_contract_source_upload_no_solidity_p from './routes/gap-limited-contract-source-upload-no-solidity-p';
import _b07_no_gas_optimization_simulation_environment from './routes/gap-no-gas-optimization-simulation-environment';
import _b07_no_test_coverage_reporting from './routes/gap-no-test-coverage-reporting';
import _b07_no_continuous_monitoring_of_deployed_contrac from './routes/gap-no-continuous-monitoring-of-deployed-contrac';
import _b07_no_remediation_tracking_vulnerability_closeo from './routes/gap-no-remediation-tracking-vulnerability-closeo';
import _b07_no_multichain_support_evmonly_assumed from './routes/gap-no-multichain-support-evmonly-assumed';
import _b07_no_notificationswebhook_for_findings from './routes/gap-no-notificationswebhook-for-findings';
// === End Batch 07 imports ===
app.use('/api/ai/continuous-monitor', aiContinuousmonitorRoutes);
// === Batch 07 Gaps & Frontend Mounts === mounts
app.use('/api/gap-no-contractpatternrecognition-vulnerable-pat', _b07_no_contractpatternrecognition_vulnerable_pat);
app.use('/api/gap-no-gasestimation-deployment-cost-ai', _b07_no_gasestimation_deployment_cost_ai);
app.use('/api/gap-no-forkanalysis-compare-to-similar-contracts', _b07_no_forkanalysis_compare_to_similar_contracts);
app.use('/api/gap-no-upgradepathrecommendation-proxy-patterns', _b07_no_upgradepathrecommendation_proxy_patterns);
app.use('/api/gap-no-formalverificationsuggestion-ai', _b07_no_formalverificationsuggestion_ai);
app.use('/api/gap-limited-contract-source-upload-no-solidity-p', _b07_limited_contract_source_upload_no_solidity_p);
app.use('/api/gap-no-gas-optimization-simulation-environment', _b07_no_gas_optimization_simulation_environment);
app.use('/api/gap-no-test-coverage-reporting', _b07_no_test_coverage_reporting);
app.use('/api/gap-no-continuous-monitoring-of-deployed-contrac', _b07_no_continuous_monitoring_of_deployed_contrac);
app.use('/api/gap-no-remediation-tracking-vulnerability-closeo', _b07_no_remediation_tracking_vulnerability_closeo);
app.use('/api/gap-no-multichain-support-evmonly-assumed', _b07_no_multichain_support_evmonly_assumed);
app.use('/api/gap-no-notificationswebhook-for-findings', _b07_no_notificationswebhook_for_findings);
// === End Batch 07 mounts ===

// === Custom Views (bespoke) ===
import customViewsRoutes from './routes/customViews';
app.use('/api/custom-views', customViewsRoutes);
// === End Custom Views ===
import oracleDependencyRiskRoutes from './routes/oracleDependencyRisk';
app.use('/api/oracle-dependency-risk', oracleDependencyRiskRoutes);

app.use(errorHandler);
async function start(){if(process.env.NODE_ENV==='production'){const rows:any[]=await prisma.$queryRawUnsafe("SELECT to_regclass('public.contract_audit_cases')::text AS workflow_table");if(!rows[0]?.workflow_table)throw new Error('Database migrations are required; run ./scripts/migrate.sh');}else{await prisma.user.count();}app.listen(PORT,()=>console.log(`Backend server running on http://localhost:${PORT}`));}
start().catch(error=>{console.error('Failed to start server:',error.message);process.exitCode=1;});
