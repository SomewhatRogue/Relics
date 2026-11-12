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
    const seeds = await Promise.all([kyle, sam].map((p) => p.page.evaluate(() => window.__game.profile.deep?.seed ?? 0)));
    step(`each took their own snapshot at the way down, of the same run (${seeds.join(', ')})`, seeds[0] > 0 && seeds[0] === seeds[1]);
    const toEnd = (gold) => kyle.page.evaluate((gold) => {
      const g = window.__game, x = g.room.map.exit;
      g.run.gold = gold;
      g.openForTest();
      for (const h of g.room.heroes) Object.assign(h, { x: x.x + x.w / 2, y: x.y + x.h / 2, act: 'idle', kvx: 0, kvy: 0 });
    }, gold);
    const asked = (p, n) => until(p, (n) => new RegExp(`floor ${n}`, 'i').test(document.querySelector('#panel h2')?.textContent ?? ''), n, 8000);
    const press = (p, label) => p.page.evaluate((label) => [...document.querySelectorAll('#panel button')].find((b) => b.textContent === label || b.querySelector('b')?.textContent === label)?.click(), label);
    await toEnd(40);
    step('floor 1\'s end: Sam is asked on his own screen', await asked(sam, 1));
    step('and Kyle on his', await asked(kyle, 1));
    await press(sam, 'GO DEEPER');
    await wait(1500);
    // Who's chosen what, on both screens (client/deepui.ts): Kyle sees Sam's GO DEEPER, Sam waits and sees Kyle choosing.
    step("Kyle's checkpoint shows Sam chose GO DEEPER", await until(kyle, () => /sam\s*go deeper/i.test(document.querySelector('#panel .deep-votes')?.textContent ?? ''), null, 6000));
    step("Sam's waits, and shows Kyle still choosing", await until(sam, () => /waiting/i.test(document.querySelector('#panel h2')?.textContent ?? '') && /kyle\s*choosing/i.test(document.querySelector('#panel .deep-votes')?.textContent ?? ''), null, 6000));
    await kyle.page.screenshot({ path: 'shots/deep-checkpoint.png' });
    await sam.page.screenshot({ path: 'shots/deep-waiting.png' });
    step('Sam chose GO DEEPER: Kyle\'s game waits on Kyle', await kyle.page.evaluate(() => window.__game.run.job.floor === 1));
    await press(kyle, 'GO DEEPER');
    step('Kyle chose it too: the party goes down to floor 2', await until(kyle, () => window.__game.run?.job.floor === 2));
    step('Sam is on floor 2 with him, his snapshot following', await until(sam, () => window.__game.run?.job.floor === 2 && window.__game.profile.deep?.floor === 2 && window.__game.room.heroes.some((h) => h.id === 'me'), null, 10000));
    // A curse Sam carries reaches Kyle's room on Sam's input (shared/deepmarks.ts): the room puts it on Sam's hero.
    await sam.page.evaluate(() => { window.__game.profile.deep.marks = ['frail']; });
    step("Sam's curse is on Sam's hero in Kyle's room", await until(kyle, () => window.__game.room.heroes.some((h) => h.id !== 'me' && (h.marks ?? []).includes('frail')), null, 6000));
    const samGold = await sam.page.evaluate(() => window.__game.profile.gold);
    await wait(800);
    await toEnd(70);
    step('floor 2\'s end: Sam is asked', await asked(sam, 2));
    await press(sam, 'LEAVE');
    step('Sam LEAVEs: home with the party\'s 70 gold, out of the Deep', await until(sam, (g0) => window.__game.mode === 'town' && window.__game.profile.gold >= g0 + 70 && !window.__game.profile.deep, samGold, 10000));
    step('Sam\'s recap says he came up from floor 2', await until(sam, () => /out of the deep/i.test(document.querySelector('#panel h2')?.textContent ?? ''), null, 5000));
    step('Kyle goes on alone, still on floor 2', await kyle.page.evaluate(() => window.__game.mode === 'run' && window.__game.run.job.floor === 2));
    const kit = await kyle.page.evaluate(() => { const p = window.__game.profile; return JSON.stringify(p.deep.entry); });
    const kyleGold = await kyle.page.evaluate(() => window.__game.profile.gold);
    await kyle.page.evaluate(() => { const p = window.__game.profile; p.bag.push({ slot: 'ring', quality: 'fine', traits: [] }); window.__game.endForTest(false); });
    step('Kyle dies below: home, no gold from it, the kit he took down back', await until(kyle, ([kit, g0]) => {
      const g = window.__game, p = g.profile;
      return g.mode === 'town' && p.gold === g0 && JSON.stringify({ weapon: p.weapon, arms: p.arms, bag: p.bag, armor: p.armor, rings: p.rings }) === kit;
    }, [kit, kyleGold], 10000));
    report.ok = report.steps.every((s) => s.ok) && !report.errors.length;
  } catch (e) {
    report.errors.push(String(e));
  }
  await browser.close();
  srv.kill();
  console.log(JSON.stringify(report, null, 1));
  process.exit(report.ok ? 0 : 1);
})();
