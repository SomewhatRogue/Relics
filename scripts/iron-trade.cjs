// The UI chat's phone shots of prices when buying and selling: Tobin's BUY and SELL tabs, Nettle's SELL
// QUIETLY, and a BUY card you can't afford. node scripts/iron-trade.cjs [tag]
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
  const setup = (gold) => page.evaluate((gold) => {
    const g = window.__game, p = g.profile;
    p.gold = gold;
    p.bag = [
      { slot: 'weapon', kit: 'daggers', quality: 'fine', traits: [], mods: [{ id: 'quick', v: 0.1 }], level: 2 },
      { slot: 'weapon', kit: 'rapier', quality: 'forged', traits: [], mods: [{ id: 'reach', v: 0.1 }, { id: 'crit', v: 0.05 }], level: 4 },
      { slot: 'ring', quality: 'tolmouth', traits: [], mods: [{ id: 'health', v: 20 }] },
      { slot: 'armor', armor: 'medium', quality: 'touched', traits: [], mods: [{ id: 'tough', v: 0.1 }] },
      { slot: 'ring', quality: 'plain', traits: [] },
    ];
    for (const x of [g.hero, ...g.room.heroes]) x.bag = [...p.bag];
  }, gold);
  await setup(155);
  await page.evaluate(() => window.__openSpot('merchant', 0));
  await page.waitForTimeout(600);
  await page.evaluate(() => document.querySelector('#panel .body')?.click());
  await page.screenshot({ path: `shots/ui-${tag}-tobin-buy.png` });
  const sell = await page.$('#panel [data-ptab="sell"]');
  if (sell) { await sell.click(); await page.waitForTimeout(500); }
  await page.screenshot({ path: `shots/ui-${tag}-tobin-sell.png` });
  await page.evaluate(() => window.__openSpot('vendor', 2));
  await page.waitForTimeout(600);
  await page.click('#panel [data-tab="fence"]');
  await page.waitForTimeout(500);
  await page.screenshot({ path: `shots/ui-${tag}-nettle-sell.png` });
  await setup(3);
  await page.evaluate(() => window.__openSpot('vendor', 2));
  await page.waitForTimeout(600);
  const good = await page.$('#panel [data-good]');
  if (good) { await good.click(); await page.waitForTimeout(500); }
  await page.screenshot({ path: `shots/ui-${tag}-poor-buy.png` });
  console.log('errors', JSON.stringify(errors)); await browser.close();
})();
