// Choosing a new hero round the fire (docs/design/hero-select.md): phone and laptop shots of the ring, an
// idle, a pick, another look, another hero, the fade on CHOOSE and the game under it. Errors printed.
// Run after `npm run build && npx vite preview --port 4173`. Shots go to shots/ring-*.png; a third
// argument (`3d`) opens it in the 2.5D view (?look=3d) and names the shots ring3d-*.
const { chromium } = require('playwright');
const url = process.argv[2] || 'http://localhost:4173/';
const only = process.argv[3] === 'all' ? '' : process.argv[3], d3 = process.argv[4] === '3d', tag = d3 ? 'ring3d' : 'ring';
(async () => {
  const browser = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const sizes = [['phone', { viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true }], ['laptop', { viewport: { width: 1280, height: 800 }, deviceScaleFactor: 2 }]];
  for (const [name, opts] of sizes) {
    if (only && only !== name) continue;
    const ctx = await browser.newContext(opts);
    const page = await ctx.newPage();
    const errors = [];
    page.on('pageerror', (e) => errors.push(String(e)));
    page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
    const shot = (s) => page.screenshot({ path: `shots/${tag}-${name}-${s}.png` });
    await page.goto(d3 ? url + (url.includes('?') ? '&' : '?') + 'look=3d' : url);
    await page.waitForSelector('#title .hring', { timeout: 20000 });
    await page.waitForTimeout(1500);
    await shot('1-ring');
    await page.waitForTimeout(6000);
    await shot('2-idle');
    await page.click('[data-cls="MAGE"]');
    await page.waitForTimeout(1200);
    await shot('3-mage');
    await page.click('[data-look="2"]');
    await page.waitForTimeout(500);
    await shot('4-look');
    await page.click('[data-cls="WARRIOR"]');
    await page.waitForTimeout(1200);
    await shot('5-warrior');
    await page.click('[data-begin]');
    await page.waitForTimeout(450);
    await shot('6-leaving');
    await page.waitForTimeout(3000);
    await shot('7-game');
    console.log(name, 'title open', await page.evaluate(() => !document.getElementById('title').hidden), 'mode', await page.evaluate(() => window.__game?.mode));
    console.log(name, 'errors', JSON.stringify(errors));
    await ctx.close();
  }
  await browser.close();
})();
