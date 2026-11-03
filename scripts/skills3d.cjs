// The trainer skills' areas in FLAT and 2.5D at the same moment, in the yard: a Shield Stamp winding
// up, a Volley falling, a Fire Ring burning, a Storm Tether, a Censer Chain hauling a goblin in. The
// room is held still and the skills set straight into it (for the picture only).
// Usage: node scripts/skills3d.cjs [url] [outdir]
const { chromium } = require('playwright');
const url = process.argv[2] || 'http://localhost:4203/';
const out = process.argv[3] || 'shots';

(async () => {
  const browser = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  for (const [dev, opts] of [['phone', { viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true }], ['laptop', { viewport: { width: 1280, height: 800 }, deviceScaleFactor: 2 }]]) {
    const ctx = await browser.newContext(opts);
    const page = await ctx.newPage();
    const errors = [];
    page.on('pageerror', (e) => errors.push(String(e)));
    await page.goto(url + '?look=flat');
    await page.waitForFunction(() => window.__game);
    await page.evaluate(() => { window.__game.create('WARRIOR', 'BRANNOCK'); document.getElementById('title').hidden = true; window.__title.open = false; });
    await page.waitForTimeout(300);
    await page.evaluate(() => window.__game.mode === 'wood' && window.__game.skipWood());
    await page.evaluate(() => window.__game.enterYard());
    await page.waitForTimeout(600);
    await page.evaluate(() => {
      const g = window.__game, r = g.room, h = g.hero, t = r.time;
      Object.assign(h, { x: 9, y: 9, relic: 'stamp', act: 'throw', actT: 0.25, actDur: 1 });
      r.enemies.forEach((e, i) => { e.cooldown = 99; e.attack = null; });
      const [a, b] = r.enemies;
      if (a) Object.assign(a, { x: 12.5, y: 7.5 });
      if (b) Object.assign(b, { x: 6, y: 11.5, tow: { x: 8, y: 10, until: t + 5 } });
      if (a) h.tether = { id: a.id, until: t + 5, next: t + 1 };
      r.zones.push({ x: 13, y: 11.5, r: 1.6, until: t + 5, next: t + 1, owner: h.id, el: 'fire', kind: 'fire' });
      r.zones.push({ x: 5.5, y: 7, r: 1.4, until: t + 5, next: t + 1, owner: h.id, el: '', kind: 'volley', at: t - 0.1 });
      g.step = () => [];
    });
    await page.waitForTimeout(300);
    await page.screenshot({ path: `${out}/${dev}-skills-flat.png` });
    await page.evaluate(() => window.__views.switch.set('3d'));
    await page.waitForFunction(() => window.__views.is3d, null, { timeout: 20000 });
    await page.waitForTimeout(1500);
    await page.screenshot({ path: `${out}/${dev}-skills-3d.png` });
    console.log(dev, errors.length ? 'ERRORS ' + JSON.stringify(errors) : 'ok');
    await ctx.close();
  }
  await browser.close();
})();
