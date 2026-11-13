// The UI chat's phone shots of the pack (docs/design/ui-look.md): opens it, then the first piece's card.
// node scripts/iron-pack.cjs [tag]
const { chromium } = require('playwright');
const tag = process.argv[2] || 'now';
(async () => {
  const browser = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true });
  const page = await ctx.newPage(); const errors = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  await page.goto(process.env.URL || 'http://localhost:4173/?hero=WARRIOR');
  await page.waitForFunction(() => typeof window.__openSpot === 'function');
  await page.waitForTimeout(800);
  await page.evaluate(() => document.getElementById('packbtn').click());
  await page.waitForTimeout(800);
  await page.screenshot({ path: `shots/ui-${tag}-pack.png` });
  const t = await page.$('#pack .doll .tile[data-src]');
  if (t) { await t.click(); await page.waitForTimeout(500); await page.screenshot({ path: `shots/ui-${tag}-pack-card.png`, fullPage: false }); }
  console.log('errors', JSON.stringify(errors)); await browser.close();
})();
