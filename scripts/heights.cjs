// Heights and forks: a fork room with its two roads, the high road's ledge with archers (from below
// and from up top), and the low road. Phone and laptop.
const { chromium } = require('playwright');
const url = process.argv[2] || 'http://localhost:4173/?hero=RANGER';
(async () => {
  const browser = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const errors = [];
  for (const [tag, opts] of [['phone', { viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true }], ['laptop', { viewport: { width: 1280, height: 800 }, deviceScaleFactor: 2 }]]) {
    const ctx = await browser.newContext(opts);
    const page = await ctx.newPage();
    page.on('pageerror', (e) => errors.push(String(e)));
    page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
    await page.goto(url);
    await page.waitForFunction(() => window.__game);
    await page.evaluate(() => {
      const g = window.__game, j = g.jobs()[1];
      g.startJob({ ...j, place: { name: 'The Copperdeep Shafts', kind: 'mine', region: 'Copperdeep', ruin: 2 }, objective: 'hunt', boss: 'SKARN', rooms: 3, seed: 12 });
      // Win the first room and walk out: the fork.
      for (const e of g.room.enemies) Object.assign(e, { hp: 0, act: 'dead', respawns: false, death: 'burst' });
      g.room.exitOpen = true;
      Object.assign(g.hero, { x: 9, y: 0.4 });
    });
    await page.waitForTimeout(400);
    await page.evaluate(() => {
      const g = window.__game;
      for (const e of g.room.enemies) Object.assign(e, { hp: 0, act: 'dead', respawns: false, death: 'burst' });
      Object.assign(g.hero, { x: 9, y: 6 });
    });
    await page.waitForTimeout(600);
    await page.screenshot({ path: `shots/fork-${tag}.png` });
    console.log(tag, await page.evaluate(() => document.getElementById('banner').textContent));
    // The high road.
    await page.evaluate(() => {
      const g = window.__game, r = g.room.map.roads[0].area;
      Object.assign(g.hero, { x: r.x + 1, y: 0.4 });
    });
    await page.waitForTimeout(600);
    await page.evaluate(() => { const g = window.__game, l = g.room.map.ledges[0]; Object.assign(g.hero, { x: l.x + l.w / 2, y: l.h + 2.5 }); });
    await page.waitForTimeout(1500);
    await page.screenshot({ path: `shots/high-below-${tag}.png` });
    console.log(tag, await page.evaluate(() => window.render_game_to_text()));
    await page.evaluate(() => { const g = window.__game, l = g.room.map.ledges[0]; Object.assign(g.hero, { x: l.x + l.w / 2, y: 1.6, z: 1 }); for (const e of g.room.enemies) if (!e.bow) e.cooldown = 99; });
    await page.waitForTimeout(700);
    await page.screenshot({ path: `shots/high-top-${tag}.png` });
    await ctx.close();
  }
  console.log('errors', JSON.stringify(errors));
  await browser.close();
})();
