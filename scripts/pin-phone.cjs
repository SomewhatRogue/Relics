// Phone: tap RELIC with a scrapper up the room; the javelin should auto-aim and pin it to the back wall.
const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const page = await (await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true })).newPage();
  await page.goto(process.argv[2] || 'http://localhost:4173/');
  await page.waitForFunction(() => window.__room);
  await page.evaluate(() => { const r = window.__room; Object.assign(r.enemies[0], { x: 15, y: 13, cooldown: 99 }); r.enemies.filter((e) => e.kind === 'scrapper').forEach((s, i) => Object.assign(s, { x: 7 + i * 4, y: 5, cooldown: 99 })); Object.assign(r.heroes[0], { x: 7, y: 10 }); });
  await page.tap('.tb.relic');
  await page.waitForTimeout(900);
  await page.screenshot({ path: 'shots/pin-phone.png' });
  console.log(await page.evaluate(() => window.render_game_to_text()));
  await browser.close();
})();
