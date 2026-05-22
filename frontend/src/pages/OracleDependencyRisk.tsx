import React, { useEffect, useState } from 'react';

export default function OracleDependencyRisk() {
  const [data, setData] = useState<any>({ summary: {}, dependencies: [] });
  const [mitigation, setMitigation] = useState<any>(null);

  useEffect(() => {
    fetch('/api/oracle-dependency-risk').then((res) => res.json()).then(setData);
  }, []);

  const plan = async (id: number) => {
    const res = await fetch('/api/oracle-dependency-risk/mitigation', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });
    setMitigation(await res.json());
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Oracle Dependency Risk</h1>
      <div className="grid grid-cols-3 gap-4">
        {Object.entries(data.summary).map(([key, value]) => <div className="rounded border bg-white p-4" key={key}><div className="text-sm text-gray-500">{key}</div><div className="text-2xl font-semibold">{String(value)}</div></div>)}
      </div>
      {data.dependencies.map((item: any) => (
        <div className="rounded border bg-white p-4" key={item.id}>
          <strong>{item.contract}</strong> uses {item.oracle}
          <p>{item.heartbeatMinutes} minute heartbeat, {item.deviationBps} bps deviation, {item.risk} risk</p>
          <button className="rounded bg-emerald-600 px-3 py-2 text-white" onClick={() => plan(item.id)}>Mitigate</button>
        </div>
      ))}
      {mitigation && <pre className="rounded border bg-white p-4">{JSON.stringify(mitigation, null, 2)}</pre>}
    </div>
  );
}
