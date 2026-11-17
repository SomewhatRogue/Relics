// Light, air and the wider camera (docs/design/lived-in-world.md slices 4 and 5): Wickhold in 2.5D on a phone,
// the vignette and lamp haze on and off (?air=0), the camera CLOSE and WIDE (?cam=).
// node scripts/air-look.cjs <url> <out prefix> [x,y]   (the hero placed a few steps south of the spot; - leaves them be)
const { chromium } = require('playwright');
const url = process.argv[2] || 'http://localhost:4173/?hero=WARRIOR&day=0';
const out = process.argv[3] || 'shots/air';
const spot = process.argv[4] || '28,23', [x, y] = spot === '-' ? [0, 0] : spot.split(',').map(Number);
(async () => {
  const browser = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const errors = [];
  for (const [tag, q] of [['air', 'cam=close'], ['bare', 'cam=close&air=0'], ['wide', 'cam=wide'], ['flatwide', 'cam=wide&look=flat']]) {
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
    const page = await ctx.newPage();
    page.on('pageerror', (e) => errors.push(String(e)));
    await page.goto(url + (url.includes('?') ? '&' : '?') + (q.includes('look=') ? q : 'look=3d&' + q));
    await page.waitForFunction(() => window.__game);
    await page.waitForTimeout(1200);
    await page.addStyleTag({ content: '#caption { display: none !important; }' });
    await page.evaluate(() => { const p = window.__game.profile; if (p.errands) p.errands.told = true; });
    for (let i = 0; i < 6; i++) await page.evaluate(() => document.querySelector('#caption')?.click()), await page.waitForTimeout(400);
    if (spot !== '-') await page.evaluate(([x, y]) => { window.__pin = setInterval(() => Object.assign(window.__game.hero, { x, y: y + 2.6 }), 16); window.__game.cutFocus = () => ({ x, y, snap: true }); }, [x, y]);
    await page.waitForTimeout(2500);
    await page.screenshot({ path: `${out}-${tag}.png` });
    await ctx.close();
  }
  console.log('errors', JSON.stringify(errors));
  await browser.close();
})();
