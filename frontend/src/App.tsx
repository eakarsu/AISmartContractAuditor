import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import ContractList from './pages/contracts/ContractList';
import ContractDetail from './pages/contracts/ContractDetail';
import ContractForm from './pages/contracts/ContractForm';
import AuditReportList from './pages/audits/AuditReportList';
import AuditReportDetail from './pages/audits/AuditReportDetail';
import AuditReportForm from './pages/audits/AuditReportForm';
import ProjectList from './pages/projects/ProjectList';
import ProjectDetail from './pages/projects/ProjectDetail';
import ProjectForm from './pages/projects/ProjectForm';
import TemplateList from './pages/compliance-templates/TemplateList';
import TemplateDetail from './pages/compliance-templates/TemplateDetail';
import TemplateForm from './pages/compliance-templates/TemplateForm';
import AuditHistoryList from './pages/audit-history/AuditHistoryList';
import AuditHistoryDetail from './pages/audit-history/AuditHistoryDetail';
import VulnerabilityDetection from './pages/ai/VulnerabilityDetection';
import GasOptimization from './pages/ai/GasOptimization';
import ComplianceChecking from './pages/ai/ComplianceChecking';
import TestGeneration from './pages/ai/TestGeneration';
import CodeQuality from './pages/ai/CodeQuality';
import ReentrancyDetection from './pages/ai/ReentrancyDetection';
import AdvancedAnalysis from './pages/ai/AdvancedAnalysis';
import VulnerabilityList from './pages/VulnerabilityList';
import AutoFix from './pages/AutoFix';
import AuditReportPDF from './pages/AuditReportPDF';
// === Custom Views (bespoke) ===
// @ts-ignore - bespoke .js page
import CustomViewsPage from './pages/CustomViewsPage';

// === Batch 07 Gaps & Frontend Mounts ===
import CfContinuousMonitoringOfDeployedContracts from './pages/CfContinuousMonitoringOfDeployedContracts';
import CfFormalVerificationIntegration from './pages/CfFormalVerificationIntegration';
import CfGasOptimizationSimulation from './pages/CfGasOptimizationSimulation';
import CfComparativeContractAnalysis from './pages/CfComparativeContractAnalysis';
import CfUpgradePathAdvisor from './pages/CfUpgradePathAdvisor';
import CfTestGenerationWithCoverage from './pages/CfTestGenerationWithCoverage';
import GapNoContractpatternrecognitionVulnerablePat from './pages/GapNoContractpatternrecognitionVulnerablePat';
import GapNoGasestimationDeploymentCostAi from './pages/GapNoGasestimationDeploymentCostAi';
import GapNoForkanalysisCompareToSimilarContracts from './pages/GapNoForkanalysisCompareToSimilarContracts';
import GapNoUpgradepathrecommendationProxyPatterns from './pages/GapNoUpgradepathrecommendationProxyPatterns';
import GapNoFormalverificationsuggestionAi from './pages/GapNoFormalverificationsuggestionAi';
import GapLimitedContractSourceUploadNoSolidityP from './pages/GapLimitedContractSourceUploadNoSolidityP';
import GapNoGasOptimizationSimulationEnvironment from './pages/GapNoGasOptimizationSimulationEnvironment';
import GapNoTestCoverageReporting from './pages/GapNoTestCoverageReporting';
import GapNoContinuousMonitoringOfDeployedContrac from './pages/GapNoContinuousMonitoringOfDeployedContrac';
import GapNoRemediationTrackingVulnerabilityCloseo from './pages/GapNoRemediationTrackingVulnerabilityCloseo';
import GapNoMultichainSupportEvmonlyAssumed from './pages/GapNoMultichainSupportEvmonlyAssumed';
import GapNoNotificationswebhookForFindings from './pages/GapNoNotificationswebhookForFindings';
// === End Batch 07 ===


const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" />;
};

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route index element={<Navigate to="/dashboard" />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="contracts" element={<ContractList />} />
        <Route path="contracts/new" element={<ContractForm />} />
        <Route path="contracts/:id" element={<ContractDetail />} />
        <Route path="contracts/:id/edit" element={<ContractForm />} />
        <Route path="audits" element={<AuditReportList />} />
        <Route path="audits/new" element={<AuditReportForm />} />
        <Route path="audits/:id" element={<AuditReportDetail />} />
        <Route path="audits/:id/edit" element={<AuditReportForm />} />
        <Route path="projects" element={<ProjectList />} />
        <Route path="projects/new" element={<ProjectForm />} />
        <Route path="projects/:id" element={<ProjectDetail />} />
        <Route path="projects/:id/edit" element={<ProjectForm />} />
        <Route path="compliance-templates" element={<TemplateList />} />
        <Route path="compliance-templates/new" element={<TemplateForm />} />
        <Route path="compliance-templates/:id" element={<TemplateDetail />} />
        <Route path="compliance-templates/:id/edit" element={<TemplateForm />} />
        <Route path="audit-history" element={<AuditHistoryList />} />
        <Route path="audit-history/:id" element={<AuditHistoryDetail />} />
        <Route path="vulnerability-scan" element={<VulnerabilityDetection />} />
        <Route path="gas-optimization" element={<GasOptimization />} />
        <Route path="compliance-check" element={<ComplianceChecking />} />
        <Route path="test-generation" element={<TestGeneration />} />
        <Route path="code-quality" element={<CodeQuality />} />
        <Route path="reentrancy-detection" element={<ReentrancyDetection />} />
        <Route path="advanced-analysis" element={<AdvancedAnalysis />} />
        <Route path="vulnerabilities" element={<VulnerabilityList />} />
        <Route path="auto-fix/:vulnerabilityId" element={<AutoFix />} />
        <Route path="audit-pdf" element={<AuditReportPDF />} />
        <Route path="custom-views" element={<CustomViewsPage />} />
      </Route>
          // === Batch 07 Gaps & Frontend Mounts ===
          <Route path='/cf-continuous-monitoring-of-deployed-contracts' element={<CfContinuousMonitoringOfDeployedContracts />} />
          <Route path='/cf-formal-verification-integration' element={<CfFormalVerificationIntegration />} />
          <Route path='/cf-gas-optimization-simulation' element={<CfGasOptimizationSimulation />} />
          <Route path='/cf-comparative-contract-analysis' element={<CfComparativeContractAnalysis />} />
          <Route path='/cf-upgrade-path-advisor' element={<CfUpgradePathAdvisor />} />
          <Route path='/cf-test-generation-with-coverage' element={<CfTestGenerationWithCoverage />} />
          <Route path='/gap-no-contractpatternrecognition-vulnerable-pat' element={<GapNoContractpatternrecognitionVulnerablePat />} />
          <Route path='/gap-no-gasestimation-deployment-cost-ai' element={<GapNoGasestimationDeploymentCostAi />} />
          <Route path='/gap-no-forkanalysis-compare-to-similar-contracts' element={<GapNoForkanalysisCompareToSimilarContracts />} />
          <Route path='/gap-no-upgradepathrecommendation-proxy-patterns' element={<GapNoUpgradepathrecommendationProxyPatterns />} />
          <Route path='/gap-no-formalverificationsuggestion-ai' element={<GapNoFormalverificationsuggestionAi />} />
          <Route path='/gap-limited-contract-source-upload-no-solidity-p' element={<GapLimitedContractSourceUploadNoSolidityP />} />
          <Route path='/gap-no-gas-optimization-simulation-environment' element={<GapNoGasOptimizationSimulationEnvironment />} />
          <Route path='/gap-no-test-coverage-reporting' element={<GapNoTestCoverageReporting />} />
          <Route path='/gap-no-continuous-monitoring-of-deployed-contrac' element={<GapNoContinuousMonitoringOfDeployedContrac />} />
          <Route path='/gap-no-remediation-tracking-vulnerability-closeo' element={<GapNoRemediationTrackingVulnerabilityCloseo />} />
          <Route path='/gap-no-multichain-support-evmonly-assumed' element={<GapNoMultichainSupportEvmonlyAssumed />} />
          <Route path='/gap-no-notificationswebhook-for-findings' element={<GapNoNotificationswebhookForFindings />} />
          // === End Batch 07 ===
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
}
