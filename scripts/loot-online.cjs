// Boss loot with a party (docs/design/boss-loot.md): Kyle (laptop, leading) and Sam (phone) go down into
// the Deep together; a named butcher dies; one unique piece drops for the group and a roll card comes up
// on both screens; Sam NEEDs (if it fits his class) or GREEDs, Kyle PASSes; Sam wins it into his pack.
// Usage: node scripts/loot-online.cjs   (builds with VITE_ONLINE, serves on 8793; JSON report)
const { execSync, spawn } = require('child_process');
const http = require('http');
const path = require('path');
const { chromium } = require('playwright');
const ROOT = path.join(__dirname, '..'), PORT = Number(process.env.ONLINE_PORT) || 8793;
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
    const seeds = await Promise.all([kyle, sam].map((p) => p.page.evaluate(() => window.__game.profile.deep?.seed ?? 0)));
    step(`each took their own snapshot at the way down, of the same run (${seeds.join(', ')})`, seeds[0] > 0 && seeds[0] === seeds[1]);
    // A named butcher dies on Kyle's room (burning, on its last point of health, so it dies in the room's own step).
    await kyle.page.evaluate(() => {
      const g = window.__game, r = g.room, e = r.enemies.find((x) => x.act !== 'dead' && x.kind === 'scrapper');
      Object.assign(e, { name: 'MAWL', hp: 1, burnUntil: r.time + 5, burnNext: r.time, dozing: false });
    });
    const card = (p) => until(p, () => { const el = document.querySelector('#roll'); return !!el && !el.hidden && getComputedStyle(el).display !== 'none' && !!el.querySelector('button[data-pick]'); }, null, 10000);
    step('one piece drops for the group: the roll card is up on Kyle\'s screen', await card(kyle));
    step('and on Sam\'s', await card(sam));
    const rolls = await kyle.page.evaluate(() => (window.__game.room.rolls ?? []).length);
    step(`exactly one roll for the kill (${rolls})`, rolls === 1);
    const samPick = await sam.page.evaluate(() => (document.querySelector('#roll button[data-pick="need"]')?.disabled ? 'greed' : 'need'));
    // (Real pointer presses: the card answers on pointerdown, as a tap does.)
    await sam.page.click(`#roll button[data-pick="${samPick}"]`);
    await kyle.page.click('#roll button[data-pick="pass"]');
    step(`Sam chose ${samPick.toUpperCase()}, Kyle PASS: Sam wins it`, await until(kyle, () => (window.__game.room.rolls ?? []).some((r) => r.winner && r.winner !== 'me'), null, 10000));
    step('the piece is in Sam\'s pack, a unique', await until(sam, () => window.__game.profile.bag.some((i) => i.unique), null, 10000));
    step('Kyle\'s pack has no piece of it', await kyle.page.evaluate(() => !window.__game.profile.bag.some((i) => i.unique)));
    step('both screens show the result', await until(sam, () => /WON/.test(document.querySelector('#roll')?.textContent ?? ''), null, 5000) && await until(kyle, () => /WON/.test(document.querySelector('#roll')?.textContent ?? ''), null, 5000));
    await sam.page.screenshot({ path: path.join(ROOT, 'shots/loot/online-phone.png') });
    report.ok = report.steps.every((s) => s.ok) && !report.errors.length;
  } catch (e) {
    report.errors.push(String(e));
  }
  await browser.close();
  srv.kill();
  console.log(JSON.stringify(report, null, 1));
  process.exit(report.ok ? 0 : 1);
})();
