// The prologue wood's path and the scenes past its trees, on a phone and a laptop, flat and 2.5D.
// The hero is put at each spot with the lesson's goblins cleared and the gates open, so only the wood shows.
// Usage: node scripts/woodlook.cjs [url] [outdir] [only,these]   (prints page errors)
const { chromium } = require('playwright');
const url = process.argv[2] || 'http://localhost:4280/';
const out = process.argv[3] || 'shots';
const only = process.argv[4] ? process.argv[4].split(',') : null;

/** name: [x, y, seconds to let a scene run]. */
const SPOTS = {
  field: [12, 30, 1], path: [30, 33, 1], 'path-gate': [33, 27, 1], clearing: [32, 19, 1], stream: [50, 20, 1], hut: [52, 9, 1],
  carcass: [7, 26.5, 2], drag: [18, 26.5, 5], spit: [17, 6.5, 2], deer: [49, 27.5, 4], soldier: [58, 27.5, 4], 'soldier-end': [58, 27.5, 6],
};

(async () => {
  const browser = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  for (const look of ['flat', '3d']) for (const [dev, opts] of [['phone', { viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true }], ['laptop', { viewport: { width: 1280, height: 800 }, deviceScaleFactor: 2 }]]) {
    const ctx = await browser.newContext(opts);
    const page = await ctx.newPage();
    const errors = [];
    page.on('pageerror', (e) => errors.push(String(e)));
    page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
    await page.goto(url + (look === '3d' ? '?look=3d' : ''));
    await page.waitForFunction(() => window.__game);
    await page.evaluate(() => { window.__game.create('RANGER', 'STRAY'); document.getElementById('title').hidden = true; window.__title.open = false; });
    await page.waitForTimeout(300);
    for (const [name, [x, y, secs]] of Object.entries(SPOTS)) {
      if (only && !only.includes(name)) continue;
      await page.evaluate(([x, y]) => {
        const g = window.__game, w = g.wood, h = g.hero;
        Object.assign(w, { wake: -1, said: 99, hold: null, entered: true, stage: 5 });
        g.room.enemies = [];
        g.room.map.blocks = g.room.map.blocks.filter((b) => b.kind !== 'fence');
        Object.assign(h, { act: 'idle', actT: 0, actDur: 0, lying: false, x, y, fx: 0, fy: 1 });
      }, [x, y]);
      await page.waitForTimeout(secs * 1000);
      await page.evaluate(() => (window.__game.wood.hold = null));
      await page.screenshot({ path: `${out}/${dev}-${look}-${name}.png` });
    }
    console.log(dev, look, errors.length ? 'ERRORS ' + JSON.stringify(errors) : 'no errors');
    await ctx.close();
  }
  await browser.close();
})();
