// Deep floors' own sizes and layouts (shared/deepshapes.ts) on a phone and a laptop: a handful of floors,
// each with its shape printed. Usage: node scripts/deepshape-look.cjs [url] [outdir] [floors, e.g. 1,2,6,7] [pixel|3d]
const { chromium } = require('playwright');
const url = process.argv[2] || 'http://localhost:4173/';
const out = process.argv[3] || 'shots';
const floors = (process.argv[4] || '1,2,3,6,7,8').split(',').map(Number), view = process.argv[5] || 'pixel';

(async () => {
  const browser = await chromium.launch();
  for (const [tag, opts] of [['phone', { viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true }], ['laptop', { viewport: { width: 1280, height: 800 } }]]) {
    const ctx = await browser.newContext(opts), page = await ctx.newPage(), errors = [];
    page.on('pageerror', (e) => errors.push(String(e)));
    await page.goto(`${url}?hero=WARRIOR`);
    await page.waitForFunction(() => window.__game && window.__game.mode === 'town' && window.__views, null, { timeout: 20000 });
    await page.evaluate((v) => window.__views.switch.set(v), view);
    for (const n of floors) {
      const info = await page.evaluate((n) => {
        const g = window.__game;
        if (g.mode === 'town') g.enterDeep();
        g.profile.deep.floor = n - 1;
        g.descend();
        const m = g.room.map;
        return `floor ${g.run.job.floor} ${m.w}x${m.h} goblins ${g.room.enemies.length} blocks ${m.blocks.length}`;
      }, n);
      await page.waitForTimeout(view === '3d' ? 2200 : 1100);
      await page.screenshot({ path: `${out}/deepshape-${view}-${tag}-${n}.png` });
      console.log(tag, info);
      if (tag === 'laptop') break;
    }
    if (errors.length) console.log('errors', errors.slice(0, 3));
    await ctx.close();
  }
  await browser.close();
})();
