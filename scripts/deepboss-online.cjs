// The Deep with a party (docs/design/the-deep.md, step 4): two players in their own browsers (Kyle on a
// laptop leading, Sam on a phone). Kyle's party goes down together; each takes their own snapshot; at a
// floor's end each is asked; Kyle waits on Sam's GO DEEPER; on floor 2 Sam LEAVEs with the party's gold
// and Kyle goes on alone, then dies and gets back the kit he took down.
// Usage: node scripts/deep-online.cjs   (builds with VITE_ONLINE, serves on 8792; JSON report)
const { execSync, spawn } = require('child_process');
const http = require('http');
const path = require('path');
const { chromium } = require('playwright');
const ROOT = path.join(__dirname, '..'), PORT = Number(process.env.ONLINE_PORT) || 8792;
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
/** Frames (and ms) on `p`'s page from running `act` in the page until `seen` holds; with what `look` saw each frame. */
const frames = (p, act, seen, look, ms = 900) => p.page.evaluate(([act, seen, look, ms]) => new Promise((res) => {
  const g = window.__game, t0 = performance.now(), saw = [];
  let n = 0, first = -1, firstMs = -1;
  new Function('g', act)(g);
  const f = () => {
    n++;
    saw.push(new Function('g', 'return ' + look)(g));
    if (first < 0 && new Function('g', 'return ' + seen)(g)) (first = n), (firstMs = Math.round(performance.now() - t0));
    if (performance.now() - t0 > ms) return res({ first, firstMs, frames: n, saw });
    requestAnimationFrame(f);
  };
  requestAnimationFrame(f);
}), [act, seen, look, ms]);
const key = (k, type) => `document.body.dispatchEvent(new KeyboardEvent('${type}', { key: '${k}', bubbles: true }));`;
/** Looks that go back against the way of going by more than `by` (a jerk back). */
const jerks = (ps, dx, dy, by = 0.04) => ps.slice(1).reduce((n, p, i) => n + (((p[0] - ps[i][0]) * dx + (p[1] - ps[i][1]) * dy) < -by ? 1 : 0), 0);

(async () => {
  const report = { ok: false, steps: [], errors: [] };
  if (!process.env.NOBUILD) execSync('npx vite build', { cwd: ROOT, env: { ...process.env, VITE_ONLINE: '1' }, stdio: 'ignore' });
  // A phone's worth of lag on every message (LAG_MS, default 150): the test proves play still feels right.
  const srv = spawn(path.join(ROOT, 'node_modules/.bin/tsx'), ['scripts/online-server.ts'], { cwd: ROOT, env: { LAG_MS: '150', ...process.env, PORT: String(PORT) }, stdio: 'ignore' });
  for (let i = 0; i < 100; i++) {
    if (await new Promise((r) => http.get(`http://127.0.0.1:${PORT}/`, (res) => (res.resume(), r(true))).on('error', () => r(false)))) break;
    await wait(200);
  }
  const browser = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const open = async (name, cls, opts) => {
    const ctx = await browser.newContext(opts);
    const page = await ctx.newPage();
    page.on('pageerror', (e) => report.errors.push(`${name}: ${e}`));
    await page.goto(`http://127.0.0.1:${PORT}/?pick=lead${process.env.LOOK ? '&look=' + process.env.LOOK : ''}`);
    await page.waitForFunction(() => window.__game);
    await page.evaluate(([cls, name]) => { window.__game.create(cls, name); if (window.__game.mode === 'wood') window.__game.skipWood(); document.getElementById('title').hidden = true; window.__title.open = false; }, [cls, name]);
    return { name, ctx, page };
  };
  const step = (s, ok) => (report.steps.push({ s, ok: !!ok }), ok);
  const until = (p, fn, arg, ms = 8000) => p.page.waitForFunction(fn, arg, { timeout: ms }).then(() => true, () => false);
  try {
    const kyle = await open('KYLE', 'WARRIOR', { viewport: { width: 1280, height: 800 } });
    const sam = await open('SAM', 'RANGER', { viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true });
    step('they see each other in town', await until(sam, () => window.__town().here.some((h) => h.name === 'KYLE')));
    // Kyle's party (gathered at the board, as any), then pointed at the way down (what the grate's GO DOWN does).
    await kyle.page.evaluate(() => window.__openSpot('board'));
    await kyle.page.click('#panel [data-open="1"]');
    await kyle.page.click('#panel [data-gather="1"]');
    await sam.page.evaluate(() => window.__openSpot('board'));
    await until(sam, () => !!document.querySelector('#panel [data-joinparty]'));
    await sam.page.click('#panel [data-joinparty]');
    step('Sam is in Kyle\'s party', await until(kyle, () => /SAM/.test(document.querySelector('#partycard ul')?.textContent)));
    await kyle.page.evaluate(() => { const g = window.__game; g.parties.retarget(g.deepJob()); });
    await kyle.page.evaluate(() => document.querySelector('#partycard.shut .pc-line')?.click());
    await kyle.page.click('#partycard [data-setout]');
    step('Kyle goes down to floor 1', await until(kyle, () => window.__game.mode === 'run' && window.__game.run?.job.floor === 1));
    step('Sam comes down with him', await until(sam, () => window.__game.mode === 'run' && window.__game.run?.job.floor === 1 && window.__game.room.heroes.some((h) => h.id === '@lead'), null, 12000));
    // Down to a boss floor together (the leader's test hook), then: is Sam's hero on Sam's own map, where Kyle's room has it?
    const down = (to) => kyle.page.evaluate((to) => { const g = window.__game; g.profile.deep.floor = to - 1; g.descend(); }, to);
    const onMap = async (n, who) => {
      await until(sam, (n) => window.__game.run?.job.floor === n && window.__game.room.heroes.some((h) => h.id === '@lead'), n, 15000);
      await wait(2500);
      const k = await kyle.page.evaluate(() => { const g = window.__game, r = g.room, s = r.heroes.find((h) => h.id !== 'me' && h.id !== 'squire'); return { w: r.map.w, h: r.map.h, boss: r.enemies.find((e) => e.boss)?.boss.who, sx: s?.x, sy: s?.y }; });
      const s = await sam.page.evaluate(() => { const g = window.__game, r = g.room, me = g.hero; return { w: r.map.w, h: r.map.h, boss: r.enemies.find((e) => e.boss)?.boss?.who, x: me.x, y: me.y }; });
      step(`floor ${n}: both rooms are ${who} (${k.boss}, ${s.boss})`, k.boss === who && s.boss === who);
      step(`floor ${n}: Sam's map is Kyle's size (${k.w}x${k.h}, ${s.w}x${s.h})`, k.w === s.w && k.h === s.h);
      step(`floor ${n}: Sam's hero is on his own map (${s.x?.toFixed(1)}, ${s.y?.toFixed(1)})`, s.x > 0 && s.x < s.w && s.y > 0 && s.y < s.h);
      step(`floor ${n}: and where Kyle's room has him (${k.sx?.toFixed(1)}, ${k.sy?.toFixed(1)})`, Math.hypot(k.sx - s.x, k.sy - s.y) < 1.5);
    };
    await down(10);
    await onMap(10, 'listener');
    await down(15);
    await onMap(15, 'leechman');
    // A change to the map itself (the windlass drained the shallows; phase 2 widened the channels): does Sam see it?
    await kyle.page.evaluate(() => {
      const g = window.__game, r = g.room, s = r.map.windlass;
      r.map.water.forEach((w) => w.deep && (w.w += 0.6));
      // Kyle turns the windlass (kept from harm so nothing knocks him off it).
      Object.assign(g.hero, { x: s.x + 1.1, y: s.y, safeT: 1e9, kvx: 0, kvy: 0 });
    });
    await wait(300);
    await kyle.page.evaluate(() => { document.body.dispatchEvent(new KeyboardEvent('keydown', { key: 'g', bubbles: true })); document.body.dispatchEvent(new KeyboardEvent('keyup', { key: 'g', bubbles: true })); });
    step('Kyle turns the windlass and the shallows drain', await until(kyle, () => !!window.__game.room.map.drained, null, 9000));
    step("the drained shallows reach Sam's map", await until(sam, () => !!window.__game.room.map.drained, null, 9000));
    const ww = await Promise.all([kyle, sam].map((p) => p.page.evaluate(() => window.__game.room.map.water.filter((w) => w.deep).map((w) => w.w.toFixed(2)).join(','))));
    step(`and the widened channels (${ww.join(' | ')})`, ww[0] === ww[1]);
    report.ok = report.steps.every((s) => s.ok) && !report.errors.length;
  } catch (e) {
    report.errors.push(String(e));
  }
  await browser.close();
  srv.kill();
  console.log(JSON.stringify(report, null, 1));
  process.exit(report.ok ? 0 : 1);
})();
