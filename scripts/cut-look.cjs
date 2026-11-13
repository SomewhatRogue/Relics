// The Deep skills on a phone (docs/design/deep-skills.md): a Rogue taught the long cut in the Training Yard.
// `node scripts/cut-look.cjs [button|cut] [url]` after `npm run build && npx vite preview --port 4173`.
// button: the cluster with the new button. cut: a row of goblins, the stance's line, the slash, the cut landing.
const { chromium } = require('playwright');
const what = process.argv[2] || 'button';
const url = process.argv[3] || 'http://localhost:4173/?hero=ROGUE&deepbest=20&deepskill=1';
(async () => {
  const browser = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  await page.goto(url);
  await page.waitForFunction(() => typeof window.render_game_to_text === 'function');
  await page.evaluate(() => window.__game.enterYard());
  await page.waitForTimeout(800);
  if (what === 'button') {
    await page.screenshot({ path: 'shots/cut-button.png' });
  } else {
    // A row of goblins up the yard, held where they stand, the Rogue below them facing up the line.
    await page.evaluate(() => {
      const r = window.__room, h = r.heroes[0];
      Object.assign(h, { x: 9, y: 11, fx: 0, fy: -1 });
      const proto = r.enemies.find((e) => e.kind === 'scrapper') || r.enemies[0];
      r.enemies = [0, 1, 2, 3].map((i) => ({ ...JSON.parse(JSON.stringify(proto)), id: 900 + i, x: 9 + (i % 2 ? 0.3 : -0.3), y: 9 - i * 1.6, hp: 120, maxHp: 120, cooldown: 99, alert: true, boss: false }));
    });
    await page.waitForTimeout(200);
    await page.locator('.tb.deep').dispatchEvent('touchstart');
    await page.locator('.tb.deep').dispatchEvent('touchend');
    // Each shot when the room's clock says so (the page's own timers drift from it).
    const t0 = await page.evaluate(() => window.__room.time);
    const at = async (s, name) => { await page.waitForFunction((t) => window.__room.time >= t, t0 + s, { polling: 16 }); await page.screenshot({ path: `shots/cut-${name}.png` }); };
    await at(0.3, 'stance');
    await at(0.95, 'sheathe');
    await at(1.47, 'fall');
    console.log(await page.evaluate(() => JSON.stringify(window.__room.enemies.map((e) => [e.id, e.hp, e.act]))));
  }
  console.log('errors', JSON.stringify(errors));
  await ctx.close();
  await browser.close();
})();
