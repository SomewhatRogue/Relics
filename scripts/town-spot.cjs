// Stand the hero at a spot in town (default view, phone) and shoot: node scripts/town-spot.cjs x,y[,name] ... [--q=&look=3d]
const { chromium } = require('playwright');
const args = process.argv.slice(2), q = (args.find((a) => a.startsWith('--q=')) ?? '--q=').slice(4);
(async () => {
  const browser = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const page = await (await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true })).newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  await page.goto('http://localhost:4173/?hero=WARRIOR' + q);
  await page.waitForFunction(() => window.__game && window.__game.room && window.__game.room.map.name === 'WICKHOLD', null, { timeout: 30000 }).catch(() => {});
  await page.waitForTimeout(1500);
  for (const a of args.filter((a) => !a.startsWith('--'))) {
    const [x, y, name = a] = a.split(',');
    await page.evaluate(([x, y]) => {
      const g = window.__game, h = g.hero;
      clearInterval(window.__pin);
      g.cutFocus = () => ({ x: h.x, y: h.y });
      window.__pin = setInterval(() => Object.assign(h, { x, y, z: (g.room.map.ledges ?? []).reduce((v, l) => (x > l.x && x < l.x + l.w && y > l.y && y < l.y + l.h ? Math.max(v, l.lv ?? 1) : v), 0) }), 30);
    }, [+x, +y]);
    await page.waitForTimeout(1800);
    await page.screenshot({ path: `shots/spot-${name}.png` });
  }
  console.log('errors', JSON.stringify(errors));
  await browser.close();
})();
