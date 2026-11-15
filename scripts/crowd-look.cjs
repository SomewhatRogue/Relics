// A lived-in world (docs/design/lived-in-world.md): the town's streets, flat and 2.5D, on a phone.
// node scripts/crowd-look.cjs <url> <out prefix> [x,y ...]   (hero placed at each spot in turn)
const { chromium } = require('playwright');
const url = process.argv[2] || 'http://localhost:4173/?hero=WARRIOR';
const out = process.argv[3] || 'shots/crowd';
const spots = (process.argv.slice(4).length ? process.argv.slice(4) : ['28,23', '33,9.5', '21,21', '16,36', '40,28', '6,20'])
  .map((s) => s.split(',').map(Number));
(async () => {
  const browser = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const errors = [];
  for (const look of ['pixel', '3d']) {
    const page = await (await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true })).newPage();
    page.on('pageerror', (e) => errors.push(String(e)));
    await page.goto(url + (url.includes('?') ? '&' : '?') + 'look=' + (look === '3d' ? '3d' : 'flat'));
    await page.waitForFunction(() => window.__game);
    await page.waitForTimeout(1200);
    // Skip a new hero's arrival scene (client/runner.ts), which holds the camera.
    // (The hero stands a few steps south of each spot, so what's there isn't hidden; the camera looks at the spot.)
    await page.addStyleTag({ content: '#caption { display: none !important; }' });
    await page.evaluate(() => { const p = window.__game.profile; if (p.errands) p.errands.told = true; });
    for (let i = 0; i < 6; i++) await page.evaluate(() => document.querySelector('#caption')?.click()), await page.waitForTimeout(400);
    for (const [x, y] of spots) {
      // Pinned there (the arrival scene would walk the hero off), and the camera given time to arrive.
      await page.evaluate(([x, y]) => { clearInterval(window.__pin); window.__pin = setInterval(() => Object.assign(window.__game.hero, { x, y: y + 2.6 }), 16); window.__game.cutFocus = () => ({ x, y, snap: true }); }, [x, y]);
      await page.waitForTimeout(2500);
      await page.screenshot({ path: `${out}-${look}-${x}_${y}.png` });
    }
  }
  console.log('errors', JSON.stringify(errors));
  await browser.close();
})();
