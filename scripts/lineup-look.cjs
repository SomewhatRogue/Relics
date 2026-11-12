// One screenshot of the art pass's lineup (src/client/lineup.ts) on a phone, for checking a slice.
// Usage: node scripts/lineup-look.cjs [url] [out.png] [heroes|goblins|all]
const { chromium } = require('playwright');
const [url = 'http://localhost:4173/', out = 'shots/lineup.png', which = 'all'] = process.argv.slice(2);

(async () => {
  const browser = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  page.on('console', (m) => (m.type() === 'error' || m.type() === 'warning') && /lineup/.test(m.text()) && errors.push(m.text()));
  await page.goto(url + (url.includes('?') ? '&' : '?') + 'lineup=' + which);
  await page.waitForSelector('#lineup canvas');
  await page.waitForTimeout(5300);
  // The whole page, not just the phone's first screen: the lineup scrolls.
  const size = await page.evaluate(() => { const c = document.querySelector('#lineup canvas'); return { w: c.offsetWidth, h: c.offsetHeight }; });
  await page.setViewportSize({ width: Math.max(390, size.w), height: Math.min(4000, size.h) });
  await page.waitForTimeout(300);
  await page.locator('#lineup canvas').screenshot({ path: out, scale: 'css' });
  console.log(JSON.stringify({ size, errors: errors.slice(0, 12) }));
  await browser.close();
})();
