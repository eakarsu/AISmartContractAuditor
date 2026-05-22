import React, { useState } from 'react';
import api from '../api/client';

/**
 * SolidityScanPanel
 * ------------------
 * Bespoke custom view (not a chart): textarea where the user pastes Solidity
 * source, click "Scan", and we POST the code to
 * /api/custom-views/scan-solidity. The backend runs a deterministic pattern
 * scan and returns severity-tagged findings with line numbers, which we
 * render below the textarea.
 */

const SAMPLE = `// Sample vulnerable snippet — paste / replace with your own Solidity.
pragma solidity ^0.7.6;

contract VulnerableVault {
    address owner;
    mapping(address => uint) public balances;

    function authorize(address user) public {
        require(tx.origin == owner, "not owner");
    }

    function deadline() public view returns (uint) {
        return block.timestamp + 1 days;
    }

    function withdraw(uint amount) public {
        (bool ok, ) = msg.sender.call{value: amount}("");
        require(ok);
        balances[msg.sender] -= amount;
    }

    function upgrade(address impl, bytes calldata data) external {
        impl.delegatecall(data);
    }
}
`;

const severityBg = {
  CRITICAL: 'bg-red-50 border-red-200 text-red-800',
  HIGH:     'bg-orange-50 border-orange-200 text-orange-800',
  MEDIUM:   'bg-yellow-50 border-yellow-200 text-yellow-800',
  LOW:      'bg-emerald-50 border-emerald-200 text-emerald-800',
};

const badgeBg = {
  CRITICAL: 'bg-red-600',
  HIGH:     'bg-orange-500',
  MEDIUM:   'bg-yellow-500',
  LOW:      'bg-emerald-600',
};

export default function SolidityScanPanel() {
  const [code, setCode] = useState(SAMPLE);
  const [result, setResult] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  async function scan() {
    setBusy(true);
    setError(null);
    try {
      const r = await api.post('/custom-views/scan-solidity', { code });
      setResult(r.data);
    } catch (e) {
      setError(
        e?.response?.data?.error || e?.message || 'Scan failed',
      );
    } finally {
      setBusy(false);
    }
  }

  function reset() {
    setCode('');
    setResult(null);
    setError(null);
  }

  function loadSample() {
    setCode(SAMPLE);
    setResult(null);
    setError(null);
  }

  const findings = result?.findings || [];
  const summary = result?.summary;

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-5">
      <div className="flex items-start justify-between mb-3">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Scan-on-Paste (Solidity)</h2>
          <p className="text-xs text-gray-500">
            Paste Solidity source and scan for known vulnerable patterns
            (<code className="font-mono">tx.origin</code>, <code className="font-mono">block.timestamp</code>,
            <code className="font-mono"> delegatecall</code>, reentrancy, low-level <code className="font-mono">.call</code>, ...).
          </p>
        </div>
        <span className="text-[11px] uppercase tracking-wide text-gray-400 font-mono">custom-view</span>
      </div>

      <textarea
        value={code}
        onChange={(e) => setCode(e.target.value)}
        rows={12}
        spellCheck={false}
        className="w-full font-mono text-xs border border-gray-300 rounded-md p-3 bg-gray-50 focus:bg-white"
        placeholder="// paste Solidity code here..."
      />

      <div className="flex gap-2 mt-3">
        <button
          type="button"
          onClick={scan}
          disabled={busy || !code.trim()}
          className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 text-white text-sm font-medium px-4 py-2 rounded-md"
        >
          {busy ? 'Scanning...' : 'Scan'}
        </button>
        <button
          type="button"
          onClick={loadSample}
          disabled={busy}
          className="bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 text-sm px-3 py-2 rounded-md"
        >
          Load sample
        </button>
        <button
          type="button"
          onClick={reset}
          disabled={busy}
          className="bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 text-sm px-3 py-2 rounded-md"
        >
          Clear
        </button>
      </div>

      {error && (
        <div className="mt-3 bg-red-50 border border-red-200 rounded-md p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {summary && (
        <div className="mt-4 text-sm text-gray-700 flex flex-wrap gap-3">
          <span className="font-semibold">{summary.total}</span> finding(s)
          across {summary.linesScanned} line(s)
          {' '}<span className="text-red-700">C:{summary.critical}</span>
          {' '}<span className="text-orange-700">H:{summary.high}</span>
          {' '}<span className="text-yellow-700">M:{summary.medium}</span>
          {' '}<span className="text-emerald-700">L:{summary.low}</span>
        </div>
      )}

      {result && findings.length === 0 && (
        <div className="mt-3 bg-emerald-50 border border-emerald-200 rounded-md p-3 text-sm text-emerald-800">
          No vulnerable patterns detected in pasted source.
        </div>
      )}

      {findings.length > 0 && (
        <ul className="mt-3 space-y-2">
          {findings.map((f, i) => (
            <li
              key={`${f.pattern}-${f.line}-${i}`}
              className={`border rounded-md p-3 ${severityBg[f.severity] || 'bg-gray-50 border-gray-200'}`}
            >
              <div className="flex items-center gap-2 mb-1">
                <span
                  className={`text-[10px] font-bold tracking-wide text-white px-2 py-0.5 rounded ${badgeBg[f.severity] || 'bg-gray-600'}`}
                >
                  {f.severity}
                </span>
                <span className="font-mono text-xs">line {f.line}</span>
                <span className="font-mono text-xs text-gray-600">[{f.pattern}]</span>
              </div>
              <div className="text-sm">{f.message}</div>
              {f.snippet && (
                <pre className="mt-1 text-[11px] font-mono bg-white/60 border border-gray-200 rounded px-2 py-1 overflow-x-auto">
{f.snippet}
                </pre>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
