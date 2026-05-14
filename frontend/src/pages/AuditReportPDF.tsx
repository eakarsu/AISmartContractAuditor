import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/client';
import { FileText, Download, Loader2, CheckCircle } from 'lucide-react';

export default function AuditReportPDF() {
  const navigate = useNavigate();
  const [audits, setAudits] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [downloaded, setDownloaded] = useState<string[]>([]);
  const [error, setError] = useState('');

  useEffect(() => { loadAudits(); }, []);

  const loadAudits = async () => {
    setLoading(true);
    try {
      const res = await api.get('/audits');
      setAudits(res.data);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load audit reports');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (auditId: string, auditTitle: string) => {
    setDownloadingId(auditId);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/audits/${auditId}/pdf`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'PDF generation failed');
      }
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `audit-${auditTitle.replace(/[^a-z0-9]/gi, '_')}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setDownloaded(prev => [...prev, auditId]);
    } catch (err: any) {
      alert('Download failed: ' + err.message);
    } finally {
      setDownloadingId(null);
    }
  };

  const getStatusColor = (status: string) => {
    const map: Record<string, string> = {
      COMPLETED: 'bg-green-100 text-green-800',
      PENDING: 'bg-yellow-100 text-yellow-800',
      IN_PROGRESS: 'bg-blue-100 text-blue-800',
      FAILED: 'bg-red-100 text-red-800',
    };
    return map[status] || 'bg-gray-100 text-gray-700';
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <FileText className="w-6 h-6 text-purple-500" /> Audit Report PDF Export
        </h1>
        <p className="text-gray-500 mt-1">
          Download branded PDF reports with findings, vulnerabilities, and gas optimizations.
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        </div>
      ) : error ? (
        <div className="p-4 bg-red-50 text-red-700 rounded-xl">{error}</div>
      ) : audits.length === 0 ? (
        <div className="text-center py-16 text-gray-500">
          <FileText className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>No audit reports found.</p>
          <button
            onClick={() => navigate('/audits/new')}
            className="mt-3 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700"
          >
            Create Audit Report
          </button>
        </div>
      ) : (
        <div className="grid gap-4">
          {audits.map(audit => {
            const vulnCount = audit.vulnerabilities?.length || 0;
            const critCount = audit.vulnerabilities?.filter((v: any) => v.severity === 'CRITICAL').length || 0;

            return (
              <div key={audit.id} className="bg-white border border-gray-200 rounded-xl p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-gray-900 truncate">{audit.title}</h3>
                      <span className={`text-xs px-2 py-0.5 rounded font-medium ${getStatusColor(audit.status)}`}>
                        {audit.status}
                      </span>
                    </div>
                    <div className="text-sm text-gray-500 mb-2">
                      Contract: {audit.contract?.name || 'Unknown'} ({audit.contract?.language})
                    </div>

                    {/* Scores */}
                    <div className="flex gap-3 flex-wrap mb-2">
                      {[
                        { label: 'Overall', value: audit.overallScore },
                        { label: 'Security', value: audit.securityScore },
                        { label: 'Gas', value: audit.gasScore },
                      ].map(s => s.value !== null && s.value !== undefined && (
                        <div key={s.label} className="text-xs">
                          <span className="text-gray-500">{s.label}: </span>
                          <span className="font-semibold">{Number(s.value).toFixed(0)}/100</span>
                        </div>
                      ))}
                    </div>

                    <div className="flex gap-3 text-xs text-gray-400 flex-wrap">
                      <span>{vulnCount} vulnerabilit{vulnCount !== 1 ? 'ies' : 'y'}</span>
                      {critCount > 0 && <span className="text-red-600 font-medium">{critCount} critical</span>}
                      <span>Created: {new Date(audit.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 shrink-0">
                    <button
                      onClick={() => handleDownload(audit.id, audit.title)}
                      disabled={downloadingId === audit.id}
                      className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {downloadingId === audit.id ? (
                        <><Loader2 className="w-4 h-4 animate-spin" /> Generating...</>
                      ) : downloaded.includes(audit.id) ? (
                        <><CheckCircle className="w-4 h-4" /> Downloaded</>
                      ) : (
                        <><Download className="w-4 h-4" /> Download PDF</>
                      )}
                    </button>
                    <button
                      onClick={() => navigate(`/audits/${audit.id}`)}
                      className="px-4 py-2 border border-gray-200 text-gray-600 rounded-lg text-sm hover:bg-gray-50 transition-colors"
                    >
                      View Details
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
