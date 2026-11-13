const { chromium } = require('playwright');
const tag = process.argv[2] || 'x';
(async () => {
  const browser = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true });
  const page = await ctx.newPage(); const errors = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  await page.goto('http://localhost:4173/?hero=WARRIOR');
  await page.waitForFunction(() => typeof window.__openSpot === 'function');
  await page.waitForTimeout(800);
  await page.evaluate(() => document.getElementById('heroes').click());
  await page.waitForTimeout(900);
  await page.screenshot({ path: `shots/ui-${tag}-home.png` });
  const m = await page.$('#title [data-more]'); if (m) { await m.click(); await page.waitForTimeout(400); await page.screenshot({ path: `shots/ui-${tag}-home-more.png` }); }
  console.log('errors', JSON.stringify(errors)); await browser.close();
})();
