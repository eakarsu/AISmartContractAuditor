import React, { useEffect, useState } from 'react';
import api from '../api/client';

/**
 * AuditReportExporter
 * --------------------
 * Bespoke custom view (not a chart): contract picker + "Generate Report"
 * button. POSTs to /api/custom-views/audit-report?contract_id=<id> and
 * streams the resulting PDF to the user.
 *
 * Backend is responsible for the actual PDF generation (pdfkit) — this
 * component is purely UI + download wiring.
 */
export default function AuditReportExporter() {
  const [contracts, setContracts] = useState([]);
  const [selected, setSelected] = useState('');
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [lastReport, setLastReport] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const r = await api.get('/custom-views/contracts');
        if (cancelled) return;
        const list = r.data?.contracts || [];
        setContracts(list);
        if (list.length > 0) setSelected(list[0].id);
      } catch (e) {
        if (!cancelled) {
          setError(
            e?.response?.data?.error || e?.message || 'Failed to load contract list',
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  async function generate() {
    if (!selected) {
      setError('Select a contract first');
      return;
    }
    setBusy(true);
    setError(null);
    setLastReport(null);
    try {
      const resp = await api.post(
        `/custom-views/audit-report?contract_id=${encodeURIComponent(selected)}`,
        {},
        { responseType: 'blob' },
      );
      const blob = new Blob([resp.data], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const name = (contracts.find((c) => c.id === selected) || {}).name || 'contract';
      const a = document.createElement('a');
      a.href = url;
      a.download = `audit-report-${name.replace(/[^a-z0-9]+/gi, '_')}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 4000);
      setLastReport({ name, contractId: selected, bytes: blob.size, at: new Date().toLocaleTimeString() });
    } catch (e) {
      setError(
        e?.response?.data?.error || e?.message || 'Report generation failed',
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-5">
      <div className="flex items-start justify-between mb-3">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Audit Report PDF Export</h2>
          <p className="text-xs text-gray-500">
            Pick a contract and generate a downloadable PDF audit report (executive summary,
            severity-tagged vulnerabilities, remediation recommendations).
          </p>
        </div>
        <span className="text-[11px] uppercase tracking-wide text-gray-400 font-mono">custom-view</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-3 items-end">
        <label className="block text-sm">
          <span className="text-gray-700">Contract</span>
          <select
            value={selected}
            onChange={(e) => setSelected(e.target.value)}
            disabled={loading || busy}
            className="mt-1 w-full border border-gray-300 rounded-md px-3 py-2 text-sm bg-white"
          >
            {loading && <option>Loading...</option>}
            {!loading && contracts.length === 0 && <option value="">No contracts found</option>}
            {!loading &&
              contracts.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.language || 'SOLIDITY'})
                </option>
              ))}
          </select>
        </label>

        <button
          type="button"
          onClick={generate}
          disabled={busy || loading || !selected}
          className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 text-white text-sm font-medium px-4 py-2 rounded-md"
        >
          {busy ? 'Generating...' : 'Generate Report'}
        </button>
      </div>

      {error && (
        <div className="mt-3 bg-red-50 border border-red-200 rounded-md p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {lastReport && (
        <div className="mt-3 bg-emerald-50 border border-emerald-200 rounded-md p-3 text-xs text-emerald-800">
          Downloaded <span className="font-semibold">{lastReport.name}</span> (
          {(lastReport.bytes / 1024).toFixed(1)} KB) at {lastReport.at}.
        </div>
      )}
    </div>
  );
}
