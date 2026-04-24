import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/client';
import { History, Search } from 'lucide-react';

const actionLabels: Record<string, string> = {
  vulnerability_scan: 'Vulnerability Scan',
  gas_optimization: 'Gas Optimization',
  compliance_check: 'Compliance Check',
  test_generation: 'Test Generation',
  code_quality: 'Code Quality',
  reentrancy_detection: 'Reentrancy Detection',
};

const actionColors: Record<string, string> = {
  vulnerability_scan: 'bg-rose-100 text-rose-700',
  gas_optimization: 'bg-amber-100 text-amber-700',
  compliance_check: 'bg-teal-100 text-teal-700',
  test_generation: 'bg-indigo-100 text-indigo-700',
  code_quality: 'bg-yellow-100 text-yellow-700',
  reentrancy_detection: 'bg-pink-100 text-pink-700',
};

export default function AuditHistoryList() {
  const [history, setHistory] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/audit-history').then(res => { setHistory(res.data); setLoading(false); });
  }, []);

  const filtered = history.filter(h =>
    (actionLabels[h.action] || h.action).toLowerCase().includes(search.toLowerCase()) ||
    h.contract?.name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Audit History</h1>
        <p className="text-gray-500 mt-1">Track all AI audit activities</p>
      </div>

      <div className="mb-4 relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input type="text" value={search} onChange={e => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
          placeholder="Search history..." />
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50"><tr>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Action</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Contract</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Duration</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
          </tr></thead>
          <tbody className="divide-y divide-gray-200">
            {loading ? (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-500">Loading...</td></tr>
            ) : filtered.map(h => (
              <tr key={h.id} onClick={() => navigate(`/audit-history/${h.id}`)} className="hover:bg-gray-50 cursor-pointer transition-colors">
                <td className="px-4 py-3 flex items-center gap-2">
                  <History className="w-4 h-4 text-cyan-500" />
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded ${actionColors[h.action] || 'bg-gray-100 text-gray-700'}`}>
                    {actionLabels[h.action] || h.action}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm text-gray-600">{h.contract?.name || '-'}</td>
                <td className="px-4 py-3 text-sm text-gray-600">{h.user?.firstName} {h.user?.lastName}</td>
                <td className="px-4 py-3"><span className={`text-xs font-semibold px-2 py-0.5 rounded ${h.status === 'COMPLETED' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{h.status}</span></td>
                <td className="px-4 py-3 text-sm text-gray-600">{h.duration ? `${(h.duration / 1000).toFixed(1)}s` : '-'}</td>
                <td className="px-4 py-3 text-sm text-gray-500">{new Date(h.createdAt).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
