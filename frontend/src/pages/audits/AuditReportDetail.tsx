import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../api/client';
import { Edit, Trash2, ArrowLeft } from 'lucide-react';

const statusColors: Record<string, string> = {
  COMPLETED: 'bg-green-100 text-green-700',
  IN_PROGRESS: 'bg-blue-100 text-blue-700',
  PENDING: 'bg-yellow-100 text-yellow-700',
  FAILED: 'bg-red-100 text-red-700',
};

export default function AuditReportDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [audit, setAudit] = useState<any>(null);
  const [showDelete, setShowDelete] = useState(false);

  useEffect(() => { api.get(`/audits/${id}`).then(res => setAudit(res.data)); }, [id]);

  const handleDelete = async () => {
    await api.delete(`/audits/${id}`);
    navigate('/audits');
  };

  if (!audit) return <div className="text-center py-8 text-gray-500">Loading...</div>;

  return (
    <div>
      <button onClick={() => navigate('/audits')} className="flex items-center gap-1 text-gray-500 hover:text-gray-700 mb-4">
        <ArrowLeft className="w-4 h-4" /> Back
      </button>

      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{audit.title}</h1>
            <span className={`text-xs font-semibold px-2 py-0.5 rounded ${statusColors[audit.status]}`}>{audit.status}</span>
          </div>
          <div className="flex gap-2">
            <button onClick={() => navigate(`/audits/${id}/edit`)} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"><Edit className="w-4 h-4" /> Edit</button>
            <button onClick={() => setShowDelete(true)} className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"><Trash2 className="w-4 h-4" /> Delete</button>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          {[
            { label: 'Overall', score: audit.overallScore },
            { label: 'Security', score: audit.securityScore },
            { label: 'Gas', score: audit.gasScore },
            { label: 'Code Quality', score: audit.codeQualityScore },
            { label: 'Compliance', score: audit.complianceScore },
          ].map(s => (
            <div key={s.label} className="bg-gray-50 rounded-lg p-3 text-center">
              <p className="text-xs text-gray-500">{s.label}</p>
              <p className="text-xl font-bold" style={{ color: s.score == null ? '#9ca3af' : s.score >= 80 ? '#10b981' : s.score >= 60 ? '#f59e0b' : '#ef4444' }}>
                {s.score != null ? s.score : '-'}
              </p>
            </div>
          ))}
        </div>

        {audit.summary && <p className="text-gray-700 mb-4">{audit.summary}</p>}
        <p className="text-sm text-gray-500">Contract: <span className="font-medium text-gray-800">{audit.contract?.name}</span></p>
        <p className="text-sm text-gray-500">Auditor: <span className="font-medium text-gray-800">{audit.user?.firstName} {audit.user?.lastName}</span></p>
      </div>

      {audit.vulnerabilities?.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Vulnerabilities ({audit.vulnerabilities.length})</h3>
          {audit.vulnerabilities.map((v: any) => (
            <div key={v.id} className="border-b border-gray-100 py-3 last:border-0">
              <div className="flex items-center gap-2">
                <span className={`text-xs font-semibold px-2 py-0.5 rounded ${v.severity === 'CRITICAL' ? 'bg-red-100 text-red-700' : v.severity === 'HIGH' ? 'bg-orange-100 text-orange-700' : v.severity === 'MEDIUM' ? 'bg-yellow-100 text-yellow-700' : 'bg-blue-100 text-blue-700'}`}>{v.severity}</span>
                <span className="font-medium text-gray-800">{v.title}</span>
                <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">{v.category}</span>
              </div>
              <p className="text-sm text-gray-600 mt-1">{v.description}</p>
              {v.recommendation && <p className="text-sm text-emerald-600 mt-1">{v.recommendation}</p>}
            </div>
          ))}
        </div>
      )}

      {showDelete && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-bold text-gray-900 mb-2">Delete Report?</h3>
            <p className="text-gray-600 mb-4">This action cannot be undone.</p>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setShowDelete(false)} className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">Cancel</button>
              <button onClick={handleDelete} className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
