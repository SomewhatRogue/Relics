// Cobb at the Deep's ladder in town, on a phone, at night and by day: the crate, the lamp, the slate.
// Usage: node scripts/cobb-look.cjs [url] [outdir]
const { chromium } = require('playwright');
const url = process.argv[2] || 'http://localhost:4173/';
const out = process.argv[3] || 'shots';
(async () => {
  const browser = await chromium.launch();
  const page = await (await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true })).newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  await page.goto(`${url}?hero=WARRIOR`);
  await page.waitForFunction(() => window.__game && window.__game.mode === 'town', null, { timeout: 20000 });
  await page.evaluate(() => {
    const g = window.__game;
    g.world.dens = 99;
    g.enterTown({ x: 24.2, y: 37.6 });
  });
  await page.waitForTimeout(1200);
  const cobb = await page.evaluate(() => !!window.__game.room.map.npcs?.some((n) => n.name === 'COBB'));
  console.log('Cobb in town:', cobb);
  await page.screenshot({ path: `${out}/cobb.png` });
  console.log('errors:', errors.length ? errors.slice(0, 3) : 'none');
  await browser.close();
})();
