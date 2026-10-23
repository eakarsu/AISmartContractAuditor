'use strict';
/* Offline only: env keys removed before importing the app module; the feature
   pack never calls a provider (deterministic fallback, aiGenerated:false). */
delete process.env.OPENROUTER_API_KEY; delete process.env.OPENAI_API_KEY;
const test = require('node:test'); const assert = require('node:assert/strict');
const express = require('express'); const http = require('node:http');
const pack = require('../featurePack.cjs');
const FEATURES = pack.FEATURES;
const auth = (req, _res, next) => { req.user = { id: 'user-1' }; next(); };
async function serve(mw) { const app = express(); app.use(express.json()); app.use('/api/feature-pack', pack.createFeaturePackRouter(mw)); const s = http.createServer(app); await new Promise(r => s.listen(0, r)); return { s, base: `http://127.0.0.1:${s.address().port}/api/feature-pack` }; }
async function call(base, method, path, body) { const res = await fetch(base + path, { method, headers: { 'content-type': 'application/json' }, body: body ? JSON.stringify(body) : undefined }); const text = await res.text(); let json; try { json = JSON.parse(text); } catch { json = text; } return { status: res.status, json, text, type: res.headers.get('content-type') || '' }; }
test('unauthenticated tasks request is rejected', async () => { const { s, base } = await serve(undefined); const r = await call(base, 'GET', '/tasks'); assert.equal(r.status, 401); s.close(); });
test('tasks create/list/search/filter/update + export + AI fallback', async () => {
  assert.ok(!process.env.OPENROUTER_API_KEY && !process.env.OPENAI_API_KEY);
  const { s, base } = await serve(auth);
  const a = await call(base, 'POST', '/tasks', { title: 'Alpha fix', priority: 'high' }); assert.equal(a.status, 201);
  await call(base, 'POST', '/tasks', { title: 'Beta check', status: 'done', priority: 'low' });
  const all = await call(base, 'GET', '/tasks'); assert.equal(all.json.items.length, 2);
  assert.equal((await call(base, 'GET', '/tasks?q=alpha')).json.items.length, 1);
  assert.equal((await call(base, 'GET', '/tasks?status=done')).json.items.length, 1);
  const upd = await call(base, 'PUT', `/tasks/${a.json.id}`, { status: 'done' }); assert.equal(upd.json.status, 'done');
  const csv = await call(base, 'GET', '/export?format=csv'); assert.match(csv.type, /text\/csv/); assert.match(csv.text, /Alpha fix/);
  const js = await call(base, 'GET', '/export?format=json'); assert.equal(js.json.items.length, 2);
  const sec = await call(base, 'GET', '/sections'); const note = sec.json.sections.find(x => x.key === 'note'); assert.equal(note.value, ''); assert.ok(sec.json.sections.some(x => x.value === 0 || x.value === false || x.value === ''));
  for (const f of FEATURES) { const r = await call(base, 'POST', `/ai/${f}`, {}); assert.equal(r.json.aiGenerated, false, f); assert.match(r.json.label, /Deterministic fallback/); }
  const empty = pack.aiFallback(FEATURES[0], []); assert.equal(empty.recordCount, 0); assert.equal(empty.aiGenerated, false);
  s.close();
});
