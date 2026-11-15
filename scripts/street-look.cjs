// The new look's town (docs/design/new-look.md, `?look=3d&hd&street`): shots of spots in Wickhold with the swing held.
// node scripts/street-look.cjs <out prefix> <day 0..1> x,y[,yawDeg] [x,y,yaw ...]
// LAPTOP=1 for a 1440x900 laptop at 2x (else an upright phone). BASE= the server (default localhost:4173).
// The hero is pinned a few steps south of each spot (in the swing's frame), so the camera looks at it from behind.
const { chromium } = require('playwright');
const [out = 'shots/street', day = '0.9', ...rest] = process.argv.slice(2);
const spots = (rest.length ? rest : ['28,23,0']).map((s) => s.split(',').map(Number));
const base = process.env.BASE || 'http://localhost:4173';
(async () => {
  const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const errors = [];
  const ctx = process.env.LAPTOP ? { viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 } : { viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true };
  const page = await (await browser.newContext(ctx)).newPage();
  page.on('pageerror', (e) => errors.push(String(e)));
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  await page.goto(`${base}/?hero=WARRIOR&look=3d&hd&street&day=${day}`);
  await page.waitForFunction(() => window.__game);
  await page.waitForTimeout(1200);
  await page.addStyleTag({ content: '#caption { display: none !important; }' });
  await page.evaluate(() => { const p = window.__game.profile; if (p.errands) p.errands.told = true; });
  // HOMES=1: everyone rescued, so all eight homes stand in the south-east (shared/town.ts HOUSES).
  if (process.env.HOMES) await page.evaluate(() => { const g = window.__game; g.world.rescued = 16; g.rebuildTown(); });
  for (let i = 0; i < 6; i++) await page.evaluate(() => document.querySelector('#caption')?.click()), await page.waitForTimeout(300);
  for (const [x, y, yaw = 0] of spots) {
    await page.evaluate(([x, y, yaw]) => {
      const a = (yaw * Math.PI) / 180, back = 2.6;
      clearInterval(window.__pin);
      window.__pin = setInterval(() => { window.__swing.yaw = a; Object.assign(window.__game.hero, { x: x - Math.sin(a) * back, y: y + Math.cos(a) * back }); }, 16);
    }, [x, y, yaw]);
    await page.waitForTimeout(2500);
    await page.screenshot({ path: `${out}-${x}_${y}_${yaw}.png` });
  }
  console.log('errors', JSON.stringify(errors.slice(0, 5)));
  await browser.close();
})();
