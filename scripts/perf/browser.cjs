// Frame cost in a real browser: load, network on load, then a JS CPU profile of town and of a job fight, flat and 2.5D.
// Usage: node browser.cjs <outdir> [base url]
const { chromium } = require('playwright');
const fs = require('fs');
const out = process.argv[2] || '/tmp/bprof', base = process.argv[3] || 'http://localhost:4173/';
fs.mkdirSync(out, { recursive: true });
const sum = (prof) => {
  const byId = new Map(prof.nodes.map((n) => [n.id, n])), self = new Map(); let total = 0, idle = 0;
  prof.samples.forEach((id, i) => { const n = byId.get(id), d = prof.timeDeltas[i], f = n.callFrame.functionName || '(anon)'; total += d; if (f === '(idle)' || f === '(program)') { idle += f === '(idle)' ? d : 0; } self.set(f + '@' + n.callFrame.url.split('/').pop().slice(0, 18) + ':' + n.callFrame.lineNumber + ':' + n.callFrame.columnNumber, (self.get(f + '@' + n.callFrame.url.split('/').pop().slice(0, 18) + ':' + n.callFrame.lineNumber + ':' + n.callFrame.columnNumber) ?? 0) + d); });
  return { totalMs: total / 1000, busyPct: +(100 * (total - idle) / total).toFixed(1), top: [...self].sort((a, b) => b[1] - a[1]).slice(0, 40).map(([k, v]) => `${(100 * v / total).toFixed(1)}% ${k}`) };
};
(async () => {
  const browser = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const res = {};
  for (const look of ['3d', 'pixel']) {
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true });
    const page = await ctx.newPage();
    const reqs = [];
    page.on('response', async (r) => { try { const b = await r.body().catch(() => Buffer.alloc(0)); reqs.push({ u: r.url().replace(base, ''), s: r.status(), n: b.length, cc: r.headers()['cache-control'] }); } catch {} });
    const errors = [];
    page.on('pageerror', (e) => errors.push(String(e).slice(0, 200)));
    const t0 = Date.now();
    await page.goto(base + `?hero=WARRIOR&look=${look}&perf=1`);
    await page.waitForFunction(() => typeof window.render_game_to_text === 'function');
    const ready = Date.now() - t0;
    await page.waitForTimeout(4000);
    const loadReqs = reqs.slice();
    const byType = {};
    for (const r of loadReqs) { const ext = (r.u.split('?')[0].split('.').pop() || 'doc').slice(0, 5); byType[ext] = byType[ext] || { n: 0, kb: 0 }; byType[ext].n++; byType[ext].kb += r.n / 1024; }
    for (const k of Object.keys(byType)) byType[k].kb = Math.round(byType[k].kb);
    const cdp = await ctx.newCDPSession(page);
    await cdp.send('Profiler.enable'); await cdp.send('Profiler.setSamplingInterval', { interval: 200 });
    const frames = async (ms) => page.evaluate((ms) => new Promise((done) => { const t = []; let last = performance.now(), end = last + ms; const f = (n) => { t.push(n - last); last = n; n < end ? requestAnimationFrame(f) : done({ n: t.length, mean: t.reduce((a, b) => a + b, 0) / t.length, p95: [...t].sort((a, b) => a - b)[Math.floor(t.length * 0.95)], max: Math.max(...t) }); }; requestAnimationFrame(f); }), ms);
    const prof = async (name, ms) => { await cdp.send('Profiler.start'); const fr = await frames(ms); const { profile } = await cdp.send('Profiler.stop'); fs.writeFileSync(`${out}/${look}-${name}.cpuprofile`, JSON.stringify(profile)); return { frames: fr, ...sum(profile), view: await page.evaluate(() => window.__views?.stats ?? null).catch(() => null) }; };
    const town = await prof('town', 6000);
    await page.screenshot({ path: `${out}/${look}-town.png` });
    // A job: the board's second posting, the party of one walking in and fighting.
    await page.evaluate(() => { const g = window.__game; g.startJob(g.jobs()[1]); });
    await page.waitForTimeout(1500);
    await page.evaluate(() => { const r = window.__room, h = r.heroes[0]; for (const e of r.enemies) { e.x = h.x + (Math.random() - 0.5) * 6; e.y = h.y - 2 - Math.random() * 3; e.dozing = false; } window.__keep = setInterval(() => { h.hp = h.maxHp; }, 200); });
    const job = await prof('job', 8000);
    await page.screenshot({ path: `${out}/${look}-job.png` });
    const state = await page.evaluate(() => ({ enemies: window.__room.enemies.length, map: window.__room.map.w + 'x' + window.__room.map.h, canvas: [...document.querySelectorAll('canvas')].filter((c) => c.offsetParent !== null || c.id).map((c) => `${c.id || '?'}:${c.width}x${c.height}`).slice(0, 8) }));
    res[look] = { readyMs: ready, loadRequests: loadReqs.length, loadKB: Math.round(loadReqs.reduce((a, r) => a + r.n, 0) / 1024), byType, noCache: loadReqs.filter((r) => !r.cc || /max-age=0|no-cache/.test(r.cc)).length, cacheSample: loadReqs.slice(0, 3).map((r) => r.u + ' ' + r.cc), big: loadReqs.filter((r) => r.n > 150000).map((r) => `${r.u} ${Math.round(r.n / 1024)}KB`), town, job, state, errors };
    await ctx.close();
  }
  await browser.close();
  fs.writeFileSync(`${out}/summary.json`, JSON.stringify(res, null, 1));
  console.log(JSON.stringify(res, null, 1));
})();
