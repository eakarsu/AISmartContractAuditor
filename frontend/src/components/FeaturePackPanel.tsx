import React, { useEffect, useState } from 'react';
// Readable labelled sections: false / 0 / '' are rendered, never hidden.
export default function FeaturePackPanel({ baseUrl = '/api/feature-pack', token }: { baseUrl?: string; token?: string }) {
  const [sections, setSections] = useState([]);
  useEffect(() => { fetch(`${baseUrl}/sections`, { headers: token ? { Authorization: `Bearer ${token}` } : {} }).then(r => r.json()).then(d => setSections(d.sections || [])).catch(() => setSections([])); }, [baseUrl, token]);
  return (<section aria-label="Feature pack"><h2>Tasks &amp; insights</h2>{sections.map(s => (<div key={s.key}><span>{s.label}: </span><span>{s.value === '' ? '(empty)' : String(s.value)}</span></div>))}</section>);
}
