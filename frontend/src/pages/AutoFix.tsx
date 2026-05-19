import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/client';
import { Wrench, ArrowLeft, Loader2, CheckCircle, AlertTriangle } from 'lucide-react';

const SEV_COLORS: Record<string, string> = {
  CRITICAL: 'bg-red-100 text-red-800',
  HIGH: 'bg-orange-100 text-orange-800',
  MEDIUM: 'bg-yellow-100 text-yellow-800',
  LOW: 'bg-blue-100 text-blue-800',
  INFORMATIONAL: 'bg-gray-100 text-gray-700',
};

export default function AutoFix() {
  const { vulnerabilityId } = useParams<{ vulnerabilityId: string }>();
  const navigate = useNavigate();
  const [vulnerability, setVulnerability] = useState<any>(null);
  const [loadingVuln, setLoadingVuln] = useState(true);
  const [fixing, setFixing] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState('');
  const [showDiff, setShowDiff] = useState(false);

  useEffect(() => {
    loadVulnerability();
  }, [vulnerabilityId]);

  const loadVulnerability = async () => {
    setLoadingVuln(true);
    try {
      // Try to find via audit reports
      const auditsRes = await api.get('/audits');
      for (const audit of auditsRes.data) {
        const found = audit.vulnerabilities?.find((v: any) => v.id === vulnerabilityId);
        if (found) {
          setVulnerability({ ...found, contractName: audit.contract?.name });
          break;
        }
      }
    } catch (err: any) {
      setError('Failed to load vulnerability');
    } finally {
      setLoadingVuln(false);
    }
  };

  const handleGenerateFix = async () => {
    if (!vulnerabilityId) return;
    setFixing(true);
    setError('');
    setResult(null);
    try {
      const res = await api.post(`/ai/auto-fix/${vulnerabilityId}`);
      setResult(res.data);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to generate fix');
    } finally {
      setFixing(false);
    }
  };

  if (loadingVuln) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-2 rounded-lg hover:bg-gray-100">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Wrench className="w-6 h-6 text-blue-500" /> Auto-Fix Generator
          </h1>
          <p className="text-gray-500 mt-0.5">AI-generated patch for vulnerability remediation</p>
        </div>
      </div>

      {/* Vulnerability Details */}
      {vulnerability ? (
        <div className="bg-white border border-gray-200 rounded-xl p-5 mb-5">
          <div className="flex items-center gap-2 mb-2">
            <span className={`text-xs font-bold px-2 py-0.5 rounded ${SEV_COLORS[vulnerability.severity] || ''}`}>
              {vulnerability.severity}
            </span>
            <h2 className="font-semibold text-gray-900">{vulnerability.title}</h2>
          </div>
          {vulnerability.contractName && (
            <div className="text-sm text-gray-500 mb-2">Contract: {vulnerability.contractName}</div>
          )}
          <div className="text-sm text-gray-700 mb-3">{vulnerability.description}</div>
          {vulnerability.codeSnippet && (
            <div className="mb-3">
              <div className="text-xs font-medium text-gray-500 mb-1">Vulnerable Code:</div>
              <pre className="bg-red-50 border border-red-200 rounded-lg p-3 text-xs overflow-x-auto text-red-800">
                {vulnerability.codeSnippet}
              </pre>
            </div>
          )}
          {vulnerability.recommendation && (
            <div className="text-sm text-emerald-700 bg-emerald-50 rounded p-3">
              <span className="font-medium">Recommendation:</span> {vulnerability.recommendation}
            </div>
          )}
        </div>
      ) : (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-5 text-amber-800">
          <AlertTriangle className="w-5 h-5 inline mr-2" />
          Vulnerability details not found. You can still generate a fix using the vulnerability ID.
        </div>
      )}

      {/* Generate Button */}
      {(!result || !result.fix) && (
        <button
          onClick={handleGenerateFix}
          disabled={fixing}
          className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors mb-5"
        >
          {fixing ? (
            <><Loader2 className="w-4 h-4 animate-spin" /> Generating Fix...</>
          ) : (
            <><Wrench className="w-4 h-4" /> Generate Auto-Fix</>
          )}
        </button>
      )}

      {error && (
        <div className="p-4 bg-red-50 text-red-700 rounded-xl mb-5">
          {error}
        </div>
      )}

      {/* Fix Results */}
      {result?.fix && (
        <div className="space-y-4">
          {/* Status */}
          <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
            <div>
              <div className="font-semibold text-green-800">Fix Generated Successfully</div>
              <div className="text-sm text-green-700 mt-0.5">Status: {result.fix.status}</div>
            </div>
          </div>

          {/* Explanation */}
          {result.fix.explanation && (
            <div className="bg-white border border-gray-200 rounded-xl p-5">
              <h3 className="font-semibold text-gray-900 mb-2">Explanation</h3>
              <p className="text-sm text-gray-700">{result.fix.explanation}</p>
            </div>
          )}

          {/* Diff Summary */}
          {result.fix.diffSummary && (
            <div className="bg-white border border-gray-200 rounded-xl p-5">
              <h3 className="font-semibold text-gray-900 mb-2">Changes Summary</h3>
              <p className="text-sm text-gray-700">{result.fix.diffSummary}</p>
            </div>
          )}

          {/* Code Diff */}
          {(result.fix.originalCode || result.fix.patchedCode) && (
            <div className="bg-white border border-gray-200 rounded-xl p-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-gray-900">Code Changes</h3>
                <button
                  onClick={() => setShowDiff(!showDiff)}
                  className="text-sm text-blue-600 hover:underline"
                >
                  {showDiff ? 'Hide' : 'Show'} code
                </button>
              </div>
              {showDiff && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <div className="text-xs font-medium text-red-600 mb-1">Original (Vulnerable)</div>
                    <pre className="bg-red-50 border border-red-200 rounded p-3 text-xs overflow-x-auto max-h-80 overflow-y-auto text-red-900">
                      {result.fix.originalCode || 'Not available'}
                    </pre>
                  </div>
                  <div>
                    <div className="text-xs font-medium text-green-600 mb-1">Patched (Fixed)</div>
                    <pre className="bg-green-50 border border-green-200 rounded p-3 text-xs overflow-x-auto max-h-80 overflow-y-auto text-green-900">
                      {result.fix.patchedCode || 'Not available'}
                    </pre>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Re-scan Result */}
          {result.reScanResult && (
            <div className="bg-white border border-gray-200 rounded-xl p-5">
              <h3 className="font-semibold text-gray-900 mb-3">Re-scan of Patched Code</h3>
              {result.reScanResult.vulnerabilities?.length === 0 ? (
                <div className="flex items-center gap-2 text-green-700">
                  <CheckCircle className="w-5 h-5" />
                  No vulnerabilities detected in patched code. Fix appears effective.
                </div>
              ) : (
                <div>
                  <div className="text-amber-700 mb-2">
                    <AlertTriangle className="w-4 h-4 inline mr-1" />
                    {result.reScanResult.vulnerabilities?.length} issue(s) remain in patched code.
                  </div>
                  <div className="space-y-2">
                    {result.reScanResult.vulnerabilities?.slice(0, 3).map((v: any, i: number) => (
                      <div key={i} className="text-sm p-2 bg-amber-50 rounded border border-amber-200">
                        <span className="font-medium">[{v.severity}]</span> {v.title}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {result.reScanResult.riskScore !== undefined && (
                <div className="mt-2 text-sm text-gray-600">
                  Patched code risk score: {result.reScanResult.riskScore}/100
                </div>
              )}
            </div>
          )}

          {/* Generate another fix */}
          <button
            onClick={handleGenerateFix}
            disabled={fixing}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-xl text-sm hover:bg-gray-50 transition-colors"
          >
            <Wrench className="w-4 h-4" /> Regenerate Fix
          </button>
        </div>
      )}
    </div>
  );
}
