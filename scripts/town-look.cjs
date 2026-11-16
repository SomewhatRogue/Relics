// The new town (docs/design/town-layout.md): walk the hero along each of the chase camera's views and shoot.
// node scripts/town-look.cjs [url] [out prefix] [day 0..1]   (LAPTOP=1 for a 1440x900 laptop, else a phone)
// VIEWS=1,3 to shoot only some.
const { chromium } = require('playwright');
const [url = 'http://localhost:4173/?hero=WARRIOR', out = 'shots/town', day = '0.9'] = process.argv.slice(2);
// From, to (tiles): the hero walks from one toward the other and the shot is taken near its end.
const VIEWS = {
  1: [[29.5, 37.5], [29.5, 30]], 2: [[29.5, 19.5], [29.5, 11]], 3: [[29.5, 31], [29.5, 37]], 4: [[22.5, 22], [12, 22]],
  5: [[43, 22], [53, 22]], 6: [[46.75, 3], [46.75, 19]], 7: [[42.5, 44], [53, 44]], 8: [[10.75, 24], [10.75, 34]],
  9: [[20, 37.6], [45, 37.6]], 0: [[29.5, 33], [29.5, 26]], p: [[22, 57.4], [22, 55.6]], r: [[17.75, 57.4], [17.75, 56]], b: [[25.6, 22.2], [25.6, 20.7]], s: [[33, 31], [33, 28.6]], w: [[27, 57.4], [27, 54.6]],
};
const only = process.env.VIEWS ? process.env.VIEWS.split(',') : Object.keys(VIEWS);
(async () => {
  const browser = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const errors = [];
  const ctx = process.env.LAPTOP ? { viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 } : { viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true };
  const page = await (await browser.newContext(ctx)).newPage();
  page.on('pageerror', (e) => errors.push(String(e)));
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text().slice(0, 300)));
  await page.goto(`${url}${url.includes('?') ? '&' : '?'}look=3d&hd&street&day=${day}`);
  await page.waitForFunction(() => window.__game);
  await page.waitForTimeout(1500);
  await page.addStyleTag({ content: '#caption { display: none !important; }' });
  await page.evaluate(() => { const p = window.__game.profile; if (p.errands) p.errands.told = true; });
  for (let i = 0; i < 6; i++) await page.evaluate(() => document.querySelector('#caption')?.click()), await page.waitForTimeout(300);
  for (const k of only) {
    const [a, b] = VIEWS[k];
    // Walked there over a few seconds, so the chase camera turns the way they go.
    await page.evaluate(([a, b]) => {
      clearInterval(window.__pin);
      const t0 = performance.now(), h = window.__game.hero;
      // (The camera on the hero, not on a new hero's arrival scene.)
      window.__game.cutFocus = () => ({ x: h.x, y: h.y - 0.4 });
      Object.assign(h, { x: a[0], y: a[1] });
      window.__pin = setInterval(() => {
        const k = Math.min(1, (performance.now() - t0) / 3500);
        const x = a[0] + (b[0] - a[0]) * k, y = a[1] + (b[1] - a[1]) * k;
        // (Teleported, so stood on the level under them: shared/arena.ts levelAt.)
        const z = (window.__game.room.map.ledges ?? []).reduce((v, l) => (x > l.x && x < l.x + l.w && y > l.y && y < l.y + l.h ? Math.max(v, l.lv ?? 1) : v), 0);
        Object.assign(h, { x, y, z, fx: Math.sign(b[0] - a[0]), fy: Math.sign(b[1] - a[1]) });
      }, 16);
    }, [a, b]);
    await page.waitForTimeout(4200);
    const z = await page.evaluate(() => window.__game.hero.z);
    await page.screenshot({ path: `${out}-${k}.png` });
    console.log('view', k, 'hero z', z);
  }
  console.log('errors', JSON.stringify(errors));
  await browser.close();
})();
