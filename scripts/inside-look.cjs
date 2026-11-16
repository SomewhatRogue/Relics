// The town's insides in the new look (docs/design/new-look-interiors.md): go in each door and shoot.
// node scripts/inside-look.cjs [url] [out prefix] [day 0..1]   (LAPTOP=1 for a 1440x900 laptop, else a phone)
// DOORS=church,hall to shoot only some; UP=1 to stand halfway up each room, to see its back wall.
const { chromium } = require('playwright');
const [url = 'http://localhost:4173/?hero=WARRIOR', out = 'shots/inside', day = '0.9'] = process.argv.slice(2);
const ALL = ['church', 'hall', 'townhall', 'tavern', 'forge', 'infirmary'];
const only = process.env.DOORS ? process.env.DOORS.split(',') : ALL;
(async () => {
  const browser = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const errors = [];
  const ctx = process.env.LAPTOP ? { viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 } : { viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true };
  const page = await (await browser.newContext(ctx)).newPage();
  page.on('pageerror', (e) => errors.push(String(e)));
  await page.goto(`${url}${url.includes('?') ? '&' : '?'}look=3d&hd&street&day=${day}`);
  await page.waitForFunction(() => window.__game);
  await page.waitForTimeout(1500);
  await page.addStyleTag({ content: '#caption { display: none !important; }' });
  await page.evaluate(() => { const p = window.__game.profile; if (p.errands) p.errands.told = true; });
  for (let i = 0; i < 6; i++) await page.evaluate(() => document.querySelector('#caption')?.click()), await page.waitForTimeout(300);
  for (const d of only) {
    await page.evaluate(([d, up]) => {
      const g = window.__game;
      if (g.outside) g.leave();
      const b = g.room.map.blocks.find((x) => x.door === d);
      g.enter(b);
      const h = g.hero;
      // UP=1: stood halfway up the room, to see the back wall.
      if (up) Object.assign(h, { x: g.room.map.w / 2 + 0.6, y: Math.min(g.room.map.h - 2, 6.5) });
      g.cutFocus = () => ({ x: h.x, y: h.y - 0.4 });
    }, [d, !!process.env.UP]);
    await page.waitForTimeout(2500);
    const name = await page.evaluate(() => window.__game.room.map.name + ' ' + window.__game.room.map.w + 'x' + window.__game.room.map.h);
    await page.screenshot({ path: `${out}-${d}.png` });
    console.log(d, name);
  }
  console.log('errors', JSON.stringify(errors));
  await browser.close();
})();
