// The UI chat's phone shots (docs/design/ui-look.md): opens town spots on a phone (390x844 at 3x, touch)
// and screenshots each panel, plus the first card where the panel has one. Prints page errors.
// node scripts/iron-look.cjs [tag] [spot ...]   e.g. node scripts/ui-look.cjs after board map
const { chromium } = require('playwright');
const [tag = 'now', ...asked] = process.argv.slice(2);
const spots = asked.length ? asked : ['board'];
const base = process.env.URL || 'http://localhost:4173/?hero=WARRIOR';
(async () => {
  const browser = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  await page.goto(base);
  await page.waitForFunction(() => typeof window.__openSpot === 'function');
  await page.waitForTimeout(800);
  for (const spot of spots) {
    const [id, arg] = spot.split(':');
    await page.evaluate(([i, a]) => window.__openSpot(i, Number(a) || 0), [id, arg]);
    await page.waitForTimeout(900);
    // Finish any typed-in words so the shot shows the whole panel.
    await page.evaluate(() => document.querySelector('#panel .body')?.click());
    await page.waitForTimeout(300);
    await page.screenshot({ path: `shots/ui-${tag}-${id}.png` });
    const card = await page.$('#panel [data-open]');
    if (card) {
      await card.click();
      await page.waitForTimeout(500);
      await page.screenshot({ path: `shots/ui-${tag}-${id}-card.png` });
    }
    await page.evaluate(() => window.__panel?.hide?.() ?? document.querySelector('#panel .buttons button:last-child')?.click());
    await page.waitForTimeout(300);
  }
  console.log('errors', JSON.stringify(errors));
  await browser.close();
})();
