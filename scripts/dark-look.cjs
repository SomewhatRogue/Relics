// Dark and gold (docs/design/dark-gold.md): one spot in the flat and 2.5D views on a phone, the hour held.
// node scripts/dark-look.cjs <url> <out prefix> <day 0..1> x,y [x,y ...]
// The url carries the rest (?hero=, ?job=...). The hero stands a few steps south of each spot, the camera on it.
const { chromium } = require('playwright');
const [url = 'http://localhost:4173/?hero=WARRIOR', out = 'shots/dark', day = '0.9', ...rest] = process.argv.slice(2);
// `me` shoots wherever the hero starts (a job's map), the hero not moved; `deep:6` goes down to the Deep's floor 6 first.
const spots = (rest.length ? rest : ['28,23']).map((s) => (s === 'me' || s.startsWith('deep:') ? s : s.split(',').map(Number)));
(async () => {
  const browser = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const errors = [];
  for (const look of ['flat', '3d']) {
    const page = await (await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true })).newPage();
    page.on('pageerror', (e) => errors.push(String(e)));
    await page.goto(`${url}${url.includes('?') ? '&' : '?'}look=${look}&day=${day}`);
    await page.waitForFunction(() => window.__game);
    await page.waitForTimeout(1200);
    await page.addStyleTag({ content: '#caption { display: none !important; }' });
    await page.evaluate(() => { const p = window.__game.profile; if (p.errands) p.errands.told = true; });
    for (let i = 0; i < 6; i++) await page.evaluate(() => document.querySelector('#caption')?.click()), await page.waitForTimeout(300);
    for (const spot of spots) {
      if (typeof spot === 'string') {
        if (spot.startsWith('deep:')) await page.evaluate((n) => { const g = window.__game; if (g.mode === 'town') g.enterDeep(); g.profile.deep.floor = n - 1; g.descend(); }, +spot.slice(5));
        await page.waitForTimeout(2200);
        await page.screenshot({ path: `${out}-${look}-${spot.replace(':', '')}.png` });
        continue;
      }
      const [x, y] = spot;
      await page.evaluate(([x, y]) => { clearInterval(window.__pin); window.__pin = setInterval(() => Object.assign(window.__game.hero, { x, y: y + 2.6 }), 16); window.__game.cutFocus = () => ({ x, y, snap: true }); }, [x, y]);
      await page.waitForTimeout(2200);
      await page.screenshot({ path: `${out}-${look}-${x}_${y}.png` });
    }
  }
  console.log('errors', JSON.stringify(errors));
  await browser.close();
})();
