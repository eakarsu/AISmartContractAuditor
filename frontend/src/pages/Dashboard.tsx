import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/client';
import {
  FileCode, Shield, FolderOpen, ClipboardList, History, AlertTriangle,
  Search, Fuel, CheckCircle, TestTube, Star, Lock
} from 'lucide-react';

const cards = [
  { key: 'contracts', label: 'Smart Contracts', icon: FileCode, color: 'bg-blue-500', to: '/contracts' },
  { key: 'auditReports', label: 'Audit Reports', icon: Shield, color: 'bg-emerald-500', to: '/audits' },
  { key: 'projects', label: 'Projects', icon: FolderOpen, color: 'bg-purple-500', to: '/projects' },
  { key: 'complianceTemplates', label: 'Compliance Templates', icon: ClipboardList, color: 'bg-orange-500', to: '/compliance-templates' },
  { key: 'auditHistory', label: 'Audit History', icon: History, color: 'bg-cyan-500', to: '/audit-history' },
  { key: 'criticalVulnerabilities', label: 'Critical Vulnerabilities', icon: AlertTriangle, color: 'bg-red-500', to: '/vulnerability-scan' },
  { key: 'vulnerabilityScans', label: 'Vulnerability Scans', icon: Search, color: 'bg-rose-500', to: '/vulnerability-scan', ai: true },
  { key: 'gasOptimizations', label: 'Gas Optimizations', icon: Fuel, color: 'bg-amber-500', to: '/gas-optimization', ai: true },
  { key: 'complianceChecks', label: 'Compliance Checks', icon: CheckCircle, color: 'bg-teal-500', to: '/compliance-check', ai: true },
  { key: 'testGenerations', label: 'Test Generations', icon: TestTube, color: 'bg-indigo-500', to: '/test-generation', ai: true },
  { key: 'codeQualityAnalyses', label: 'Code Quality Analyses', icon: Star, color: 'bg-yellow-500', to: '/code-quality', ai: true },
  { key: 'reentrancyDetections', label: 'Reentrancy Detections', icon: Lock, color: 'bg-pink-500', to: '/reentrancy-detection', ai: true },
];

export default function Dashboard() {
  const [stats, setStats] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/dashboard/stats').then(res => { setStats(res.data); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 mt-1">Overview of your smart contract audit platform</p>
      </div>

      {/* Non-AI Features */}
      <h2 className="text-lg font-semibold text-gray-700 mb-4">Management</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {cards.filter(c => !c.ai && c.key !== 'criticalVulnerabilities').map((card) => (
          <button
            key={card.key}
            onClick={() => navigate(card.to)}
            className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md hover:border-emerald-300 transition-all text-left group"
          >
            <div className="flex items-center gap-4">
              <div className={`${card.color} p-3 rounded-xl text-white group-hover:scale-110 transition-transform`}>
                <card.icon className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm text-gray-500">{card.label}</p>
                <p className="text-2xl font-bold text-gray-900">
                  {loading ? '...' : stats[card.key] ?? 0}
                </p>
              </div>
            </div>
          </button>
        ))}
        {/* Critical vulnerabilities card */}
        {cards.filter(c => c.key === 'criticalVulnerabilities').map((card) => (
          <button
            key={card.key}
            onClick={() => navigate(card.to)}
            className="bg-red-50 rounded-xl shadow-sm border border-red-200 p-6 hover:shadow-md hover:border-red-400 transition-all text-left group"
          >
            <div className="flex items-center gap-4">
              <div className={`${card.color} p-3 rounded-xl text-white group-hover:scale-110 transition-transform`}>
                <card.icon className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm text-red-600">{card.label}</p>
                <p className="text-2xl font-bold text-red-700">
                  {loading ? '...' : stats[card.key] ?? 0}
                </p>
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* AI Features */}
      <h2 className="text-lg font-semibold text-gray-700 mb-4">AI-Powered Tools</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {cards.filter(c => c.ai).map((card) => (
          <button
            key={card.key}
            onClick={() => navigate(card.to)}
            className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md hover:border-emerald-300 transition-all text-left group relative overflow-hidden"
          >
            <div className="absolute top-2 right-2 text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-medium">AI</div>
            <div className="flex items-center gap-4">
              <div className={`${card.color} p-3 rounded-xl text-white group-hover:scale-110 transition-transform`}>
                <card.icon className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm text-gray-500">{card.label}</p>
                <p className="text-2xl font-bold text-gray-900">
                  {loading ? '...' : stats[card.key] ?? 0}
                </p>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
