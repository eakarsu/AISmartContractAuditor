import React, { useState } from 'react';
import { Light as SyntaxHighlighter } from 'react-syntax-highlighter';
import { atomOneDark } from 'react-syntax-highlighter/dist/esm/styles/hljs';
import { ChevronDown, ChevronRight, AlertTriangle, CheckCircle, XCircle, Info, Copy, Check } from 'lucide-react';

const severityColors: Record<string, string> = {
  CRITICAL: 'bg-red-100 text-red-800 border-red-300',
  HIGH: 'bg-orange-100 text-orange-800 border-orange-300',
  MEDIUM: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  LOW: 'bg-blue-100 text-blue-800 border-blue-300',
  INFORMATIONAL: 'bg-gray-100 text-gray-800 border-gray-300',
};

const statusIcons: Record<string, React.ReactNode> = {
  PASS: <CheckCircle className="w-4 h-4 text-green-500" />,
  FAIL: <XCircle className="w-4 h-4 text-red-500" />,
  PARTIAL: <AlertTriangle className="w-4 h-4 text-yellow-500" />,
};

function ScoreBar({ label, score, color = 'emerald' }: { label: string; score: number; color?: string }) {
  const colorMap: Record<string, string> = {
    emerald: 'bg-emerald-500', red: 'bg-red-500', blue: 'bg-blue-500',
    yellow: 'bg-yellow-500', purple: 'bg-purple-500', cyan: 'bg-cyan-500',
  };
  return (
    <div className="mb-3">
      <div className="flex justify-between text-sm mb-1">
        <span className="text-gray-600">{label}</span>
        <span className="font-semibold">{score}/100</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2.5">
        <div className={`${colorMap[color] || colorMap.emerald} h-2.5 rounded-full transition-all duration-500`} style={{ width: `${score}%` }} />
      </div>
    </div>
  );
}

function ScoreCircle({ score, label }: { score: number; label: string }) {
  const color = score >= 80 ? '#10b981' : score >= 60 ? '#f59e0b' : '#ef4444';
  const circumference = 2 * Math.PI * 45;
  const offset = circumference - (score / 100) * circumference;
  return (
    <div className="flex flex-col items-center">
      <svg className="w-28 h-28 -rotate-90">
        <circle cx="56" cy="56" r="45" stroke="#e5e7eb" strokeWidth="8" fill="none" />
        <circle cx="56" cy="56" r="45" stroke={color} strokeWidth="8" fill="none"
          strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round"
          className="transition-all duration-700" />
      </svg>
      <div className="absolute mt-8 text-center">
        <p className="text-2xl font-bold" style={{ color }}>{score}</p>
      </div>
      <p className="text-sm text-gray-600 mt-2 font-medium">{label}</p>
    </div>
  );
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000); };
  return (
    <button onClick={copy} className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-200 px-2 py-1 rounded bg-gray-700">
      {copied ? <><Check className="w-3 h-3" /> Copied</> : <><Copy className="w-3 h-3" /> Copy</>}
    </button>
  );
}

function CollapsibleSection({ title, children, defaultOpen = true, badge }: { title: string; children: React.ReactNode; defaultOpen?: boolean; badge?: React.ReactNode }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border border-gray-200 rounded-lg mb-3 overflow-hidden">
      <button onClick={() => setOpen(!open)} className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors">
        <div className="flex items-center gap-2">
          {open ? <ChevronDown className="w-4 h-4 text-gray-500" /> : <ChevronRight className="w-4 h-4 text-gray-500" />}
          <span className="font-medium text-gray-800">{title}</span>
        </div>
        {badge}
      </button>
      {open && <div className="p-4">{children}</div>}
    </div>
  );
}

function SeverityBadge({ severity }: { severity: string }) {
  return (
    <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${severityColors[severity] || severityColors.LOW}`}>
      {severity}
    </span>
  );
}

export function VulnerabilityScanResult({ data }: { data: any }) {
  if (!data) return null;
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-8 p-6 bg-white rounded-xl border">
        <div className="relative">
          <ScoreCircle score={data.riskScore ?? 0} label="Risk Score" />
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-lg text-gray-800 mb-2">Scan Summary</h3>
          <p className="text-gray-600">{data.summary || 'Analysis complete'}</p>
          <div className="flex gap-3 mt-3">
            {['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].map(s => {
              const count = data.vulnerabilities?.filter((v: any) => v.severity === s).length || 0;
              return count > 0 ? <span key={s} className={`text-xs font-semibold px-2 py-1 rounded ${severityColors[s]}`}>{count} {s}</span> : null;
            })}
          </div>
        </div>
      </div>

      {data.vulnerabilities?.map((vuln: any, i: number) => (
        <CollapsibleSection
          key={i}
          title={vuln.title}
          defaultOpen={i < 3}
          badge={<SeverityBadge severity={vuln.severity} />}
        >
          <div className="space-y-3">
            <p className="text-gray-700">{vuln.description}</p>
            {vuln.category && <p className="text-sm"><span className="font-medium text-gray-500">Category:</span> <span className="bg-gray-100 px-2 py-0.5 rounded text-gray-700">{vuln.category}</span></p>}
            {vuln.lineNumber && <p className="text-sm text-gray-500">Line: {vuln.lineNumber}</p>}
            {vuln.codeSnippet && (
              <div className="relative">
                <div className="absolute top-2 right-2 z-10"><CopyButton text={vuln.codeSnippet} /></div>
                <SyntaxHighlighter language="solidity" style={atomOneDark} className="rounded-lg text-sm">{vuln.codeSnippet}</SyntaxHighlighter>
              </div>
            )}
            {vuln.recommendation && (
              <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3">
                <p className="text-sm font-medium text-emerald-800 flex items-center gap-1"><Info className="w-4 h-4" /> Recommendation</p>
                <p className="text-sm text-emerald-700 mt-1">{vuln.recommendation}</p>
              </div>
            )}
          </div>
        </CollapsibleSection>
      ))}
    </div>
  );
}

export function GasOptimizationResult({ data }: { data: any }) {
  if (!data) return null;
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-8 p-6 bg-white rounded-xl border">
        <ScoreCircle score={data.gasScore ?? 0} label="Gas Score" />
        <div>
          <h3 className="font-semibold text-lg text-gray-800">Gas Analysis</h3>
          <p className="text-gray-600 mt-1">Total Estimated Savings: <span className="font-bold text-emerald-600">{data.totalEstimatedSavings || 'N/A'}</span></p>
        </div>
      </div>

      {data.optimizations?.map((opt: any, i: number) => (
        <CollapsibleSection key={i} title={opt.title} defaultOpen={i < 3}
          badge={<span className={`text-xs font-semibold px-2 py-0.5 rounded ${opt.priority === 'HIGH' ? 'bg-red-100 text-red-700' : opt.priority === 'MEDIUM' ? 'bg-yellow-100 text-yellow-700' : 'bg-blue-100 text-blue-700'}`}>{opt.priority}</span>}>
          <div className="space-y-3">
            <p className="text-gray-700">{opt.description}</p>
            {opt.estimatedSavings && <p className="text-sm text-emerald-600 font-medium">Estimated savings: {opt.estimatedSavings}</p>}
            {opt.currentCode && (
              <div>
                <p className="text-xs font-medium text-red-600 mb-1">Before:</p>
                <SyntaxHighlighter language="solidity" style={atomOneDark} className="rounded-lg text-sm">{opt.currentCode}</SyntaxHighlighter>
              </div>
            )}
            {opt.optimizedCode && (
              <div>
                <p className="text-xs font-medium text-emerald-600 mb-1">After:</p>
                <div className="relative">
                  <div className="absolute top-2 right-2 z-10"><CopyButton text={opt.optimizedCode} /></div>
                  <SyntaxHighlighter language="solidity" style={atomOneDark} className="rounded-lg text-sm">{opt.optimizedCode}</SyntaxHighlighter>
                </div>
              </div>
            )}
          </div>
        </CollapsibleSection>
      ))}
    </div>
  );
}

export function ComplianceCheckResult({ data }: { data: any }) {
  if (!data) return null;
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-8 p-6 bg-white rounded-xl border">
        <ScoreCircle score={data.complianceScore ?? 0} label="Compliance" />
        <div>
          <h3 className="font-semibold text-lg text-gray-800">{data.standard} Compliance</h3>
          <p className="text-gray-600 mt-1">Standard: <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded font-medium">{data.standard}</span></p>
        </div>
      </div>

      <div className="bg-white rounded-xl border overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50"><tr>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rule</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Details</th>
          </tr></thead>
          <tbody className="divide-y divide-gray-200">
            {data.results?.map((r: any, i: number) => (
              <tr key={i} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-sm font-medium text-gray-800">{r.rule}</td>
                <td className="px-4 py-3">{statusIcons[r.status] || r.status}</td>
                <td className="px-4 py-3 text-sm text-gray-600">{r.details}{r.recommendation && <span className="block text-emerald-600 mt-1 text-xs">{r.recommendation}</span>}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {data.missingFunctions?.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h4 className="font-medium text-red-800 mb-2">Missing Functions</h4>
          <div className="flex flex-wrap gap-2">{data.missingFunctions.map((f: string, i: number) => <span key={i} className="bg-red-100 text-red-700 px-2 py-1 rounded text-sm font-mono">{f}</span>)}</div>
        </div>
      )}
    </div>
  );
}

export function TestGenerationResult({ data }: { data: any }) {
  if (!data) return null;
  return (
    <div className="space-y-6">
      <div className="p-6 bg-white rounded-xl border">
        <div className="flex items-center gap-4 mb-4">
          <span className="bg-indigo-100 text-indigo-800 px-3 py-1 rounded-full font-medium text-sm">{data.testFramework || 'Hardhat'}</span>
          <span className="text-gray-500 text-sm">Coverage estimate: <span className="font-bold text-gray-800">{data.coverageEstimate || 'N/A'}</span></span>
        </div>

        {data.testCases?.length > 0 && (
          <div className="mb-4">
            <h4 className="font-medium text-gray-800 mb-2">Test Cases ({data.testCases.length})</h4>
            <div className="grid gap-2">{data.testCases.map((tc: any, i: number) => (
              <div key={i} className="flex items-center gap-3 p-2 bg-gray-50 rounded-lg">
                <span className={`text-xs px-2 py-0.5 rounded font-medium ${tc.type === 'security' ? 'bg-red-100 text-red-700' : tc.type === 'edge-case' ? 'bg-yellow-100 text-yellow-700' : 'bg-blue-100 text-blue-700'}`}>{tc.type}</span>
                <span className="text-sm font-medium text-gray-800">{tc.name}</span>
                <span className="text-xs text-gray-500">{tc.description}</span>
              </div>
            ))}</div>
          </div>
        )}
      </div>

      {data.testCode && (
        <div className="relative">
          <div className="absolute top-2 right-2 z-10"><CopyButton text={data.testCode} /></div>
          <SyntaxHighlighter language="javascript" style={atomOneDark} className="rounded-xl text-sm" showLineNumbers>{data.testCode}</SyntaxHighlighter>
        </div>
      )}
    </div>
  );
}

export function CodeQualityResult({ data }: { data: any }) {
  if (!data) return null;
  const cats = data.categories || {};
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-8 p-6 bg-white rounded-xl border">
        <ScoreCircle score={data.overallScore ?? 0} label="Overall Quality" />
        <div className="flex-1">
          <h3 className="font-semibold text-lg text-gray-800 mb-2">Code Quality Analysis</h3>
          <p className="text-gray-600">{data.summary || 'Analysis complete'}</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border p-6">
        <h4 className="font-medium text-gray-800 mb-4">Quality Categories</h4>
        <ScoreBar label="Readability" score={cats.readability ?? 0} color="blue" />
        <ScoreBar label="Maintainability" score={cats.maintainability ?? 0} color="purple" />
        <ScoreBar label="Gas Efficiency" score={cats.gasEfficiency ?? 0} color="yellow" />
        <ScoreBar label="Security" score={cats.security ?? 0} color="red" />
        <ScoreBar label="Documentation" score={cats.documentation ?? 0} color="cyan" />
      </div>

      {data.issues?.map((issue: any, i: number) => (
        <CollapsibleSection key={i} title={issue.title} defaultOpen={i < 3}
          badge={<SeverityBadge severity={issue.severity} />}>
          <p className="text-gray-700">{issue.description}</p>
          {issue.suggestion && (
            <div className="mt-2 bg-emerald-50 border border-emerald-200 rounded-lg p-3">
              <p className="text-sm text-emerald-700"><span className="font-medium">Suggestion:</span> {issue.suggestion}</p>
            </div>
          )}
        </CollapsibleSection>
      ))}
    </div>
  );
}

export function ReentrancyDetectionResult({ data }: { data: any }) {
  if (!data) return null;
  const riskColors: Record<string, string> = {
    SAFE: 'bg-green-100 text-green-800 border-green-300',
    LOW: 'bg-blue-100 text-blue-800 border-blue-300',
    MEDIUM: 'bg-yellow-100 text-yellow-800 border-yellow-300',
    HIGH: 'bg-orange-100 text-orange-800 border-orange-300',
    CRITICAL: 'bg-red-100 text-red-800 border-red-300',
  };
  return (
    <div className="space-y-6">
      <div className="p-6 bg-white rounded-xl border">
        <div className="flex items-center gap-4 mb-4">
          <span className={`text-lg font-bold px-4 py-2 rounded-lg border ${riskColors[data.overallRisk] || riskColors.MEDIUM}`}>
            Overall Risk: {data.overallRisk}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-4 mt-4">
          {data.safePatterns?.length > 0 && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h4 className="font-medium text-green-800 mb-2">Safe Patterns Found</h4>
              <ul className="space-y-1">{data.safePatterns.map((p: string, i: number) => <li key={i} className="text-sm text-green-700 flex items-center gap-1"><CheckCircle className="w-3 h-3" />{p}</li>)}</ul>
            </div>
          )}
          {data.unsafePatterns?.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <h4 className="font-medium text-red-800 mb-2">Unsafe Patterns Found</h4>
              <ul className="space-y-1">{data.unsafePatterns.map((p: string, i: number) => <li key={i} className="text-sm text-red-700 flex items-center gap-1"><XCircle className="w-3 h-3" />{p}</li>)}</ul>
            </div>
          )}
        </div>
      </div>

      {data.reentrancyRisks?.map((risk: any, i: number) => (
        <CollapsibleSection key={i} title={`${risk.functionName || 'Unknown'} - ${risk.pattern || ''}`}
          badge={<SeverityBadge severity={risk.severity} />}>
          <div className="space-y-2">
            <p className="text-gray-700">{risk.description}</p>
            {risk.pattern && <p className="text-sm"><span className="font-medium text-gray-500">Pattern:</span> <span className="bg-purple-100 text-purple-700 px-2 py-0.5 rounded">{risk.pattern}</span></p>}
            {risk.lineNumber && <p className="text-sm text-gray-500">Line: {risk.lineNumber}</p>}
            {risk.recommendation && (
              <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3">
                <p className="text-sm text-emerald-700"><span className="font-medium">Recommendation:</span> {risk.recommendation}</p>
              </div>
            )}
          </div>
        </CollapsibleSection>
      ))}
    </div>
  );
}

export function GenericAIResult({ data }: { data: any }) {
  if (!data) return null;
  if (data.rawResponse) {
    return <div className="bg-white rounded-xl border p-6 whitespace-pre-wrap text-gray-700">{data.rawResponse}</div>;
  }
  return (
    <div className="bg-white rounded-xl border p-6">
      <pre className="text-sm text-gray-700 whitespace-pre-wrap">{JSON.stringify(data, null, 2)}</pre>
    </div>
  );
}
