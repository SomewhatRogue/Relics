// Opens the game at phone and laptop sizes, plays a few seconds, screenshots each, prints state and errors.
const { chromium } = require('playwright');
const url = process.argv[2] || 'http://localhost:4173/?hero=WARRIOR';
(async () => {
  const browser = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  for (const [name, opts] of [['phone', { viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true }], ['laptop', { viewport: { width: 1280, height: 800 }, deviceScaleFactor: 2 }]]) {
    const ctx = await browser.newContext(opts);
    const page = await ctx.newPage();
    const errors = [];
    page.on('pageerror', (e) => errors.push(String(e)));
    page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
    await page.goto(url);
    await page.waitForFunction(() => typeof window.render_game_to_text === 'function');
    await page.screenshot({ path: `shots/${name}-town.png` });
    // The fight lives in the Training Yard now (the game starts in town).
    await page.evaluate(() => window.__game.enterYard());
    // Walk the hero up toward the butcher and swing.
    await page.evaluate(() => { const r = window.__room; r.heroes[0].y = 7.8; r.heroes[0].x = 9.3; });
    await page.waitForTimeout(1200);
    await page.screenshot({ path: `shots/${name}-1.png` });
    await page.waitForFunction(() => window.__room.enemies[0].attack && window.__room.enemies[0].attack.t > 0.5, null, { timeout: 15000 }).catch(() => {});
    await page.screenshot({ path: `shots/${name}-telegraph.png` });
    console.log(name, await page.evaluate(() => window.render_game_to_text()));
    console.log(name, 'errors', JSON.stringify(errors));
    await ctx.close();
  }
  await browser.close();
})();
