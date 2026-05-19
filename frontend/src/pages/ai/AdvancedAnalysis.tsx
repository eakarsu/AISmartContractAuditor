import React, { useEffect, useState } from 'react';
import api from '../../api/client';
import { Layers, Loader2 } from 'lucide-react';

type Tool =
  | 'contract-pattern-recognition'
  | 'gas-estimation'
  | 'fork-analysis'
  | 'upgrade-path-recommendation'
  | 'formal-verification-suggestion';

const TOOLS: { id: Tool; label: string; description: string }[] = [
  {
    id: 'contract-pattern-recognition',
    label: 'Pattern Recognition',
    description: 'Identify safe + risky patterns, anti-patterns, and inheritance/library usage.',
  },
  {
    id: 'gas-estimation',
    label: 'Gas Estimation',
    description: 'Deployment + per-function gas estimates with optimization opportunities.',
  },
  {
    id: 'fork-analysis',
    label: 'Fork Analysis',
    description: 'Detect fork relationships to known protocols, inherited vulnerabilities, license consistency.',
  },
  {
    id: 'upgrade-path-recommendation',
    label: 'Upgrade Path',
    description: 'Recommend safest upgrade pattern (Proxy/UUPS/Beacon/Diamond) and migration steps.',
  },
  {
    id: 'formal-verification-suggestion',
    label: 'Formal Verification',
    description: 'Suggest invariants and tooling (Certora, Foundry, Halmos, KEVM, SMTChecker).',
  },
];

export default function AdvancedAnalysis() {
  const [tool, setTool] = useState<Tool>('contract-pattern-recognition');
  const [contracts, setContracts] = useState<any[]>([]);
  const [contractId, setContractId] = useState('');
  const [sourceCode, setSourceCode] = useState('');
  const [language, setLanguage] = useState('Solidity');
  const [expectedFunctions, setExpectedFunctions] = useState('');
  const [similarContractName, setSimilarContractName] = useState('');
  const [currentPattern, setCurrentPattern] = useState('');
  const [targetGoal, setTargetGoal] = useState('');
  const [propertiesOfInterest, setPropertiesOfInterest] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/contracts').then(res => setContracts(res.data)).catch(() => {});
  }, []);

  const handleContractSelect = (id: string) => {
    setContractId(id);
    const c = contracts.find(c => c.id === id);
    if (c) {
      setSourceCode(c.sourceCode);
      setLanguage(c.language === 'MOVE' ? 'Move' : 'Solidity');
    }
  };

  const handleSubmit = async () => {
    if (!sourceCode.trim() && !contractId) {
      setError('Provide source code or pick a contract.');
      return;
    }
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const body: any = { contractId: contractId || undefined };
      if (sourceCode.trim()) body.sourceCode = sourceCode;
      if (tool === 'contract-pattern-recognition') body.language = language;
      if (tool === 'gas-estimation') {
        body.expectedFunctions = expectedFunctions
          .split(',')
          .map(s => s.trim())
          .filter(Boolean);
      }
      if (tool === 'fork-analysis') body.similarContractName = similarContractName || undefined;
      if (tool === 'upgrade-path-recommendation') {
        body.currentPattern = currentPattern || undefined;
        body.targetGoal = targetGoal || undefined;
      }
      if (tool === 'formal-verification-suggestion') {
        body.propertiesOfInterest = propertiesOfInterest
          .split(',')
          .map(s => s.trim())
          .filter(Boolean);
      }

      const res = await api.post(`/ai/${tool}`, body);
      setResult(res.data);
    } catch (err: any) {
      const status = err?.response?.status;
      const msg = err?.response?.data?.error || err?.message || 'Analysis failed';
      if (status === 503) {
        setError('AI service unavailable (likely missing OPENROUTER_API_KEY on the backend).');
      } else {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  const active = TOOLS.find(t => t.id === tool)!;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Layers className="w-6 h-6 text-purple-500" /> Advanced Analysis
        </h1>
        <p className="text-gray-500 mt-1">
          Pattern recognition, gas estimation, and fork detection.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
        {TOOLS.map(t => (
          <button
            key={t.id}
            onClick={() => { setTool(t.id); setResult(null); setError(''); }}
            className={`text-left p-4 rounded-xl border transition-colors ${
              tool === t.id
                ? 'bg-purple-600 text-white border-purple-600'
                : 'bg-white text-gray-900 border-gray-200 hover:border-purple-400'
            }`}
          >
            <div className="font-semibold">{t.label}</div>
            <div className={`text-xs mt-1 ${tool === t.id ? 'text-purple-100' : 'text-gray-500'}`}>
              {t.description}
            </div>
          </button>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Select Contract</label>
            <select
              value={contractId}
              onChange={e => handleContractSelect(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
            >
              <option value="">-- Paste code manually --</option>
              {contracts.map(c => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.language})
                </option>
              ))}
            </select>
          </div>
          {tool === 'contract-pattern-recognition' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Language</label>
              <select
                value={language}
                onChange={e => setLanguage(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
              >
                <option>Solidity</option>
                <option>Move</option>
                <option>Vyper</option>
                <option>Rust</option>
              </select>
            </div>
          )}
          {tool === 'gas-estimation' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Expected Functions <span className="text-gray-400">(comma-separated, optional)</span>
              </label>
              <input
                value={expectedFunctions}
                onChange={e => setExpectedFunctions(e.target.value)}
                placeholder="transfer, approve, mint"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
              />
            </div>
          )}
          {tool === 'fork-analysis' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Suspected Origin <span className="text-gray-400">(optional)</span>
              </label>
              <input
                value={similarContractName}
                onChange={e => setSimilarContractName(e.target.value)}
                placeholder="UniswapV2, Compound, ..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
              />
            </div>
          )}
          {tool === 'upgrade-path-recommendation' && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Current Upgrade Pattern <span className="text-gray-400">(optional)</span>
                </label>
                <input
                  value={currentPattern}
                  onChange={e => setCurrentPattern(e.target.value)}
                  placeholder="non-upgradeable / TransparentProxy / UUPS / ..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Target Goal <span className="text-gray-400">(optional)</span>
                </label>
                <input
                  value={targetGoal}
                  onChange={e => setTargetGoal(e.target.value)}
                  placeholder="add upgradeability with minimal risk"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
                />
              </div>
            </>
          )}
          {tool === 'formal-verification-suggestion' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Properties Of Interest <span className="text-gray-400">(comma-separated, optional)</span>
              </label>
              <input
                value={propertiesOfInterest}
                onChange={e => setPropertiesOfInterest(e.target.value)}
                placeholder="totalSupply invariant, no-reentrancy, access control"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
              />
            </div>
          )}
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Source Code</label>
          <textarea
            value={sourceCode}
            onChange={e => setSourceCode(e.target.value)}
            rows={12}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none font-mono text-sm"
            placeholder="Paste your smart contract source code here, or select a contract above."
          />
        </div>

        <button
          onClick={handleSubmit}
          disabled={loading}
          className="flex items-center gap-2 px-6 py-2.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 font-medium transition-colors"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Layers className="w-4 h-4" />}
          {loading ? 'Analyzing...' : `Run ${active.label}`}
        </button>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
          {error}
        </div>
      )}

      {result && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">Result</h2>
          <pre className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-xs overflow-x-auto whitespace-pre-wrap break-words">
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}
