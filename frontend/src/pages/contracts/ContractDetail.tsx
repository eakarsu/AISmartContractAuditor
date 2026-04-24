import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../api/client';
import { Light as SyntaxHighlighter } from 'react-syntax-highlighter';
import { atomOneDark } from 'react-syntax-highlighter/dist/esm/styles/hljs';
import { Edit, Trash2, ArrowLeft } from 'lucide-react';

export default function ContractDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [contract, setContract] = useState<any>(null);
  const [showDelete, setShowDelete] = useState(false);

  useEffect(() => {
    api.get(`/contracts/${id}`).then(res => setContract(res.data));
  }, [id]);

  const handleDelete = async () => {
    await api.delete(`/contracts/${id}`);
    navigate('/contracts');
  };

  if (!contract) return <div className="text-center py-8 text-gray-500">Loading...</div>;

  return (
    <div>
      <button onClick={() => navigate('/contracts')} className="flex items-center gap-1 text-gray-500 hover:text-gray-700 mb-4">
        <ArrowLeft className="w-4 h-4" /> Back to Contracts
      </button>

      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold text-gray-900">{contract.name}</h1>
          <div className="flex gap-2">
            <button onClick={() => navigate(`/contracts/${id}/edit`)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
              <Edit className="w-4 h-4" /> Edit
            </button>
            <button onClick={() => setShowDelete(true)}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors">
              <Trash2 className="w-4 h-4" /> Delete
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div><p className="text-xs text-gray-500">Language</p><p className="font-medium">{contract.language}</p></div>
          <div><p className="text-xs text-gray-500">Version</p><p className="font-medium">{contract.version || '-'}</p></div>
          <div><p className="text-xs text-gray-500">File</p><p className="font-medium">{contract.fileName}</p></div>
          <div><p className="text-xs text-gray-500">Project</p><p className="font-medium">{contract.project?.name || '-'}</p></div>
        </div>

        {contract.description && <p className="text-gray-600 mb-4">{contract.description}</p>}

        <h3 className="text-lg font-semibold text-gray-800 mb-2">Source Code</h3>
        <SyntaxHighlighter language="solidity" style={atomOneDark} className="rounded-lg text-sm" showLineNumbers>
          {contract.sourceCode}
        </SyntaxHighlighter>
      </div>

      {contract.vulnerabilities?.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Vulnerabilities ({contract.vulnerabilities.length})</h3>
          {contract.vulnerabilities.map((v: any) => (
            <div key={v.id} className="border-b border-gray-100 py-3 last:border-0">
              <div className="flex items-center gap-2">
                <span className={`text-xs font-semibold px-2 py-0.5 rounded ${v.severity === 'CRITICAL' ? 'bg-red-100 text-red-700' : v.severity === 'HIGH' ? 'bg-orange-100 text-orange-700' : 'bg-yellow-100 text-yellow-700'}`}>{v.severity}</span>
                <span className="font-medium text-gray-800">{v.title}</span>
              </div>
              <p className="text-sm text-gray-600 mt-1">{v.description}</p>
            </div>
          ))}
        </div>
      )}

      {showDelete && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-bold text-gray-900 mb-2">Delete Contract?</h3>
            <p className="text-gray-600 mb-4">This will permanently delete "{contract.name}" and all associated data.</p>
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
