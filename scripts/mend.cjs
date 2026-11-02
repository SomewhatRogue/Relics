// Wickhold mending: the town broken (as it starts), then with every work done, by day and at dusk.
// node scripts/mend.cjs [url] [outdir] [phase]   (phase: 0.5 noon, 0.8 dusk, 0 midnight)
const { chromium } = require('playwright');
const url = process.argv[2] || 'http://localhost:4173/?hero=WARRIOR';
const out = process.argv[3] || 'shots';
const phase = Number(process.argv[4] ?? 0.5);
const SPOTS = [['square', 28, 19], ['west', 15, 22], ['north', 28, 4], ['lane', 30, 28], ['church', 8, 11], ['east', 46, 22]];
(async () => {
  const browser = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const errors = [];
  for (const [tag, opts] of [['phone', { viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true }], ['laptop', { viewport: { width: 1280, height: 800 }, deviceScaleFactor: 2 }]]) {
    const ctx = await browser.newContext(opts);
    // The shared clock, pinned to one hour of Wickhold's day.
    await ctx.addInitScript((ph) => { const t0 = performance.now(), base = 40 * 60000 * 700000 + ph * 40 * 60000; Date.now = () => base + (performance.now() - t0); }, phase);
    const page = await ctx.newPage();
    page.on('pageerror', (e) => errors.push(String(e)));
    await page.goto(url);
    await page.waitForFunction(() => window.__game);
    await page.waitForTimeout(600);
    for (const state of process.argv[5] === 'after' ? ['after'] : ['before', 'after']) {
      if (state === 'after') await page.evaluate(() => { const g = window.__game; g.syncWorld({ works: Object.fromEntries((window.__works || []).map((k) => [k, 9999])) }); });
      for (const [name, x, y] of SPOTS) {
        if (tag === 'phone' && !['square', 'west', 'north'].includes(name)) continue;
        await page.evaluate(([x, y]) => Object.assign(window.__game.hero, { x, y }), [x, y]);
        await page.waitForTimeout(500);
        await page.screenshot({ path: `${out}/${state}-${name}-${tag}.png` });
      }
    }
    if (tag === 'phone') {
      await page.evaluate(() => window.__game.syncWorld({ works: {} }));
      await page.evaluate(() => { window.__game.profile.gold = 300; window.__openSpot('works'); });
      await page.waitForTimeout(500);
      await page.screenshot({ path: `${out}/works-panel-${tag}.png` });
      await page.click('#panel button[data-i="0"]');
      await page.waitForTimeout(900);
      await page.screenshot({ path: `${out}/works-detail-${tag}.png` });
      // Back from a job to a town raided while you were away: Dunn tells you, once.
      await page.evaluate(() => { window.__panel.hide(); const g = window.__game; g.syncWorld({ day: 30, works: { wash: 0, lanterns: 0, dig: 80 }, raids: [{ day: 30, lost: ['wash', 'lanterns'] }] }); Object.assign(g.hero, { x: 28, y: 19 }); });
      await page.waitForTimeout(2500);
      await page.screenshot({ path: `${out}/raid-news-${tag}.png` });
      await page.evaluate(() => window.__panel.hide());
    }
    await ctx.close();
  }
  console.log('errors', JSON.stringify(errors));
  await browser.close();
})();
