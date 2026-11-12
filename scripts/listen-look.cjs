// THE LISTENER on a phone (docs/design/deep-layer-bosses.md section 1): idle, the rise at its hole, the rock
// mid-throw, a column falling with its lane, the sweep, phase 2 dark. Usage: node scripts/listen-look.cjs [url] [outdir]
const { chromium } = require('playwright');
const url = process.argv[2] || 'http://localhost:4173/';
const out = process.argv[3] || 'shots';

(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  await page.goto(`${url}?hero=WARRIOR`);
  await page.waitForFunction(() => window.__game && window.__game.mode === 'town', null, { timeout: 20000 });
  const where = await page.evaluate(() => {
    const g = window.__game;
    g.enterDeep();
    g.profile.deep.floor = 9;
    g.descend();
    return [g.run.job.floor, g.room.enemies.some((e) => e.boss?.who === 'listener')];
  });
  console.log('floor, listener:', where);
  await page.waitForTimeout(900);
  const shot = async (name) => { await page.screenshot({ path: `${out}/listen-${name}.png` }); console.log(name); };
  const L = () => window.__game.room.enemies.find((e) => e.boss?.who === 'listener');
  // The rotation the room works through (sim/listener.ts listenRotation, phase 1 or 2).
  const force = (move, phase, at) => page.evaluate(({ move, phase, at }) => {
    const g = window.__game, r = g.room, h = r.enemies.find((e) => e.boss?.who === 'listener'), me = g.hero;
    const base = { 1: ['rock', 'drop', 'sweep', 'rock', 'charge', 'rock', 'drop', 'sweep'], 2: ['drop', 'sweep', 'rock', 'drop', 'sweep', 'charge', 'drop', 'sweep', 'drop', 'sweep'] }[phase];
    const rot = [...base], n = rot.length, i0 = (((r.bosses.swaps[phase - 1] ?? 0) % n) + n) % n;
    for (let k = 0; k < n; k++) { const i = (i0 + k) % n, j = (i + 1) % n; if (['drop', 'sweep'].includes(rot[i]) || ['drop', 'sweep'].includes(rot[j]) || rot[i] === rot[j]) continue; [rot[i], rot[j]] = [rot[j], rot[i]]; break; }
    Object.assign(h, { x: 6, y: 5.4, fx: 0, fy: 1, alert: true, attack: null, act: 'chase', actT: 0, cooldown: 0, kvx: 0, kvy: 0 });
    Object.assign(h.boss, { phase, rot: rot.indexOf(move), rotAt: r.time, stagUntil: -9, downUntil: -9, roarUntil: -9, under: false });
    Object.assign(me, { x: at[0], y: at[1], hp: me.maxHp, safeT: 0 });
    r.bosses.started = r.bosses.started < 0 ? r.time : r.bosses.started;
  }, { move, phase, at });
  const at = (move, k) => page.waitForFunction(({ move, k }) => {
    const h = window.__game.room.enemies.find((e) => e.boss?.who === 'listener'), a = h?.attack;
    return !!a && h.boss.lmove === move && a.t >= a.windup * k;
  }, { move, k }, { timeout: 9000 }).then(() => true, () => false);

  await page.evaluate(() => { const g = window.__game; Object.assign(g.hero, { x: 6, y: 9.6 }); Object.assign(window.__game.room.enemies.find((e) => e.boss?.who === 'listener'), { x: 6, y: 5.6 }); });
  await page.waitForTimeout(500);
  await shot('idle');
  await force('rock', 1, [6, 9.8]);
  if (await at('rock', 0.25)) await shot('rock-wrench');
  if (await at('rock', 0.86)) await shot('rock-throw');
  await force('drop', 1, [3.4, 8]);
  if (await at('drop', 0.8)) await shot('drop-dive');
  if (await at('rise', 0.7)) await shot('rise-telegraph');
  await page.waitForTimeout(450);
  await shot('rise-burst');
  await force('sweep', 1, [6, 5.6]);
  await page.evaluate(() => { const h = window.__game.room.enemies.find((e) => e.boss?.who === 'listener'); Object.assign(h, { x: 6, y: 4 }); });
  if (await at('sweep', 1.0)) await shot('sweep');
  await force('charge', 1, [6, 10]);
  if (await at('charge', 0.8)) await shot('charge');
  // A column falling, the lane showing.
  await page.evaluate(() => {
    const g = window.__game, r = g.room, c = r.props.find((p) => p.kind === 'column' && p.x > 5 && p.x < 7), h = r.enemies.find((e) => e.boss?.who === 'listener');
    Object.assign(h, { x: 2.5, y: 2, attack: null, act: 'chase', alert: false });
    Object.assign(h.boss, { roarUntil: 1e9 });
    Object.assign(g.hero, { x: 3.5, y: 7.8, hp: g.hero.maxHp, safeT: 99 });
    c.fallAt = r.time + 0.9;
  });
  await page.waitForTimeout(520);
  await shot('column-falling');
  await page.waitForTimeout(900);
  await shot('column-fallen');
  // Knocked down by a column.
  await page.evaluate(() => { const r = window.__game.room, h = r.enemies.find((e) => e.boss?.who === 'listener'); Object.assign(h.boss, { roarUntil: -9, downUntil: r.time + 3 }); Object.assign(h, { x: 6, y: 6 }); Object.assign(window.__game.hero, { x: 6, y: 9 }); });
  await page.waitForTimeout(700);
  await shot('down');
  // Phase 2: the torches out.
  await page.evaluate(() => { const r = window.__game.room, h = r.enemies.find((e) => e.boss?.who === 'listener'); Object.assign(h.boss, { downUntil: -9, roarUntil: -9, phase: 2, dark: true }); Object.assign(h, { x: 6, y: 6.5, fx: 0, fy: 1, alert: true }); Object.assign(window.__game.hero, { x: 6, y: 9.6 }); });
  await page.waitForTimeout(2200);
  await shot('dark');
  console.log('errors:', errors.length ? errors.slice(0, 5) : 'none');
  await browser.close();
})();
