// The Florida night (docs/DECISIONS.md 2026-11-05, "the join storm"), played back on the local relay:
// real redis-server, two relay instances, the leader across the country (FAR_MS each way) on instance 1,
// whose subscriber connection to Redis is half-open for job rooms (DEAF=1: a SUBSCRIBE never answered,
// nothing heard, PUBLISH still fine), as the leader's instance was that night; Kyle in with them at
// first, every later connection of his on instance 0 (`/api/room/f1`), as his 4-minute swap moved him.
// Kyle's page should get the job, stay on one socket, and see the leader move smoothly; the server log
// counts his joins.
// Usage: node scripts/florida-online.cjs   (NOBUILD=1 skips the build; ONLINE_PORT, default 8972;
// REDIS_PORT, default 6395; SECS of play, default 60; NORESET=1: the relay can't heal the deaf
// connection, so only the client's backoff keeps it calm; QUIET=1: no deaf connection at all;
// KYLE_ROUTE=i0: Kyle always on the other instance, a split party, for the lag numbers; PLAYOUT=0: the
// friend's page applies patches as they come, as before playout.ts). Prints a JSON report.
const { execSync, spawn, spawnSync } = require('child_process');
const http = require('http');
const path = require('path');
const { chromium } = require('playwright');
const { createClient } = require('redis');
const ROOT = path.join(__dirname, '..'), PORT = Number(process.env.ONLINE_PORT) || 8972, RPORT = Number(process.env.REDIS_PORT) || 6395;
const SECS = Number(process.env.SECS) || 60;
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const up = async (url) => { for (let i = 0; i < 150; i++) { if (await new Promise((r) => http.get(url, (res) => (res.resume(), r(true))).on('error', () => r(false)))) return; await wait(200); } };
const get = (url) => new Promise((r) => http.get(url, (res) => { let b = ''; res.on('data', (d) => (b += d)); res.on('end', () => r(JSON.parse(b))); }).on('error', () => r(null)));

(async () => {
  const report = { ok: false, secs: SECS, deaf: !process.env.QUIET, noreset: !!process.env.NORESET, steps: [], errors: [] };
  const step = (s, ok, v) => (report.steps.push({ s, ok: !!ok, ...(v === undefined ? {} : { v }) }), ok);
  const redis = spawn('redis-server', ['--port', String(RPORT), '--save', '', '--appendonly', 'no'], { stdio: 'ignore' });
  for (let i = 0; i < 100 && !/PONG/.test(String(spawnSync('redis-cli', ['-p', String(RPORT), 'ping']).stdout)); i++) await wait(100);
  const r = createClient({ url: `redis://127.0.0.1:${RPORT}` });
  r.on('error', () => {});
  await r.connect();
  if (!process.env.NOBUILD) execSync('npx vite build', { cwd: ROOT, env: { ...process.env, VITE_ONLINE: '1' }, stdio: 'ignore' });
  const log = [];
  const env = { ...process.env, PORT: String(PORT), REDIS_URL: `redis://127.0.0.1:${RPORT}`, FAR_MS: '70', LAG_MS: '15', BUS_LAG_MS: '2', ...(process.env.QUIET ? {} : { DEAF: '1' }) };
  const srv = spawn(path.join(ROOT, 'node_modules/.bin/tsx'), ['scripts/online-server.ts'], { cwd: ROOT, env, stdio: ['ignore', 'pipe', 'ignore'], detached: true });
  let buf = '';
  srv.stdout.on('data', (d) => {
    buf += d;
    for (let i = buf.indexOf('\n'); i >= 0; i = buf.indexOf('\n')) {
      const line = buf.slice(0, i);
      buf = buf.slice(i + 1);
      try { log.push({ at: Date.now(), ...JSON.parse(line) }); } catch { /* not a log line */ }
    }
  });
  const stopSrv = () => { try { process.kill(-srv.pid, 'SIGTERM'); } catch { srv.kill(); } };
  process.on('exit', () => (stopSrv(), redis.kill()));
  await up(`http://127.0.0.1:${PORT}/`);
  const browser = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const open = async (name, cls, route) => {
    const ctx = await browser.newContext({ viewport: { width: 640, height: 400 } });
    const page = await ctx.newPage();
    page.on('pageerror', (e) => report.errors.push(`${name}: ${e}`));
    // Every socket the page opens, and how many are open at once at most.
    await page.addInitScript(() => {
      const n = (window.__ws = { opened: 0, open: 0, most: 0 }), W = window.WebSocket;
      window.WebSocket = class extends W {
        constructor(...a) {
          super(...a);
          n.opened++, n.open++, (n.most = Math.max(n.most, n.open));
          this.addEventListener('close', () => n.open--);
        }
      };
    });
    await page.goto(`http://127.0.0.1:${PORT}/?idle=600&hide=600${process.env.PLAYOUT === '0' ? '&playout=0' : ''}&relay=${encodeURIComponent(`ws://127.0.0.1:${PORT}/api/room/${route}`)}`);
    await page.waitForFunction(() => window.__game);
    await page.evaluate(([cls, name]) => { window.__game.create(cls, name); if (window.__game.mode === 'wood') window.__game.skipWood(); document.getElementById('title').hidden = true; window.__title.open = false; }, [cls, name]);
    return { name, ctx, page };
  };
  const until = (p, fn, arg, ms = 15000) => p.page.waitForFunction(fn, arg, { timeout: ms, polling: 50 }).then(() => true, () => false);
  let t0 = 0;
  try {
    const lead = await open('LIACOR', 'WARRIOR', 'i1');
    const kyle = await open('ASHE', 'MAGE', process.env.KYLE_ROUTE || 'f1');
    const kyleId = await kyle.page.evaluate(() => window.__game.profile.id);
    step('they see each other in town', await until(kyle, () => window.__town().count >= 1, null, 20000));
    await lead.page.evaluate(() => window.__openSpot('board'));
    await lead.page.click('#panel [data-open="1"]');
    await lead.page.click('#panel [data-gather="1"]');
    await kyle.page.evaluate(() => window.__openSpot('board'));
    await until(kyle, () => !!document.querySelector('#panel [data-joinparty]'));
    await kyle.page.click('#panel [data-joinparty]');
    await kyle.page.evaluate(() => window.__panel.hide());
    await until(lead, () => (document.querySelector('#partycard ul')?.children.length ?? 0) >= 2);
    await lead.page.evaluate(() => document.querySelector('#partycard.shut .pc-line')?.click());
    await lead.page.click('#partycard [data-setout]');
    t0 = Date.now();
    // Join latency: setting out to Kyle standing in the leader's room.
    const inIt = await until(kyle, () => window.__game.mode === 'run' && window.__game.room.heroes.some((h) => h.id === '@lead') && window.__game.room.heroes.some((h) => h.id === 'me'), null, 45000);
    report.joinMs = inIt ? Date.now() - t0 : null;
    step(`Kyle is in the leader's job (${report.joinMs} ms after setting out)`, inIt);
    // Keep everyone up (the test is the wire, not the fight).
    for (const p of [lead, kyle]) await p.page.evaluate(() => setInterval(() => { for (const h of window.__game.room.heroes) (h.hp = h.maxHp ?? h.hp), (h.safeT = 1e9); for (const e of window.__game.room.enemies) e.stun = 9; }, 200));
    const meter0 = await r.info('commandstats');
    const ws0 = await kyle.page.evaluate(() => ({ ...window.__ws }));
    // Kyle watches the leader: where the leader's hero is drawn each frame, and each patch applied.
    await kyle.page.evaluate(() => {
      const s = (window.__look = { frames: 0, moving: 0, still: 0, speeds: [], last: null, at: 0 });
      const f = () => {
        const g = window.__game, room = g.room, h = room?.heroes.find((x) => x.id === '@lead');
        if (g.remote && h) {
          const p = room.prev.get('h:@lead'), a = room.alpha, x = p ? p[0] + (h.x - p[0]) * a : h.x, y = p ? p[1] + (h.y - p[1]) * a : h.y;
          const t = performance.now();
          if (s.last) {
            const d = Math.hypot(x - s.last[0], y - s.last[1]), dt = (t - s.at) / 1000;
            s.frames++;
            // While the leader walks: a frame that doesn't move him is a stall; how fast he's drawn going, each frame.
            if (h.moving && dt > 0) (d < 1e-4 ? s.still++ : s.moving++), s.speeds.push(d / dt);
          }
          (s.last = [x, y]), (s.at = t);
          // The wait the playout gave the latest patch (playout.ts), summed for an average.
          const d = g.remote.playout?.delay;
          if (d !== undefined) (s.wait = (s.wait ?? 0) + d), (s.waits = (s.waits ?? 0) + 1);
        }
        requestAnimationFrame(f);
      };
      requestAnimationFrame(f);
    });
    const stop = Date.now() + SECS * 1000;
    const walk = async (p, keys) => { for (let i = 0; Date.now() < stop; i++) { const k = keys[i % keys.length]; await p.page.keyboard.down(k); await wait(1400); await p.page.keyboard.up(k); await wait(300); } };
    await Promise.all([walk(lead, ['d', 'a']), walk(kyle, ['w', 's'])]);
    const look = await kyle.page.evaluate(() => window.__look);
    const ws1 = await kyle.page.evaluate(() => ({ ...window.__ws }));
    const g = await kyle.page.evaluate(() => { const x = window.__game.remote; return x ? { trip: x.trip, quiet: x.quiet(performance.now() / 1000) } : null; });
    const meter1 = await r.info('commandstats');
    const calls = (s) => [...s.matchAll(/cmdstat_(\w+):calls=(\d+)/g)].filter((m) => !/^(config|info)/.test(m[1])).reduce((n, m) => n + Number(m[2]), 0);
    report.redisPerMin = Math.round(((calls(meter1) - calls(meter0)) * 60) / SECS);
    const mine = log.filter((l) => l.ev === 'join' && /^P[A-Z0-9]{8}$/.test(l.room ?? '') && l.id === kyleId.slice(0, 8));
    report.kyleJobJoins = mine.length;
    // The first 30 s after setting out: getting in (where the storm was), a minute's worth.
    report.kyleJoinsFirst30s = mine.filter((l) => l.at - t0 < 30_000).length;
    report.kyleJoinsPerMin = +((mine.filter((l) => l.at >= stop - SECS * 1000).length * 60) / SECS).toFixed(1);
    report.socketsOpenedInPlay = ws1.opened - ws0.opened;
    report.mostOpenAtOnce = ws1.most;
    report.busResets = log.filter((l) => l.ev === 'busreset').length;
    report.leaderMovingFrames = look.moving + look.still;
    report.stallPct = +((100 * look.still) / Math.max(1, look.moving + look.still)).toFixed(1);
    // Jumps: frames where he's drawn going over twice his usual walking pace (catching up after a stall).
    const sp = [...look.speeds].sort((a, b) => a - b), med = sp[Math.floor(sp.length / 2)] || 0;
    report.jumps = sp.filter((v) => v > 2 * med).length;
    report.jumpPct = +((100 * report.jumps) / Math.max(1, sp.length)).toFixed(1);
    report.trip = g && +g.trip.toFixed(3);
    report.playoutMs = look.waits ? Math.round((1000 * look.wait) / look.waits) : null;
    step(`Kyle hears the leader (quiet ${g?.quiet?.toFixed(2)} s at the end)`, g && g.quiet < 1);
    step(`no join storm (${report.kyleJoinsFirst30s} job joins in the first 30 s, ${report.kyleJoinsPerMin} a minute in play, ${report.socketsOpenedInPlay} sockets opened, at most ${report.mostOpenAtOnce} open at once)`, report.kyleJoinsPerMin <= 4 && report.kyleJoinsFirst30s <= 6 && report.mostOpenAtOnce <= 4);
    step(`the leader moves smoothly on Kyle's screen (${report.stallPct}% of frames stalled while he walks, ${report.jumpPct}% drawn at over twice his pace)`, report.leaderMovingFrames > 100 && report.stallPct < 35);
    report.ok = report.steps.every((s) => s.ok) && !report.errors.length;
  } catch (e) {
    report.errors.push(String(e));
  }
  await browser.close();
  await r.quit().catch(() => {});
  console.log(JSON.stringify(report, null, 1));
  process.exit(report.ok ? 0 : 1);
})();
