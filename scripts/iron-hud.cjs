// The UI chat's phone shots of the HUD (docs/design/ui-look.md): the unit frame and the boss plate in the
// great barn (the Doorkeepers, a pair plate), the hero hurt so the trail shows. node scripts/iron-hud.cjs [tag]
const { chromium } = require('playwright');
const tag = process.argv[2] || 'now';
(async () => {
  const browser = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true });
  const page = await ctx.newPage(); const errors = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  await page.goto((process.env.URL || 'http://localhost:4173/') + '?hero=WARRIOR&barn=arena');
  await page.waitForFunction(() => window.__game && window.__game.room && window.__game.room.map.name === 'THE GREAT BARN', null, { timeout: 20000 });
  await page.evaluate(() => Object.assign(window.__game.hero, { x: 6, y: 9.4, fy: -1 }));
  await page.waitForTimeout(1600);
  await page.evaluate(() => { const h = window.__game.hero; h.hp = Math.round(h.maxHp * 0.55); h.stamina = 40; });
  await page.waitForTimeout(300);
  await page.screenshot({ path: `shots/ui-${tag}-hud.png`, clip: { x: 0, y: 0, width: 390, height: 260 } });
  console.log('plate', await page.evaluate(() => !document.getElementById('boss').hidden), 'errors', JSON.stringify(errors));
  await browser.close();
})();
