// The gear-looks page (src/client/gearlookpage.ts) on a phone: the held and floor canvas, then the bag's pictures.
// Usage: node scripts/gear-look.cjs [url] [out-prefix] [page]  (page: '' for weapons, 'armour' for armour)
const { chromium } = require('playwright');
const [url = 'http://localhost:4173/', out = 'shots/gear', which = ''] = process.argv.slice(2);

(async () => {
  const browser = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  await page.goto(url + (url.includes('?') ? '&' : '?') + 'gearlook' + (which ? '=' + which : ''));
  await page.waitForSelector('#gearlook canvas');
  await page.waitForTimeout(4000);
  const size = await page.evaluate(() => { const c = document.querySelector('#gearlook canvas'); return { w: c.offsetWidth, h: c.offsetHeight }; });
  await page.setViewportSize({ width: Math.max(390, size.w), height: Math.min(4000, size.h + 900) });
  await page.waitForTimeout(400);
  await page.locator('#gearlook canvas').screenshot({ path: out + '-held.png', scale: 'css' });
  await page.locator('#gearbag').screenshot({ path: out + '-bag.png', scale: 'css' });
  console.log(JSON.stringify({ size, errors: errors.slice(0, 12) }));
  await browser.close();
})();
