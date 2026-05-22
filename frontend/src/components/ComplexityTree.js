import React, { useState } from 'react';

function heatColor(c) {
  if (c >= 15) return '#dc2626';
  if (c >= 10) return '#ea580c';
  if (c >= 6) return '#ca8a04';
  return '#16a34a';
}

function ContractNode({ contract }) {
  const [open, setOpen] = useState(true);
  const total = contract.functions?.length || 0;
  const max = contract.functions?.reduce((a, f) => Math.max(a, f.complexity || 0), 0) || 0;
  const avg = total ? (contract.functions.reduce((a, f) => a + (f.complexity || 0), 0) / total).toFixed(1) : '0.0';

  return (
    <div className="border border-gray-200 rounded-lg mb-3 overflow-hidden bg-white">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 text-left"
      >
        <div className="flex items-center gap-2">
          <span className="text-gray-500 text-sm font-mono">{open ? 'v' : '>'}</span>
          <span className="font-semibold text-gray-900">{contract.name}</span>
          <span className="text-xs text-gray-500">({contract.language || 'SOLIDITY'})</span>
        </div>
        <div className="flex items-center gap-3 text-xs">
          <span className="text-gray-600">{total} fns</span>
          <span className="text-gray-600">avg <strong>{avg}</strong></span>
          <span className="px-2 py-0.5 rounded text-white font-semibold" style={{ background: heatColor(max) }}>
            max {max}
          </span>
        </div>
      </button>

      {open && (
        <div className="border-t border-gray-200 divide-y divide-gray-100">
          {(contract.functions || []).map((fn, i) => {
            const widthPct = Math.min(100, Math.max(5, (fn.complexity / 25) * 100));
            return (
              <div key={i} className="px-4 py-2 flex items-center gap-3 hover:bg-gray-50">
                <span className="text-gray-400 font-mono text-xs w-6 text-right">{i + 1}.</span>
                <span className="font-mono text-sm text-gray-900 min-w-[180px] truncate">{fn.name}</span>
                <span className="text-xs text-gray-500 w-20">{fn.visibility || 'public'}</span>
                <span className="text-xs text-gray-500 w-16">{fn.loc} LOC</span>
                <div className="flex-1 h-3 bg-gray-100 rounded relative overflow-hidden">
                  <div
                    className="h-full"
                    style={{ width: `${widthPct}%`, background: heatColor(fn.complexity) }}
                  />
                </div>
                <span
                  className="text-xs font-bold w-12 text-right"
                  style={{ color: heatColor(fn.complexity) }}
                >
                  CC {fn.complexity}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function ComplexityTree({ data }) {
  const contracts = (data && data.contracts) || [];
  const total = (data && data.totalFunctions) || contracts.reduce((a, c) => a + (c.functions?.length || 0), 0);

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-4">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="text-base font-semibold text-gray-900">Code Complexity Tree</h3>
          <p className="text-xs text-gray-500">
            Collapsible per-contract function tree with cyclomatic complexity heat
          </p>
        </div>
        <div className="flex items-center gap-3 text-xs">
          {[
            { l: 'low', c: 3 },
            { l: 'med', c: 7 },
            { l: 'high', c: 12 },
            { l: 'critical', c: 18 },
          ].map((b) => (
            <div key={b.l} className="flex items-center gap-1">
              <span className="inline-block w-3 h-3 rounded-sm" style={{ background: heatColor(b.c) }} />
              <span className="text-gray-700">{b.l}</span>
            </div>
          ))}
          <span className="text-gray-500 ml-2">
            Functions: <strong className="text-gray-900">{total}</strong>
          </span>
        </div>
      </div>
      <div className="max-h-[520px] overflow-y-auto pr-1">
        {contracts.length === 0 ? (
          <div className="text-sm text-gray-500 p-4">No contracts available.</div>
        ) : (
          contracts.map((c) => <ContractNode key={c.id || c.name} contract={c} />)
        )}
      </div>
    </div>
  );
}
