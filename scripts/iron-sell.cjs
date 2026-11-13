// The UI chat's phone shots of prices on gold: Nettle's SELL QUIETLY tab, a piece's SELL card there, and a
// BUY card on his FOR SALE tab. node scripts/iron-sell.cjs [tag]
const { chromium } = require('playwright');
const tag = process.argv[2] || 'now';
(async () => {
  const browser = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true });
  const page = await ctx.newPage(); const errors = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  await page.goto(process.env.URL || 'http://localhost:4173/?hero=ROGUE');
  await page.waitForFunction(() => typeof window.__openSpot === 'function' && window.__game);
  await page.waitForTimeout(800);
  await page.evaluate(() => {
    const p = window.__game.profile;
    p.gold = 5000;
    p.bag = [{ slot: 'weapon', kit: 'daggers', quality: 'fine', traits: [], mods: [{ id: 'quick', v: 0.1 }] }, { slot: 'ring', quality: 'plain', traits: [] }];
    window.__game.hero.bag = [...p.bag];
  });
  await page.evaluate(() => window.__openSpot('vendor', 2));
  await page.waitForTimeout(600);
  await page.click('#panel [data-tab="fence"]');
  await page.waitForTimeout(500);
  await page.screenshot({ path: `shots/ui-${tag}-sell.png` });
  await page.click('#panel [data-src="bag:0"]');
  await page.waitForTimeout(500);
  await page.screenshot({ path: `shots/ui-${tag}-sell-card.png` });
  await page.evaluate(() => window.__openSpot('vendor', 2));
  await page.waitForTimeout(600);
  const g = await page.$('#panel [data-good]');
  if (g) { await g.click(); await page.waitForTimeout(500); await page.screenshot({ path: `shots/ui-${tag}-buy-card.png` }); }
  console.log('errors', JSON.stringify(errors)); await browser.close();
})();
