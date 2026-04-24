import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../api/client';
import { ArrowLeft, Save } from 'lucide-react';

export default function AuditReportForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);
  const [contracts, setContracts] = useState<any[]>([]);
  const [form, setForm] = useState({
    title: '', contractId: '', status: 'PENDING', overallScore: '', gasScore: '', securityScore: '', codeQualityScore: '', complianceScore: '', summary: '',
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get('/contracts').then(res => setContracts(res.data));
    if (isEdit) {
      api.get(`/audits/${id}`).then(res => {
        const a = res.data;
        setForm({
          title: a.title, contractId: a.contractId, status: a.status,
          overallScore: a.overallScore?.toString() || '', gasScore: a.gasScore?.toString() || '',
          securityScore: a.securityScore?.toString() || '', codeQualityScore: a.codeQualityScore?.toString() || '',
          complianceScore: a.complianceScore?.toString() || '', summary: a.summary || '',
        });
      });
    }
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const data = {
        ...form,
        overallScore: form.overallScore ? parseFloat(form.overallScore) : null,
        gasScore: form.gasScore ? parseFloat(form.gasScore) : null,
        securityScore: form.securityScore ? parseFloat(form.securityScore) : null,
        codeQualityScore: form.codeQualityScore ? parseFloat(form.codeQualityScore) : null,
        complianceScore: form.complianceScore ? parseFloat(form.complianceScore) : null,
      };
      if (isEdit) await api.put(`/audits/${id}`, data);
      else await api.post('/audits', data);
      navigate('/audits');
    } catch (err: any) {
      alert(err.response?.data?.error || 'Error saving');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <button onClick={() => navigate('/audits')} className="flex items-center gap-1 text-gray-500 hover:text-gray-700 mb-4"><ArrowLeft className="w-4 h-4" /> Back</button>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">{isEdit ? 'Edit' : 'New'} Audit Report</h1>
      <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
            <input type="text" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Contract *</label>
            <select value={form.contractId} onChange={e => setForm({ ...form, contractId: e.target.value })} required className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none">
              <option value="">Select...</option>
              {contracts.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none">
              <option value="PENDING">Pending</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="COMPLETED">Completed</option>
              <option value="FAILED">Failed</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Overall Score</label>
            <input type="number" min="0" max="100" value={form.overallScore} onChange={e => setForm({ ...form, overallScore: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none" />
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {(['gasScore', 'securityScore', 'codeQualityScore', 'complianceScore'] as const).map(key => (
            <div key={key}>
              <label className="block text-sm font-medium text-gray-700 mb-1">{key.replace('Score', ' Score').replace(/([A-Z])/g, ' $1').trim()}</label>
              <input type="number" min="0" max="100" value={(form as any)[key]} onChange={e => setForm({ ...form, [key]: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none" />
            </div>
          ))}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Summary</label>
          <textarea value={form.summary} onChange={e => setForm({ ...form, summary: e.target.value })} rows={3} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none" />
        </div>
        <div className="flex justify-end gap-3">
          <button type="button" onClick={() => navigate('/audits')} className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">Cancel</button>
          <button type="submit" disabled={saving} className="flex items-center gap-2 px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50"><Save className="w-4 h-4" /> {saving ? 'Saving...' : 'Save'}</button>
        </div>
      </form>
    </div>
  );
}
