import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../api/client';
import { ArrowLeft } from 'lucide-react';
import {
  VulnerabilityScanResult, GasOptimizationResult, ComplianceCheckResult,
  TestGenerationResult, CodeQualityResult, ReentrancyDetectionResult, GenericAIResult
} from '../../components/AIResultDisplay';

const actionLabels: Record<string, string> = {
  vulnerability_scan: 'Vulnerability Scan', gas_optimization: 'Gas Optimization',
  compliance_check: 'Compliance Check', test_generation: 'Test Generation',
  code_quality: 'Code Quality', reentrancy_detection: 'Reentrancy Detection',
};

const ResultComponents: Record<string, React.FC<{ data: any }>> = {
  vulnerability_scan: VulnerabilityScanResult,
  gas_optimization: GasOptimizationResult,
  compliance_check: ComplianceCheckResult,
  test_generation: TestGenerationResult,
  code_quality: CodeQualityResult,
  reentrancy_detection: ReentrancyDetectionResult,
};

export default function AuditHistoryDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [entry, setEntry] = useState<any>(null);

  useEffect(() => { api.get(`/audit-history/${id}`).then(res => setEntry(res.data)); }, [id]);

  if (!entry) return <div className="text-center py-8 text-gray-500">Loading...</div>;

  const ResultComponent = ResultComponents[entry.action] || GenericAIResult;

  return (
    <div>
      <button onClick={() => navigate('/audit-history')} className="flex items-center gap-1 text-gray-500 hover:text-gray-700 mb-4"><ArrowLeft className="w-4 h-4" /> Back</button>

      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">{actionLabels[entry.action] || entry.action}</h1>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div><p className="text-xs text-gray-500">Contract</p><p className="font-medium">{entry.contract?.name || '-'}</p></div>
          <div><p className="text-xs text-gray-500">User</p><p className="font-medium">{entry.user?.firstName} {entry.user?.lastName}</p></div>
          <div><p className="text-xs text-gray-500">Status</p><p className="font-medium">{entry.status}</p></div>
          <div><p className="text-xs text-gray-500">Duration</p><p className="font-medium">{entry.duration ? `${(entry.duration / 1000).toFixed(1)}s` : '-'}</p></div>
        </div>
      </div>

      {entry.result && (
        <div>
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Results</h2>
          <ResultComponent data={entry.result} />
        </div>
      )}
    </div>
  );
}
