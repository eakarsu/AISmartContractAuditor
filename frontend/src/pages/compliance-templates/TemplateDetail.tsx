import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../api/client';
import { Edit, Trash2, ArrowLeft, CheckCircle, XCircle } from 'lucide-react';

export default function TemplateDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [template, setTemplate] = useState<any>(null);
  const [showDelete, setShowDelete] = useState(false);

  useEffect(() => { api.get(`/compliance-templates/${id}`).then(res => setTemplate(res.data)); }, [id]);

  const handleDelete = async () => { await api.delete(`/compliance-templates/${id}`); navigate('/compliance-templates'); };

  if (!template) return <div className="text-center py-8 text-gray-500">Loading...</div>;

  const rules = Array.isArray(template.rules) ? template.rules : [];

  return (
    <div>
      <button onClick={() => navigate('/compliance-templates')} className="flex items-center gap-1 text-gray-500 hover:text-gray-700 mb-4"><ArrowLeft className="w-4 h-4" /> Back</button>

      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{template.name}</h1>
            <div className="flex items-center gap-2 mt-1">
              <span className="bg-orange-100 text-orange-700 px-2 py-0.5 rounded text-xs font-medium">{template.standard}</span>
              <span className="text-xs text-gray-500">v{template.version}</span>
              <span className={`text-xs px-2 py-0.5 rounded ${template.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>{template.isActive ? 'Active' : 'Inactive'}</span>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={() => navigate(`/compliance-templates/${id}/edit`)} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"><Edit className="w-4 h-4" /> Edit</button>
            <button onClick={() => setShowDelete(true)} className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"><Trash2 className="w-4 h-4" /> Delete</button>
          </div>
        </div>

        {template.description && <p className="text-gray-600 mb-4">{template.description}</p>}

        <h3 className="text-lg font-semibold text-gray-800 mb-3">Rules ({rules.length})</h3>
        <div className="space-y-2">
          {rules.map((rule: any, i: number) => (
            <div key={i} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              {rule.required ? <CheckCircle className="w-4 h-4 text-red-500 flex-shrink-0" /> : <XCircle className="w-4 h-4 text-gray-400 flex-shrink-0" />}
              <span className="text-sm font-mono text-gray-800">{rule.rule}</span>
              <span className={`text-xs px-2 py-0.5 rounded ${rule.required ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-600'}`}>{rule.required ? 'Required' : 'Optional'}</span>
            </div>
          ))}
        </div>
      </div>

      {showDelete && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-bold text-gray-900 mb-2">Delete Template?</h3>
            <p className="text-gray-600 mb-4">This will permanently delete "{template.name}".</p>
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
