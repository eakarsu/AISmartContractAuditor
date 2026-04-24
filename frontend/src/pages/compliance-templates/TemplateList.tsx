import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/client';
import { Plus, ClipboardList, Search } from 'lucide-react';

export default function TemplateList() {
  const [templates, setTemplates] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/compliance-templates').then(res => { setTemplates(res.data); setLoading(false); });
  }, []);

  const filtered = templates.filter(t =>
    t.name.toLowerCase().includes(search.toLowerCase()) ||
    t.standard.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Compliance Templates</h1>
          <p className="text-gray-500 mt-1">Manage compliance rule templates for standards</p>
        </div>
        <button onClick={() => navigate('/compliance-templates/new')}
          className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors font-medium">
          <Plus className="w-4 h-4" /> New Template
        </button>
      </div>

      <div className="mb-4 relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input type="text" value={search} onChange={e => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
          placeholder="Search templates..." />
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50"><tr>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Standard</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rules</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Version</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Active</th>
          </tr></thead>
          <tbody className="divide-y divide-gray-200">
            {loading ? (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-500">Loading...</td></tr>
            ) : filtered.map(t => (
              <tr key={t.id} onClick={() => navigate(`/compliance-templates/${t.id}`)} className="hover:bg-gray-50 cursor-pointer transition-colors">
                <td className="px-4 py-3 flex items-center gap-2"><ClipboardList className="w-4 h-4 text-orange-500" /><span className="font-medium text-gray-800">{t.name}</span></td>
                <td className="px-4 py-3"><span className="bg-orange-100 text-orange-700 px-2 py-0.5 rounded text-xs font-medium">{t.standard}</span></td>
                <td className="px-4 py-3 text-sm text-gray-600">{Array.isArray(t.rules) ? t.rules.length : 0}</td>
                <td className="px-4 py-3 text-sm text-gray-600">{t.version}</td>
                <td className="px-4 py-3"><span className={`w-2 h-2 rounded-full inline-block ${t.isActive ? 'bg-green-500' : 'bg-gray-300'}`} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
