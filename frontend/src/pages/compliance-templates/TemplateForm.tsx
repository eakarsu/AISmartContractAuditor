import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../api/client';
import { ArrowLeft, Save, Plus, X } from 'lucide-react';

export default function TemplateForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);
  const [form, setForm] = useState({ name: '', standard: 'ERC20', description: '', version: '1.0', isActive: true });
  const [rules, setRules] = useState<{ rule: string; required: boolean }[]>([{ rule: '', required: true }]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isEdit) {
      api.get(`/compliance-templates/${id}`).then(res => {
        const t = res.data;
        setForm({ name: t.name, standard: t.standard, description: t.description || '', version: t.version, isActive: t.isActive });
        setRules(Array.isArray(t.rules) ? t.rules : []);
      });
    }
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const data = { ...form, rules: rules.filter(r => r.rule.trim()) };
      if (isEdit) await api.put(`/compliance-templates/${id}`, data);
      else await api.post('/compliance-templates', data);
      navigate('/compliance-templates');
    } catch (err: any) {
      alert(err.response?.data?.error || 'Error saving');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <button onClick={() => navigate('/compliance-templates')} className="flex items-center gap-1 text-gray-500 hover:text-gray-700 mb-4"><ArrowLeft className="w-4 h-4" /> Back</button>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">{isEdit ? 'Edit' : 'New'} Compliance Template</h1>
      <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
            <input type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Standard</label>
            <select value={form.standard} onChange={e => setForm({ ...form, standard: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none">
              {['ERC20', 'ERC721', 'ERC1155', 'ERC777', 'ERC4626', 'CUSTOM'].map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Version</label>
            <input type="text" value={form.version} onChange={e => setForm({ ...form, version: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none" />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
          <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={2} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none" />
        </div>
        <div className="flex items-center gap-2">
          <input type="checkbox" checked={form.isActive} onChange={e => setForm({ ...form, isActive: e.target.checked })} className="rounded" />
          <label className="text-sm text-gray-700">Active</label>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm font-medium text-gray-700">Rules</label>
            <button type="button" onClick={() => setRules([...rules, { rule: '', required: true }])} className="flex items-center gap-1 text-sm text-emerald-600 hover:text-emerald-700"><Plus className="w-3 h-3" /> Add Rule</button>
          </div>
          {rules.map((r, i) => (
            <div key={i} className="flex items-center gap-2 mb-2">
              <input type="text" value={r.rule} onChange={e => { const nr = [...rules]; nr[i].rule = e.target.value; setRules(nr); }}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none font-mono text-sm" placeholder="e.g., totalSupply()" />
              <label className="flex items-center gap-1 text-sm text-gray-600 whitespace-nowrap">
                <input type="checkbox" checked={r.required} onChange={e => { const nr = [...rules]; nr[i].required = e.target.checked; setRules(nr); }} className="rounded" /> Req
              </label>
              <button type="button" onClick={() => setRules(rules.filter((_, j) => j !== i))} className="p-1 text-gray-400 hover:text-red-500"><X className="w-4 h-4" /></button>
            </div>
          ))}
        </div>

        <div className="flex justify-end gap-3">
          <button type="button" onClick={() => navigate('/compliance-templates')} className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">Cancel</button>
          <button type="submit" disabled={saving} className="flex items-center gap-2 px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50"><Save className="w-4 h-4" /> {saving ? 'Saving...' : 'Save'}</button>
        </div>
      </form>
    </div>
  );
}
