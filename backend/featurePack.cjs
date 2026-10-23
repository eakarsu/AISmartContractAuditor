'use strict';
/* Feature pack: authenticated tasks, search/filter, CSV/JSON export, and
   deterministic domain AI fallbacks over the caller's own task records.
   No provider calls are made here; no API keys are read. */
const express = require('express');
const DOMAIN = "smart-contract-audit";
const FEATURES = ["contract-risk-triage", "remediation-priority-plan", "audit-coverage-summary"];
const FALLBACK_LABEL = 'Deterministic fallback — no AI provider configured';

function ownerOf(req) {
  const u = req.user || {};
  const id = u.id ?? u.userId ?? u.sub ?? req.userId;
  return id == null ? null : String(id);
}
function filterRecords(records, query = {}) {
  const q = String(query.q || '').trim().toLowerCase();
  return records.filter((r) => {
    if (query.status && r.status !== query.status) return false;
    if (query.priority && r.priority !== query.priority) return false;
    if (q && !`${r.title} ${r.description || ''} ${r.status} ${r.priority}`.toLowerCase().includes(q)) return false;
    return true;
  });
}
function esc(v) { const s = v == null ? '' : String(v); return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; }
function toCsv(records) {
  const cols = ['id', 'title', 'description', 'status', 'priority', 'createdAt', 'updatedAt'];
  return [cols.join(','), ...records.map((r) => cols.map((c) => esc(r[c])).join(','))].join('\n') + '\n';
}
/* Labelled sections preserve false / 0 / '' values verbatim (never dropped). */
function buildSections(records) {
  const done = records.filter((r) => r.status === 'done').length;
  return [
    { key: 'totalTasks', label: 'Total tasks', value: records.length },
    { key: 'openTasks', label: 'Open tasks', value: records.length - done },
    { key: 'completedTasks', label: 'Completed tasks', value: done },
    { key: 'hasTasks', label: 'Has any tasks', value: records.length > 0 },
    { key: 'note', label: 'Note', value: records.length ? '' : 'No tasks yet' },
  ];
}
function aiFallback(featureId, records) {
  const byStatus = {}; const byPriority = {};
  for (const r of records) { byStatus[r.status] = (byStatus[r.status] || 0) + 1; byPriority[r.priority] = (byPriority[r.priority] || 0) + 1; }
  const base = { aiGenerated: false, label: FALLBACK_LABEL, domain: DOMAIN, feature: featureId, recordCount: records.length, byStatus, byPriority };
  if (featureId === FEATURES[0]) return { ...base, summary: records.length ? `${records.length} record(s) grouped by status/priority for ${FEATURES[0]}.` : 'No records yet — counts are 0.', topPriorityCount: byPriority.high || 0 };
  if (featureId === FEATURES[1]) return { ...base, summary: 'Ordered next actions by priority (high first), then oldest first.', nextActions: [...records].sort((a, b) => ({ high: 0, medium: 1, low: 2 }[a.priority] ?? 3) - ({ high: 0, medium: 1, low: 2 }[b.priority] ?? 3)).slice(0, 5).map((r) => ({ id: r.id, title: r.title, priority: r.priority, done: r.status === 'done' })) };
  return { ...base, summary: 'Coverage summary over your own records; empty areas are shown, not hidden.', uncoveredStatuses: ['todo', 'in_progress', 'done'].filter((s) => !byStatus[s]), isEmpty: records.length === 0 };
}
function createFeaturePackRouter(authenticate) {
  const router = express.Router();
  const store = new Map(); let seq = 0;
  if (typeof authenticate === 'function') router.use(authenticate);
  router.use((req, res, next) => { if (!ownerOf(req)) return res.status(401).json({ error: 'Authentication required' }); next(); });
  const mine = (req) => { const k = ownerOf(req); if (!store.has(k)) store.set(k, []); return store.get(k); };
  router.get('/tasks', (req, res) => res.json({ items: filterRecords(mine(req), req.query), sections: buildSections(mine(req)) }));
  router.post('/tasks', (req, res) => {
    const title = String(req.body?.title || '').trim();
    if (!title) return res.status(400).json({ error: 'title is required' });
    const now = new Date().toISOString();
    const rec = { id: String(++seq), title, description: String(req.body?.description || ''), status: ['todo', 'in_progress', 'done'].includes(req.body?.status) ? req.body.status : 'todo', priority: ['low', 'medium', 'high'].includes(req.body?.priority) ? req.body.priority : 'medium', createdAt: now, updatedAt: now };
    mine(req).push(rec); return res.status(201).json(rec);
  });
  const update = (req, res) => { const rec = mine(req).find((r) => r.id === String(req.params.id)); if (!rec) return res.status(404).json({ error: 'Task not found' }); if (req.body?.title != null) rec.title = String(req.body.title); if (req.body?.description != null) rec.description = String(req.body.description); if (['todo', 'in_progress', 'done'].includes(req.body?.status)) rec.status = req.body.status; if (['low', 'medium', 'high'].includes(req.body?.priority)) rec.priority = req.body.priority; rec.updatedAt = new Date().toISOString(); return res.json(rec); };
  router.put('/tasks/:id', update); router.patch('/tasks/:id', update);
  router.get('/export', (req, res) => { const items = filterRecords(mine(req), req.query); if (String(req.query.format || 'json').toLowerCase() === 'csv') { res.type('text/csv').set('Content-Disposition', 'attachment; filename="tasks.csv"'); return res.send(toCsv(items)); } return res.json({ items, sections: buildSections(mine(req)) }); });
  router.get('/sections', (req, res) => res.json({ sections: buildSections(mine(req)) }));
  router.get('/ai/features', (_req, res) => res.json({ features: FEATURES, aiGenerated: false, label: FALLBACK_LABEL }));
  router.post('/ai/:feature', (req, res) => { if (!FEATURES.includes(req.params.feature)) return res.status(404).json({ error: 'Unknown AI feature' }); const records = Array.isArray(req.body?.records) ? req.body.records : mine(req); return res.json(aiFallback(req.params.feature, records)); });
  return router;
}
module.exports = createFeaturePackRouter;
module.exports.createFeaturePackRouter = createFeaturePackRouter;
module.exports.filterRecords = filterRecords; module.exports.toCsv = toCsv;
module.exports.buildSections = buildSections; module.exports.aiFallback = aiFallback; module.exports.FEATURES = FEATURES;
