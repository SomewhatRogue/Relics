// The UI chat's phone shots of the trainer's four tabs, for a level 3 Warrior with 300 gold and a knack waiting.
// node scripts/iron-trainer.cjs [tag]
const { chromium } = require('playwright');
const tag = process.argv[2] || 'now';
(async () => {
  const browser = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true });
  const page = await ctx.newPage(); const errors = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  await page.goto(process.env.URL || 'http://localhost:4173/?hero=WARRIOR');
  await page.waitForFunction(() => typeof window.__openSpot === 'function' && window.__game);
  await page.waitForTimeout(800);
  await page.evaluate(() => Object.assign(window.__game.profile, { level: 3, gold: 30000, picks: 1, perks: [] }));
  await page.evaluate(() => window.__openSpot('trainer', 0));
  await page.waitForTimeout(700);
  for (const t of ['skills', 'moves', 'ranks', 'knacks']) {
    const b = await page.$(`#panel .up-tabs [data-tab="${t}"]`);
    if (b) { await b.click(); await page.waitForTimeout(400); }
    await page.screenshot({ path: `shots/ui-${tag}-trainer-${t}.png` });
  }
  console.log('errors', JSON.stringify(errors)); await browser.close();
})();
