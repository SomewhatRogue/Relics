import fs from 'node:fs';
const dir = process.argv[2], f = fs.readdirSync(dir).filter((x) => x.endsWith('.cpuprofile')).map((x) => dir + '/' + x).sort((a, b) => fs.statSync(b).size - fs.statSync(a).size)[0];
const p = JSON.parse(fs.readFileSync(f, 'utf8')), byId = new Map(p.nodes.map((n) => [n.id, n]));
const self = new Map(); const dt = p.timeDeltas; let total = 0;
p.samples.forEach((id, i) => { const n = byId.get(id), k = `${n.callFrame.functionName || '(anon)'} ${n.callFrame.url.split('/').slice(-2).join('/')}:${n.callFrame.lineNumber + 1}`; self.set(k, (self.get(k) ?? 0) + dt[i]); total += dt[i]; });
// inclusive by file
const parent = new Map(); for (const n of p.nodes) for (const c of n.children ?? []) parent.set(c, n.id);
const incl = new Map();
p.samples.forEach((id, i) => { const seen = new Set(); for (let x = id; x !== undefined; x = parent.get(x)) { const n = byId.get(x), k = `${n.callFrame.functionName || '(anon)'} ${n.callFrame.url.split('/').slice(-1)[0]}`; if (!seen.has(k)) seen.add(k), incl.set(k, (incl.get(k) ?? 0) + dt[i]); } });
const N = Number(process.argv[3]) || 30;
console.log('total ms', (total / 1000).toFixed(0));
console.log('--- self');
for (const [k, v] of [...self].sort((a, b) => b[1] - a[1]).slice(0, N)) console.log((100 * v / total).toFixed(1).padStart(5) + '%  ' + k);
console.log('--- inclusive');
for (const [k, v] of [...incl].sort((a, b) => b[1] - a[1]).slice(0, N + 15)) console.log((100 * v / total).toFixed(1).padStart(5) + '%  ' + k);
