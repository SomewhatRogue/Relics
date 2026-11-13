// The UI chat's whole-phone shots of a fight, for the HUD declutter: the great barn (a boss) and a village job.
// node scripts/iron-fight.cjs [tag]
const { chromium } = require('playwright');
const tag = process.argv[2] || 'now';
const base = process.env.URL || 'http://localhost:4173/';
(async () => {
  const browser = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true });
  const page = await ctx.newPage(); const errors = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  await page.goto(base + '?hero=WARRIOR&barn=arena');
  await page.waitForFunction(() => window.__game && window.__game.room && window.__game.room.map.name === 'THE GREAT BARN', null, { timeout: 20000 });
  await page.evaluate(() => Object.assign(window.__game.hero, { x: 6, y: 9.4, fy: -1 }));
  await page.waitForTimeout(1800);
  await page.screenshot({ path: `shots/ui-${tag}-fight-barn.png` });
  await page.goto(base + '?hero=WARRIOR');
  await page.waitForFunction(() => typeof window.__villageJob === 'function' && window.__game);
  await page.waitForTimeout(600);
  const job = await page.evaluateHandle(() => window.__villageJob(7));
  await page.evaluate((j) => window.__game.startJob(j), job);
  await page.waitForFunction(() => window.__game.mode === 'run', null, { timeout: 15000 });
  await page.waitForTimeout(2500);
  await page.screenshot({ path: `shots/ui-${tag}-fight-job.png` });
  // (The tracker folds to its line a few seconds after it last changed.)
  await page.waitForFunction(() => document.getElementById('banner').classList.contains('small'), null, { timeout: 20000 }).catch(() => errors.push('never folded'));
  await page.screenshot({ path: `shots/ui-${tag}-fight-job-folded.png` });
  console.log('errors', JSON.stringify(errors)); await browser.close();
})();
