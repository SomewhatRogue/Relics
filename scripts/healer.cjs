// The Healer's blessed ground and ward, in the yard, phone and laptop.
const { chromium } = require('playwright');
const url = process.argv[2] || 'http://localhost:4173/?hero=HEALER';
(async () => {
  const browser = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const errors = [];
  for (const [tag, opts] of [['phone', { viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true }], ['laptop', { viewport: { width: 1280, height: 800 }, deviceScaleFactor: 2 }]]) {
    const page = await (await browser.newContext(opts)).newPage();
    page.on('pageerror', (e) => errors.push(String(e)));
    await page.goto(url);
    await page.waitForFunction(() => window.__game);
    await page.evaluate(() => {
      const g = window.__game;
      g.enterYard();
      const r = g.room, h = g.hero, q = r.heroes.find((x) => x.id === 'squire');
      Object.assign(h, { x: q.x - 1, y: q.y });
      q.hp = 50;
      r.zones.push({ x: h.x, y: h.y, r: 2.4, until: r.time + 6, next: r.time, owner: 'me', el: '' });
      Object.assign(h, { wardUntil: r.time + 5, wardHp: 50 });
    });
    await page.waitForTimeout(900);
    await page.screenshot({ path: `shots/healer-${tag}.png` });
    await page.context().close();
  }
  console.log('errors', JSON.stringify(errors));
  await browser.close();
})();
