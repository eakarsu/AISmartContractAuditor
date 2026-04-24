import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/client';
import { Plus, Shield, Search } from 'lucide-react';

const statusColors: Record<string, string> = {
  COMPLETED: 'bg-green-100 text-green-700',
  IN_PROGRESS: 'bg-blue-100 text-blue-700',
  PENDING: 'bg-yellow-100 text-yellow-700',
  FAILED: 'bg-red-100 text-red-700',
};

export default function AuditReportList() {
  const [audits, setAudits] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/audits').then(res => { setAudits(res.data); setLoading(false); });
  }, []);

  const filtered = audits.filter(a =>
    a.title.toLowerCase().includes(search.toLowerCase()) ||
    a.contract?.name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Audit Reports</h1>
          <p className="text-gray-500 mt-1">Manage smart contract audit reports</p>
        </div>
        <button onClick={() => navigate('/audits/new')}
          className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors font-medium">
          <Plus className="w-4 h-4" /> New Report
        </button>
      </div>

      <div className="mb-4 relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input type="text" value={search} onChange={e => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
          placeholder="Search reports..." />
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50"><tr>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Title</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Contract</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Score</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Vulns</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
          </tr></thead>
          <tbody className="divide-y divide-gray-200">
            {loading ? (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-500">Loading...</td></tr>
            ) : filtered.map(a => (
              <tr key={a.id} onClick={() => navigate(`/audits/${a.id}`)} className="hover:bg-gray-50 cursor-pointer transition-colors">
                <td className="px-4 py-3 flex items-center gap-2"><Shield className="w-4 h-4 text-emerald-500" /><span className="font-medium text-gray-800">{a.title}</span></td>
                <td className="px-4 py-3 text-sm text-gray-600">{a.contract?.name || '-'}</td>
                <td className="px-4 py-3"><span className={`text-xs font-semibold px-2 py-0.5 rounded ${statusColors[a.status]}`}>{a.status}</span></td>
                <td className="px-4 py-3 text-sm font-medium">{a.overallScore != null ? `${a.overallScore}/100` : '-'}</td>
                <td className="px-4 py-3 text-sm">{a.vulnerabilities?.length || 0}</td>
                <td className="px-4 py-3 text-sm text-gray-500">{new Date(a.createdAt).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
