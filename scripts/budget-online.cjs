// Redis's meter, measured: real redis-server, the online server's two relay instances on it (each
// page pinned to one with `?relay=.../api/room/i0` or `i1`, pages taking turns, so a party is always
// split and its messages really cross the bus), and /api/world, /api/save and /api/owed on it too. Each scenario is driven in real
// Chromium for SECS seconds after `CONFIG RESETSTAT`; Redis's own INFO commandstats says what it cost.
// Usage: node scripts/budget-online.cjs [scenario ...]   (NOBUILD=1 to skip the build; SECS, default 60;
// BUDGET_PORT, default 8951; REDIS_PORT, default 6391). Prints JSON: commands a minute, by command.
const { execSync, spawn } = require('child_process');
const http = require('http');
const path = require('path');
const { chromium } = require('playwright');
const { createClient } = require('redis');
const ROOT = path.join(__dirname, '..'), PORT = Number(process.env.BUDGET_PORT) || 8951, RPORT = Number(process.env.REDIS_PORT) || 6391;
const SECS = Number(process.env.SECS) || 60;
// Test hooks the client reads (townfolk.ts AWAY): idle and hidden timeouts in seconds, short only
// where a scenario is about them (a client without them ignores them).
const QS = 'idle=600&hide=600', SHORT = 'idle=20&hide=8';
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const up = async (url) => { for (let i = 0; i < 150; i++) { if (await new Promise((r) => http.get(url, (res) => (res.resume(), r(true))).on('error', () => r(false)))) return; await wait(200); } };

(async () => {
  const out = { secs: SECS, scenarios: {} };
  const redis = spawn('redis-server', ['--port', String(RPORT), '--save', '', '--appendonly', 'no'], { stdio: 'ignore' });
  // (Connected once redis-server answers: a client whose first connect failed goes on retrying by itself.)
  for (let i = 0; i < 100 && !/PONG/.test(String(require('child_process').spawnSync('redis-cli', ['-p', String(RPORT), 'ping']).stdout)); i++) await wait(100);
  const r = createClient({ url: `redis://127.0.0.1:${RPORT}` });
  r.on('error', () => {});
  await r.connect();
  console.error('redis up');
  if (!process.env.NOBUILD) execSync('npx vite build', { cwd: ROOT, env: { ...process.env, VITE_ONLINE: '1' }, stdio: 'ignore' });
  // HOP=1: a page's reconnects may land on either instance (a friend can hop to the leader's).
  const srv = spawn(path.join(ROOT, 'node_modules/.bin/tsx'), ['scripts/online-server.ts'], { cwd: ROOT, env: { ...process.env, PORT: String(PORT), REDIS_URL: `redis://127.0.0.1:${RPORT}`, API_ALL: '1', PIN: '1' }, stdio: process.env.SRVLOG ? ['ignore', require('fs').openSync(process.env.SRVLOG, 'w'), 'ignore'] : 'ignore', detached: true });
  // (Its own process group: tsx runs the server in a child, which a plain kill would leave running.)
  const stopSrv = () => { try { process.kill(-srv.pid, 'SIGTERM'); } catch { srv.kill(); } };
  process.on('exit', stopSrv);
  await up(`http://127.0.0.1:${PORT}/`);
  console.error('server up');
  const browser = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const errors = [];
  let pages = 0;
  const open = async (name, cls, qs = QS) => {
    const inst = pages++ % 2;
    const ctx = await browser.newContext({ viewport: { width: 640, height: 400 } });
    const page = await ctx.newPage();
    page.on('pageerror', (e) => errors.push(`${name}: ${e}`));
    // What the page itself says to the relay: sockets opened and frames sent (pings apart).
    await page.addInitScript(() => {
      const n = (window.__ws = { opened: 0, sent: 0, pings: 0 }), send = WebSocket.prototype.send, W = window.WebSocket;
      WebSocket.prototype.send = function (d) { String(d) === '{"ping":1}' ? n.pings++ : n.sent++; return send.call(this, d); };
      window.WebSocket = class extends W { constructor(...a) { super(...a); n.opened++; } };
    });
    await page.goto(`http://127.0.0.1:${PORT}/?${qs}&pick=lead&relay=${encodeURIComponent(`ws://127.0.0.1:${PORT}/api/room/i${inst}`)}`);
    await page.waitForFunction(() => window.__game);
    await page.evaluate(([cls, name]) => { window.__game.create(cls, name); if (window.__game.mode === 'wood') window.__game.skipWood(); document.getElementById('title').hidden = true; window.__title.open = false; }, [cls, name]);
    return { name, ctx, page, inst };
  };
  const until = (p, fn, arg, ms = 15000) => p.page.waitForFunction(fn, arg, { timeout: ms, polling: 100 }).then(() => true, () => false);
  const fps = (p) => p.page.evaluate(() => new Promise((res) => { let n = 0; const t0 = performance.now(); const f = () => (++n, performance.now() - t0 < 1000 ? requestAnimationFrame(f) : res(n)); requestAnimationFrame(f); }));
  /** Measure SECS seconds of `drive` (which gets a stop time); commands a minute by Redis command. */
  /** What `ps` pages sent the relay in the window (frames, sockets opened), with what Redis counted. */
  const wsOf = (ps) => Promise.all(ps.map((p) => p.page.evaluate(() => ({ ...window.__ws })).catch(() => null)));
  const measured = async (ps, drive) => {
    const a = await wsOf(ps), m = await measure(drive), b = await wsOf(ps);
    const ws = { sent: 0, opened: 0 };
    a.forEach((x, i) => x && b[i] && ((ws.sent += b[i].sent - x.sent), (ws.opened += b[i].opened - x.opened)));
    return { ...m, ws };
  };
  const measure = async (drive) => {
    await r.configResetStat();
    // MONITOR=file: every command in the window, for finding where they come from.
    const mon = process.env.MONITOR ? spawn('redis-cli', ['-p', String(RPORT), 'monitor'], { stdio: ['ignore', require('fs').openSync(process.env.MONITOR, 'w'), 'ignore'] }) : null;
    const t0 = Date.now(), stop = t0 + SECS * 1000;
    await Promise.all([drive(stop), wait(SECS * 1000)]);
    mon?.kill();
    const info = await r.info('commandstats'), secs = (Date.now() - t0) / 1000, by = {};
    for (const m of info.matchAll(/cmdstat_(\w+(?:\|\w+)?):calls=(\d+)/g)) if (!/^(config|info)/.test(m[1])) by[m[1]] = +(Number(m[2]) * 60 / secs).toFixed(1);
    const perMin = +Object.values(by).reduce((a, b) => a + b, 0).toFixed(1);
    return { perMin, perHour: Math.round(perMin * 60), by };
  };
  const walk = async (p, stop, keys = ['d', 'a'], on = 1500, off = 1500) => { for (let i = 0; Date.now() < stop; i++) { const k = keys[i % keys.length]; await p.page.keyboard.down(k); await wait(on); await p.page.keyboard.up(k); await wait(off); } };
  const aim = async (p, stop) => { for (let i = 0; Date.now() < stop; i++) { await p.page.mouse.move(320 + 200 * Math.cos(i / 7), 200 + 150 * Math.sin(i / 5)).catch(() => {}); await wait(60); } };
  const hide = (p) => p.page.evaluate(() => { Object.defineProperty(document, 'visibilityState', { get: () => 'hidden', configurable: true }); Object.defineProperty(document, 'hidden', { get: () => true, configurable: true }); document.dispatchEvent(new Event('visibilitychange')); });
  const done = async (...ps) => { for (const p of ps) await p.ctx.close(); await wait(3000); };
  const keepAlive = (p) => p.page.evaluate(() => setInterval(() => { for (const room of [window.__game.room]) for (const h of room.heroes) h.safeT = 1e9; }, 300));
  /** Kyle gathers a party for posting `pick` (a function of the job list), the others join, Kyle sets out. */
  const party = async (lead, others, pick) => {
    await until(others[others.length - 1], (n) => window.__town().count >= n, others.length);
    await lead.page.evaluate(() => window.__openSpot('board'));
    const at = await lead.page.evaluate(`window.__game.jobs().findIndex(${pick})`);
    await lead.page.click(`#panel [data-open="${at}"]`);
    await lead.page.click(`#panel [data-gather="${at}"]`);
    for (const o of others) {
      await o.page.evaluate(() => window.__openSpot('board'));
      await until(o, () => !!document.querySelector('#panel [data-joinparty]'));
      await o.page.click('#panel [data-joinparty]');
      await o.page.evaluate(() => window.__panel.hide());
    }
    await until(lead, (n) => (document.querySelector('#partycard ul')?.children.length ?? 0) >= n, others.length + 1);
    await lead.page.evaluate(() => document.querySelector('#partycard.shut .pc-line')?.click());
    await lead.page.click('#partycard [data-setout]');
    const ok = await Promise.all(others.map((o) => until(o, () => window.__game.mode === 'run' && window.__game.room.heroes.some((h) => h.id === '@lead'), null, 25000)));
    return ok.every(Boolean);
  };
  // Each scenario starts its pages on instance 0.
  const fresh = () => (pages = 0);
  const SC = {
    async townIdle() {
      const a = await open('KYLE', 'WARRIOR');
      await wait(5000);
      const m = await measured([a], async () => {});
      await done(a);
      return m;
    },
    async townDozing() {
      // Left open past the idle time (the hook: idle=20 s for 180): what an idle tab costs from then on.
      const a = await open('KYLE', 'WARRIOR', SHORT);
      await wait(25000);
      const m = await measured([a], async () => {});
      await done(a);
      return m;
    },
    async townHidden() {
      const a = await open('KYLE', 'WARRIOR', SHORT);
      await wait(3000);
      await hide(a);
      await wait(10000);
      const m = await measure(async () => {});
      await done(a);
      return m;
    },
    async townTwo() {
      const a = await open('KYLE', 'WARRIOR'), b = await open('SAM', 'RANGER');
      const seen = await until(a, () => window.__town().count >= 1);
      const m = await measured([a, b], async (stop) => Promise.all([walk(a, stop, ['d', 'a'], 2000, 3000), walk(b, stop, ['w', 's'], 1500, 4000)]));
      await done(a, b);
      return { ...m, seen, inst: [a.inst, b.inst] };
    },
    async party2() {
      const a = await open('KYLE', 'WARRIOR'), b = await open('SAM', 'RANGER');
      const ok = await party(a, [b], '(j) => !j.exped && j.objective !== "story"');
      await keepAlive(a);
      const f = [await fps(a), await fps(b)];
      const m = await measured([a, b], async (stop) => { await a.page.keyboard.down(' '); await Promise.all([walk(a, stop, ['d', 'a'], 1200, 800), walk(b, stop, ['w', 's', 'a', 'd'], 1200, 600), aim(b, stop)]); await a.page.keyboard.up(' '); });
      await done(a, b);
      return { ...m, ok, fps: f, inst: [a.inst, b.inst] };
    },
    async party4() {
      const ps = [await open('KYLE', 'WARRIOR'), await open('SAM', 'RANGER'), await open('AVA', 'MAGE'), await open('BO', 'WARRIOR')];
      const ok = await party(ps[0], ps.slice(1), '(j) => !!j.exped');
      await keepAlive(ps[0]);
      const f = [];
      for (const p of ps) f.push(await fps(p));
      const m = await measured(ps, async (stop) => { await ps[0].page.keyboard.down(' '); await Promise.all([walk(ps[0], stop, ['d', 'a'], 1200, 800), ...ps.slice(1).flatMap((p, i) => [walk(p, stop, [['w', 's'], ['a', 'd'], ['s', 'w']][i], 1300, 700), aim(p, stop)])]); await ps[0].page.keyboard.up(' '); });
      await done(...ps);
      return { ...m, ok, fps: f, inst: ps.map((p) => p.inst) };
    },
    async yardSwing() {
      // In the training yard, swinging and walking nonstop the whole window: nothing should reach the relay.
      const a = await open('KYLE', 'WARRIOR');
      await wait(3000);
      await a.page.evaluate(() => window.__game.enterYard());
      await keepAlive(a);
      await wait(3000);
      const m = await measured([a], async (stop) => { const swing = (async () => { while (Date.now() < stop) { await a.page.keyboard.press(' ').catch(() => {}); await wait(250); } })(); await Promise.all([swing, walk(a, stop, ['a', 'd'], 800, 200)]); });
      // Back to Wickhold: the town's room opens again.
      await a.page.evaluate(() => window.__game.enterTown());
      const back = await until(a, () => window.__town().open, null, 8000);
      await done(a);
      return { ...m, mode: 'yard', back };
    },
    async townApart() {
      // Two players in town on two instances, one walking about in a hall, the other in the square.
      const a = await open('KYLE', 'WARRIOR'), b = await open('SAM', 'RANGER');
      const seen = await until(a, () => window.__town().count >= 1);
      await b.page.evaluate(() => { const g = window.__game, d = g.room.map.blocks.find((x) => x.door && !x.ruined); g.enter(d); });
      await wait(2000);
      const m = await measured([a, b], async (stop) => Promise.all([walk(a, stop, ['d', 'a'], 2000, 3000), walk(b, stop, ['w', 's'], 1500, 4000)]));
      await done(a, b);
      return { ...m, seen, inst: [a.inst, b.inst] };
    },
    async soloJob() {
      const a = await open('KYLE', 'WARRIOR');
      await wait(2000);
      await a.page.evaluate(() => window.__game.startJob(window.__game.jobs().find((j) => !j.exped && j.objective !== 'story')));
      await keepAlive(a);
      await wait(3000);
      const m = await measure(async (stop) => { await a.page.keyboard.down(' '); await walk(a, stop); await a.page.keyboard.up(' '); });
      await done(a);
      return { ...m, mode: 'run' };
    },
  };
  const pick = process.argv.slice(2).length ? process.argv.slice(2) : Object.keys(SC);
  for (const k of pick) {
    fresh();
    try {
      out.scenarios[k] = await SC[k]();
    } catch (e) {
      out.scenarios[k] = { error: String(e) };
    }
    console.error(k, JSON.stringify(out.scenarios[k]));
    // (Every page closed, even after a failure, so nothing spills into the next scenario.)
    for (const c of browser.contexts()) await c.close().catch(() => {});
  }
  out.errors = errors.slice(0, 10);
  await browser.close();
  stopSrv();
  await r.quit().catch(() => {});
  redis.kill();
  console.log(JSON.stringify(out, null, 1));
  process.exit(0);
})();
