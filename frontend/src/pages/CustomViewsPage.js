import React, { useEffect, useState } from 'react';
import api from '../api/client';
import VulnTreemap from '../components/VulnTreemap';
import ComplexityTree from '../components/ComplexityTree';
import AuditReportExporter from '../components/AuditReportExporter';
import SolidityScanPanel from '../components/SolidityScanPanel';

export default function CustomViewsPage() {
  const [treemap, setTreemap] = useState(null);
  const [tree, setTree] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const [a, b] = await Promise.all([
          api.get('/custom-views/vuln-treemap'),
          api.get('/custom-views/complexity-tree'),
        ]);
        if (!cancelled) {
          setTreemap(a.data);
          setTree(b.data);
        }
      } catch (e) {
        if (!cancelled) {
          setError(e?.response?.data?.error || e?.message || 'Failed to load custom views');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Security Views</h1>
        <p className="text-sm text-gray-500">
          Bespoke security dashboards: vulnerability treemap and contract complexity tree.
        </p>
      </div>

      {loading && (
        <div className="bg-white border border-gray-200 rounded-lg p-6 text-sm text-gray-500">
          Loading custom views...
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {treemap && <VulnTreemap data={treemap} />}
      {tree && <ComplexityTree data={tree} />}

      {(treemap || tree) && (
        <div className="text-xs text-gray-400">
          Treemap source: <span className="font-mono">{treemap?.source}</span>
          {' | '}Tree source: <span className="font-mono">{tree?.source}</span>
        </div>
      )}

      {/* Bespoke non-visualization custom views */}
      <AuditReportExporter />
      <SolidityScanPanel />
    </div>
  );
}
