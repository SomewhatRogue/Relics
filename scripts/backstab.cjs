// Daggers: stand behind the butcher and stab; the rear arc should light up and BACKSTAB should show.
const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const page = await (await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true })).newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  await page.goto(process.argv[2] || 'http://localhost:4173/');
  await page.waitForFunction(() => window.__room);
  await page.evaluate(() => { const r = window.__room; for (const e of r.enemies) if (e.kind === 'scrapper') Object.assign(e, { x: 2, y: 14, cooldown: 99 }); Object.assign(r.enemies[0], { x: 9, y: 6, fx: 0, fy: 1, cooldown: 99 }); Object.assign(r.heroes[0], { x: 9, y: 4.6, weapon: 'daggers' }); });
  await page.waitForTimeout(150);
  await page.tap('.tb.attack');
  await page.waitForTimeout(120);
  await page.screenshot({ path: 'shots/backstab.png' });
  console.log(await page.evaluate(() => window.render_game_to_text()));
  console.log('errors', JSON.stringify(errors));
  await browser.close();
})();
