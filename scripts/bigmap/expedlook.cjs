// An expedition in a real browser, phone and laptop, FLAT and 2.5D: the drop-in, the map screen with
// its pins, a job being done, a camp that's seen you (its horn), and the beacon held. Prints page errors.
// Needs `npm run build && npx vite preview --port 4370` running. Usage:
//   node scripts/bigmap/expedlook.cjs [outdir] [day]
const { chromium } = require('playwright');
const BASE = process.env.BASE || 'http://localhost:4370/';
const LAPTOP = { viewport: { width: 1280, height: 800 }, deviceScaleFactor: 2 };
const PHONE = { viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true };
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const out = process.argv[2] || 'shots', day = process.argv[3] || '4';

(async () => {
  const browser = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  for (const [dev, look] of [['phone', 'flat'], ['laptop', 'flat'], ['phone', '3d'], ['laptop', '3d']]) {
    const ctx = await browser.newContext(dev === 'phone' ? PHONE : LAPTOP), page = await ctx.newPage(), errors = [];
    page.on('pageerror', (e) => errors.push(String(e)));
    await page.goto(`${BASE}?hero=WARRIOR&exped=${day}&look=${look}`);
    await page.waitForFunction(() => window.__game && window.__game.room.exped, null, { timeout: 60000 });
    const tag = `${dev}-${look === '3d' ? '25d' : 'flat'}`, shot = (n) => page.screenshot({ path: `${out}/${n}-${tag}.png` });
    // Nobody dies while the camera's about.
    const safe = () => page.evaluate(() => (window.__game.hero.safeT = 1e9));
    await safe();
    await wait(2500);
    await shot('1-dropin');
    // A walk round half the map (the ground seen), then the map screen.
    await page.evaluate(() => {
      const g = window.__game, x = g.room.exped, h = g.hero;
      window.__tour = [...x.goals.slice(0, 2), x.camps[0]].map((p) => ({ x: p.x, y: p.y + 7 }));
      window.__tourAt = h ? { x: h.x, y: h.y } : null;
    });
    for (let i = 0; i < 3; i++) {
      await page.evaluate((i) => { const p = window.__tour[i], h = window.__game.hero; Object.assign(h, { x: p.x, y: p.y }); window.__game.room.prev.set('h:me', [p.x, p.y]); }, i);
      await wait(700);
    }
    await page.evaluate(() => { const p = window.__tourAt, h = window.__game.hero; Object.assign(h, p); window.__game.room.prev.set('h:me', [p.x, p.y]); });
    await page.evaluate(() => window.__game.room.enemies.forEach((e) => { if (e.alert !== false) return; }));
    await page.click('#mapbtn');
    await wait(600);
    await shot('2-map');
    await page.click('#expedmap [data-close]');
    // A job you stand at (the cookpot or the shrine if there is one, else the first), part done.
    await page.evaluate(() => {
      const g = window.__game, x = g.room.exped, q = x.goals.find((q) => q.kind === 'shrine' || q.kind === 'larder') ?? x.goals[0], h = g.hero;
      for (const e of g.room.allEnemies) if (Math.hypot(e.x - q.x, e.y - q.y) < 9 && e.act !== 'dead') Object.assign(e, { hp: 0, act: 'dead', actT: 0, actDur: 99, respawns: false });
      Object.assign(h, { x: q.x + 0.4, y: q.y + 0.6 });
      g.room.prev.set('h:me', [h.x, h.y]);
      window.__q = q;
    });
    await wait(look === '3d' ? 3500 : 2500);
    await shot('3-job');
    // A camp that's seen you: its horn, and everyone in it coming.
    await page.evaluate(() => {
      const g = window.__game, x = g.room.exped, h = g.hero, far = (c) => Math.hypot(c.x - h.x, c.y - h.y);
      const c = x.camps.filter((c) => !c.alerted).sort((a, b) => far(b) - far(a))[0] ?? x.camps[0];
      Object.assign(h, { x: c.x + 0.5, y: c.y + 7 });
      g.room.prev.set('h:me', [h.x, h.y]);
    });
    await wait(look === '3d' ? 3000 : 2200);
    await shot('4-horn');
    // The jobs done, the beacon lit and held, the watch nearly here.
    await page.evaluate(() => {
      const g = window.__game, x = g.room.exped, h = g.hero;
      for (const q of x.goals) (q.done = true), (q.p = 1);
      x.phase = 'hold';
      x.held = 41;
      x.nextHold = g.room.time;
      Object.assign(h, { x: x.zone.x + 1, y: x.zone.y + 1.5 });
      g.room.prev.set('h:me', [h.x, h.y]);
    });
    await wait(look === '3d' ? 4500 : 3500);
    await shot('5-beacon');
    const st = await page.evaluate(() => { const x = window.__game.room.exped; return { phase: x.phase, held: Math.round(x.held), level: x.level, goal: window.__game.goalText(), alive: window.__game.room.allEnemies.filter((e) => e.act !== 'dead').length }; });
    process.stderr.write(`${tag}: ${JSON.stringify(st)} ${errors.join(' | ') || 'no errors'}\n`);
    await ctx.close();
  }
  await browser.close();
})();
