// Relics, earned (docs/design/relics.md), on a phone: the full-screen moment a relic is won (Hempen's
// knuckle, the first in Wickhold), and the pack's carry slot in town, which says the reliquary chooses.
// Usage: node scripts/relics-earned-look.cjs [url] [outdir]
const { chromium } = require('playwright');
const url = process.argv[2] || 'http://localhost:4173/';
const out = process.argv[3] || 'shots';

(async () => {
  const browser = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  await page.goto(url + '?look=flat');
  await page.waitForFunction(() => window.__game);
  await page.evaluate(() => { window.__game.create('WARRIOR', 'BRANNOCK'); document.getElementById('title').hidden = true; window.__title.open = false; });
  await page.waitForTimeout(300);
  await page.evaluate(() => window.__game.mode === 'wood' && window.__game.skipWood());
  await page.evaluate(() => { const p = window.__game.profile; p.tally = false; p.relicTip = true; });
  await page.waitForTimeout(600);
  // Hempen falls: the knuckle comes home as the room gives it (sim/relicboss.ts), with where it came from.
  await page.evaluate(() => {
    const g = window.__game, h = g.hero, j = h.found[0];
    h.found = [...h.found, { id: 'rknuckle1', kind: 'knuckle', tier: 1, el: '', charge: 5, v: 2, from: 'hempen' }];
    if (!j) h.relics = [h.relics[0], 'knuckle'], (h.relicItem = 'rknuckle1');
    g.keepGear(h);
  });
  await page.waitForFunction(() => window.__relicPop.open, null, { timeout: 4000 }).catch((e) => console.log('pop', String(e).slice(0, 80)));
  await page.waitForTimeout(700);
  await page.screenshot({ path: `${out}/phone-relic-won.png` });
  console.log('moment', JSON.stringify(await page.evaluate(() => window.__relicPop.last)));
  // Closed; the pack in town, the carry slot chosen.
  await page.evaluate(() => { window.__relicPop.close(); window.__pack.toggle(true); });
  await page.waitForTimeout(300);
  await page.click('#pack [data-src="relic"]').catch((e) => console.log('pack click', String(e).slice(0, 80)));
  await page.waitForTimeout(300);
  await page.screenshot({ path: `${out}/phone-relic-carry.png` });
  console.log('errors', JSON.stringify(errors));
  await browser.close();
})();
