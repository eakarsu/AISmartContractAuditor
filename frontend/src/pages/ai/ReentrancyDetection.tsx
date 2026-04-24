import React, { useEffect, useState } from 'react';
import api from '../../api/client';
import { Lock, Loader2 } from 'lucide-react';
import { ReentrancyDetectionResult } from '../../components/AIResultDisplay';

export default function ReentrancyDetection() {
  const [contracts, setContracts] = useState<any[]>([]);
  const [contractId, setContractId] = useState('');
  const [sourceCode, setSourceCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState('');

  useEffect(() => { api.get('/contracts').then(res => setContracts(res.data)); }, []);

  const handleContractSelect = (id: string) => {
    setContractId(id);
    const c = contracts.find(c => c.id === id);
    if (c) setSourceCode(c.sourceCode);
  };

  const handleSubmit = async () => {
    if (!sourceCode.trim()) return;
    setLoading(true); setError(''); setResult(null);
    try {
      const res = await api.post('/ai/reentrancy-detection', { sourceCode, contractId: contractId || undefined });
      setResult(res.data);
    } catch (err: any) { setError(err.response?.data?.error || 'Detection failed'); }
    finally { setLoading(false); }
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2"><Lock className="w-6 h-6 text-pink-500" /> Reentrancy Detection</h1>
        <p className="text-gray-500 mt-1">Specialized AI detection of reentrancy attack patterns</p>
      </div>
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Select Contract</label>
          <select value={contractId} onChange={e => handleContractSelect(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none">
            <option value="">-- Paste code manually --</option>
            {contracts.map(c => <option key={c.id} value={c.id}>{c.name} ({c.language})</option>)}
          </select>
        </div>
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Solidity Source Code</label>
          <textarea value={sourceCode} onChange={e => setSourceCode(e.target.value)} rows={12}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none font-mono text-sm"
            placeholder="Paste your Solidity smart contract source code here..." />
        </div>
        <button onClick={handleSubmit} disabled={loading || !sourceCode.trim()}
          className="flex items-center gap-2 px-6 py-2.5 bg-pink-600 text-white rounded-lg hover:bg-pink-700 disabled:opacity-50 font-medium transition-colors">
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
          {loading ? 'Detecting...' : 'Detect Reentrancy'}
        </button>
      </div>
      {error && <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">{error}</div>}
      {result && <ReentrancyDetectionResult data={result} />}
    </div>
  );
}
