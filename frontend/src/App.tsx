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
      </Route>
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
