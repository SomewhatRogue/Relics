// The atlas's first two slices on a phone, FLAT and 2.5D (docs/plans/atlas.md): Hangman's Wood's approach (a
// dropper coming down by the body at the waymark), the gibbet's winch held with the cage half down, the Gospel
// Oak burning, and a village street with its houses shut beside the one big house you can go into.
// Targets: scripts/atlas/target.json (npx tsx scripts/atlas/find.ts > scripts/atlas/target.json).
// Usage: node scripts/atlas-look.cjs [url] [outdir]
const { chromium } = require('playwright');
const target = require('./atlas/target.json');
const url = process.argv[2] || 'http://localhost:4424/?hero=WARRIOR';
const out = process.argv[3] || 'shots';
const NOON = 2400000 * 700 + 1200000;
const PHONE = { viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true };

/** Into today's Hangman's Wood (day 3), the moment `what` set up and held still. */
async function wood(page, look, what) {
  // (In the day, so the shot reads: the posting's own hour may be night.)
  await page.goto(`${url}${look === '3d' ? '&look=3d' : ''}`);
  await page.waitForFunction(() => window.__game && window.__fx, null, { timeout: 60000 });
  await page.evaluate((ms) => { Date.now = () => ms; const g = window.__game; g.startJob({ ...g.jobs().find((j) => j.exped === 'hangmans'), time: 'day', twist: 'none' }); }, NOON);
  await page.waitForFunction(() => window.__game.room && window.__game.room.exped, null, { timeout: 60000 });
  await page.waitForTimeout(500);
  return page.evaluate(async (what) => {
    const g = window.__game, r = g.room, fx = window.__fx, h = g.hero, hang = r.map.hang, wait = (ms) => new Promise((d) => setTimeout(d, ms));
    const step = (n) => { for (let i = 0; i < n; i++) { r.step(); for (const ev of r.events) fx.on(ev); } };
    Object.assign(h, { hp: 9999, maxHp: 9999, safeT: 0 });
    const info = {};
    if (what === 'approach') {
      // By the body at the waymark: the dropper in the branches over it has let go, its shadow on the spot.
      const d = r.enemies.find((e) => e.task && e.task.k === 'perch' && Math.hypot(e.x - 21, e.y - 33) < 4);
      Object.assign(h, { x: d.x + 0.6, y: d.y + 1.8, fx: 0, fy: -1 });
      for (let i = 0; i < 40 && !(d.task.at > 0); i++) step(1);
      step(14);
      info.drop = d.task;
    } else if (what === 'winch') {
      // At the winch, the cage half down, the winchers turned on you and the wave come in.
      const w = r.exped.goals.find((q) => q.kind === 'winch');
      Object.assign(h, { x: w.x + 0.4, y: w.y + 0.6, fx: 1, fy: -0.4 });
      w.p = 0.45, (w.away = 0);
      step(40);
      info.p = w.p;
    } else if (what === 'oak') {
      // The Gospel Oak burning from inside, wood coming down round it, the brood mother burning out of the hollow.
      const oak = r.map.blocks[hang.oak];
      Object.assign(h, { x: oak.x + oak.w / 2 + 1.2, y: oak.y + oak.h + 2.6, fx: -0.3, fy: -1 });
      // (The nest's spiders and the knots up the path kept out of the shot.)
      for (const e of r.enemies) if (e.kind !== 'brood' && Math.hypot(e.x - h.x, e.y - h.y) < 12) Object.assign(e, { x: 1, y: 1, hp: 0, act: 'dead', respawns: false, death: 'burst' });
      oak.burning = r.time;
      step(120);
      info.falls = (oak.falls || []).length, (info.hp = oak.hp);
    }
    g.step = () => [];
    for (const q of r.heroes) r.prev.set('h:' + q.id, [q.x, q.y]);
    for (const e of r.enemies) r.prev.set('e:' + e.id, [e.x, e.y]);
    await wait(10);
    return info;
  }, what);
}

/** The village street: its shut houses and the big one, from in front of them, in the day. */
async function street(page, look) {
  await page.goto(`${url}${look === '3d' ? '&look=3d' : ''}`);
  await page.waitForFunction(() => window.__game && window.__fx, null, { timeout: 60000 });
  await page.evaluate((ms) => { Date.now = () => ms; }, NOON);
  return page.evaluate(async (t) => {
    const g = window.__game, wait = (ms) => new Promise((d) => setTimeout(d, ms));
    g.startJob({ ...t.job, time: 'day', twist: 'none' });
    await wait(300);
    const r = g.room, b = t.big;
    for (const e of r.enemies) Object.assign(e, { x: 1, y: 1, hp: 0, act: 'dead', respawns: false, death: 'burst' });
    Object.assign(g.hero, { x: b.x - 1.4, y: b.y + b.h + 1.4, hp: 9999, maxHp: 9999 });
    for (let i = 0; i < 10; i++) r.step();
    g.step = () => [];
    r.prev.set('h:' + g.hero.id, [g.hero.x, g.hero.y]);
    await wait(10);
    return { shut: r.map.blocks.filter((q) => q.shut).map((q) => q.shut), doors: r.map.blocks.filter((q) => q.door).map((q) => q.door) };
  }, target);
}

(async () => {
  const browser = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const errors = [];
  for (const look of ['flat', '3d']) {
    const ctx = await browser.newContext(PHONE), page = await ctx.newPage();
    page.on('pageerror', (e) => errors.push(`${look} ${e}`));
    page.on('console', (m) => m.type() === 'error' && errors.push(`${look} ${m.text()}`));
    for (const what of ['approach', 'winch', 'oak']) {
      const info = await wood(page, look, what);
      await page.waitForTimeout(3500);
      await page.screenshot({ path: `${out}/wood-${what}-${look}.png` });
      console.log(what, look, JSON.stringify(info), await page.evaluate(() => window.__game.goalText && window.__game.goalText()));
    }
    const s = await street(page, look);
    await page.waitForTimeout(3500);
    await page.screenshot({ path: `${out}/doors-village-${look}.png` });
    console.log('street', look, JSON.stringify(s));
    await ctx.close();
  }
  await browser.close();
  console.log(errors.length ? 'ERRORS\n' + errors.join('\n') : 'no page errors');
})();
