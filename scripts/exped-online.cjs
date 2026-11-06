// An expedition online, end to end: Kyle (laptop) gathers a party for THE BARROWFIELDS at the board,
// Sam (phone) joins, they set out. Checks that Sam built the map from its seed (it's never sent), sees
// the jobs and Kyle, gets only what's near him, hears a camp's horn from across the map, and that no
// message passes the relay's limit; then reports what Sam receives a second and both pages' frame times.
// Usage: node scripts/exped-online.cjs   (builds with VITE_ONLINE unless NOBUILD=1; port EXPED_PORT or 8922; JSON report)
const { execSync, spawn } = require('child_process');
const http = require('http');
const path = require('path');
const { chromium } = require('playwright');
const ROOT = path.join(__dirname, '..'), PORT = Number(process.env.EXPED_PORT || process.env.ONLINE_PORT) || 8922;
// ZONE=hangmans: the same run in Hangman's Wood (shared/hangwood.ts) instead of the Barrowfields.
const ZONE = process.env.ZONE || 'barrowfields', WOOD = ZONE === 'hangmans';
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
// Every page counts what comes in over its sockets and how big each message is, and its frame gaps.
const COUNT = () => {
  window.__net = { bytes: 0, msgs: 0, biggest: 0, sent: 0, sentBiggest: 0 };
  window.__gaps = [];
  let last = 0;
  const f = (t) => { if (last) window.__gaps.push(t - last); last = t; requestAnimationFrame(f); };
  requestAnimationFrame(f);
  const WS = window.WebSocket;
  window.WebSocket = class extends WS {
    constructor(u, p) {
      super(u, p);
      this.addEventListener('message', (e) => { const n = String(e.data).length; window.__net.bytes += n; window.__net.msgs++; window.__net.biggest = Math.max(window.__net.biggest, n); });
    }
    send(d) { const n = String(d).length; window.__net.sent += n; window.__net.sentBiggest = Math.max(window.__net.sentBiggest, n); super.send(d); }
  };
};

(async () => {
  const report = { ok: false, steps: [], numbers: {}, errors: [] };
  if (!process.env.NOBUILD) execSync('npx vite build', { cwd: ROOT, env: { ...process.env, VITE_ONLINE: '1' }, stdio: 'ignore' });
  const srv = spawn(path.join(ROOT, 'node_modules/.bin/tsx'), ['scripts/online-server.ts'], { cwd: ROOT, env: { LAG_MS: '120', ...process.env, PORT: String(PORT) }, stdio: 'ignore' });
  for (let i = 0; i < 100; i++) {
    if (await new Promise((r) => http.get(`http://127.0.0.1:${PORT}/`, (res) => (res.resume(), r(true))).on('error', () => r(false)))) break;
    await wait(200);
  }
  const browser = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const open = async (name, cls, opts) => {
    const ctx = await browser.newContext(opts);
    await ctx.addInitScript(COUNT);
    const page = await ctx.newPage();
    page.on('pageerror', (e) => report.errors.push(`${name}: ${e}`));
    await page.goto(`http://127.0.0.1:${PORT}/`);
    await page.waitForFunction(() => window.__game);
    await page.evaluate(([cls, name]) => { window.__game.create(cls, name); if (window.__game.mode === 'wood') window.__game.skipWood(); document.getElementById('title').hidden = true; window.__title.open = false; }, [cls, name]);
    return { name, ctx, page };
  };
  const step = (s, ok, got) => (report.steps.push({ s, ok: !!ok, ...(got !== undefined ? { got } : {}) }), ok);
  const until = (p, fn, arg, ms = 10000) => p.page.waitForFunction(fn, arg, { timeout: ms, polling: 100 }).then(() => true, () => false);
  const stats = (g) => { const s = [...g].sort((a, b) => a - b), m = s.reduce((a, b) => a + b, 0) / Math.max(1, s.length); return { fps: +(1000 / m).toFixed(1), mean: +m.toFixed(1), p95: +(s[Math.floor(s.length * 0.95)] ?? 0).toFixed(1) }; };
  try {
    const kyle = await open('KYLE', 'WARRIOR', { viewport: { width: 1280, height: 800 } });
    const sam = await open('SAM', 'RANGER', { viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true });
    step('they see each other in town', await until(sam, () => window.__town().here.some((h) => h.name === 'KYLE')));
    await kyle.page.evaluate(() => window.__openSpot('board'));
    const at = await kyle.page.evaluate((z) => window.__game.jobs().findIndex((j) => j.exped === z), ZONE);
    step(`${WOOD ? "HANGMAN'S WOOD" : 'THE BARROWFIELDS'} is on the board (posting ${at})`, at >= 0);
    await kyle.page.click(`#panel [data-open="${at}"]`);
    await kyle.page.screenshot({ path: path.join(ROOT, 'shots/exped-board-laptop.png') });
    await kyle.page.click(`#panel [data-gather="${at}"]`);
    await sam.page.evaluate(() => window.__openSpot('board'));
    step("Sam's board shows Kyle's party", await until(sam, () => !!document.querySelector('#panel [data-joinparty]')));
    await sam.page.click('#panel [data-joinparty]');
    await sam.page.evaluate(() => window.__panel.hide());
    step('Sam is in the party', await until(kyle, () => /SAM/.test(document.querySelector('#partycard ul')?.textContent)));
    await kyle.page.evaluate(() => document.querySelector('#partycard.shut .pc-line')?.click());
    await kyle.page.click('#partycard [data-setout]');
    step('Kyle sets out on the expedition', await until(kyle, () => window.__game.mode === 'run' && !!window.__game.room.exped));
    step("Sam is pulled into it, the map built from its seed", await until(sam, (w) => window.__game.mode === 'run' && window.__game.room.map.w === w && window.__game.room.heroes.some((h) => h.id === '@lead'), WOOD ? 72 : 96, 20000));
    const same = await Promise.all([kyle, sam].map((p) => p.page.evaluate(() => { const m = window.__game.room.map; return [m.rounds.length, m.blocks.length, m.water.length, m.hero.x.toFixed(2)].join(','); })));
    step(`the same map on both screens (${same[0]})`, same[0] === same[1]);
    step("Sam's map screen has the jobs", await until(sam, () => (window.__game.room.exped?.goals?.length ?? 0) >= 2));
    await sam.page.click('#mapbtn');
    await wait(500);
    await sam.page.screenshot({ path: path.join(ROOT, 'shots/exped-online-map-phone.png') });
    await sam.page.click('#expedmap [data-close]');
    // Measured play: Kyle across the map at a camp (fighting, his horn), Sam walking near the way in.
    await kyle.page.evaluate(() => { const g = window.__game, c = g.room.exped.camps[0] ?? g.room.map.hang.beats.find((b) => b.kind === 'gibbet'); Object.assign(g.hero, { x: c.x, y: c.y + 5, safeT: 1e9 }); g.room.prev.set('h:me', [g.hero.x, g.hero.y]); });
    await Promise.all([kyle, sam].map((p) => p.page.evaluate(() => { window.__net.bytes = window.__net.msgs = window.__net.biggest = window.__net.sent = window.__net.sentBiggest = 0; window.__gaps.length = 0; window.__t0 = performance.now(); })));
    await sam.page.keyboard.down('w');
    await wait(4000);
    await sam.page.keyboard.up('w');
    await kyle.page.keyboard.down(' ');
    for (let i = 0; i < 8; i++) {
      await sam.page.keyboard.down(i % 2 ? 'a' : 'd');
      await wait(1500);
      await sam.page.keyboard.up(i % 2 ? 'a' : 'd');
    }
    await kyle.page.keyboard.up(' ');
    const n = await Promise.all([kyle, sam].map((p) => p.page.evaluate(() => ({ net: window.__net, secs: (performance.now() - window.__t0) / 1000, gaps: window.__gaps.slice(), mine: window.__game.room.enemies.length, all: window.__game.room.allEnemies.length }))));
    const [k, s] = n;
    report.numbers = {
      samKBs: +(s.net.bytes / 1024 / s.secs).toFixed(1), samMsgsPerSec: +(s.net.msgs / s.secs).toFixed(1), samBiggestKB: +(s.net.biggest / 1024).toFixed(1),
      kyleUpKBs: +(k.net.sent / 1024 / k.secs).toFixed(1), kyleBiggestSentKB: +(k.net.sentBiggest / 1024).toFixed(1),
      kyleFrames: stats(k.gaps), samFrames: stats(s.gaps), goblinsKyle: k.all, goblinsSamSees: s.mine,
    };
    step(`no message over the relay's limit (Kyle's biggest ${report.numbers.kyleBiggestSentKB} KB)`, k.net.sentBiggest < 64000 && s.net.biggest < 65536);
    step(`Sam gets only what's near him (${s.mine} goblins of ${k.all})`, s.mine < k.all / 2);
    if (WOOD) step("Sam's screen has the snare line and the gibbet's winch from the leader", await until(sam, () => window.__game.room.nooses.length > 0 && window.__game.room.exped.goals.some((g) => g.kind === 'winch'), null, 15000));
    else step("Kyle's camp heard its horn, and Sam's map shows it", await until(sam, () => window.__game.room.exped.camps.some((c) => c.alerted), null, 15000));
    const kx = await kyle.page.evaluate(() => [window.__game.hero.x, window.__game.hero.y]);
    step('Sam sees where Kyle is, across the map', await until(sam, (kx) => { const h = window.__game.room.heroes.find((x) => x.id === '@lead'); return h && Math.hypot(h.x - kx[0], h.y - kx[1]) < 3; }, kx));
    await kyle.page.screenshot({ path: path.join(ROOT, `shots/${WOOD ? 'wood' : 'exped'}-online-laptop.png`) });
    await sam.page.screenshot({ path: path.join(ROOT, `shots/${WOOD ? 'wood' : 'exped'}-online-phone.png`) });
    report.ok = report.steps.every((x) => x.ok) && !report.errors.length;
  } catch (e) {
    report.errors.push(String(e));
  }
  await browser.close();
  srv.kill();
  console.log(JSON.stringify(report, null, 1));
  process.exit(report.ok ? 0 : 1);
})();
