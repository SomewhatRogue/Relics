// Weather that changes the fight (shared/sky.ts): the board's weather, a rain job, a fog job, and a
// storm strike's circle and its flash, FLAT and 2.5D, phone and laptop. The room is held still for each
// shot (its clock stopped), so the strike's circle and flash are caught where they should be.
// Usage: node scripts/weather-look.cjs [url] [outdir] [only,these] [phone|laptop]
const { chromium } = require('playwright');
const url = process.argv[2] || 'http://localhost:4397/';
const out = process.argv[3] || 'shots';
const only = process.argv[4] ? process.argv[4].split(',') : null;
const devs = process.argv[5] ? process.argv[5].split(',') : ['phone', 'laptop'];
const NOON = 2400000 * 700 + 1200000;

const FIELDS = { name: "Tollan's Farm", kind: 'farm', region: 'Barrowfields', ruin: 1 };
const FEN = { name: 'The Peat Cuts', kind: 'marsh', region: 'Fenmere', ruin: 2 };

// A job's first room under a sky; goblins left standing but quiet. `strike`: a strike near the hero, `lead`
// seconds off (negative: just landed).
const job = (place, seed, sky, strike) => async (page) => {
  await page.evaluate(async ([place, seed, sky, strike]) => {
    const g = window.__game, wait = (ms) => new Promise((r) => setTimeout(r, ms)), j = g.jobs()[1];
    Date.now = () => 2400000 * 700 + 1200000;
    g.startJob({ ...j, place, objective: 'rescue', boss: 'SKARN', rooms: 3, seed, layout: 3, deep: false, twist: 'none', time: 'day' });
    await wait(200);
    const room = g.room, m = room.map;
    const W = { rain: { rain: 0.4, storm: undefined, fog: undefined }, fog: { fog: 0.6, mist: 1.4, rain: undefined, storm: undefined }, storm: { rain: 1, storm: 1, fog: undefined } }[sky];
    m.theme = { ...m.theme, ...W, sky };
    for (const e of room.enemies) Object.assign(e, { cooldown: 99, alert: false });
    Object.assign(g.hero, { x: m.w / 2, y: m.h * 0.62, fx: 0, fy: -1, safeT: 0 });
    await wait(250);
    if (strike) room.strikes.push({ id: 41, x: g.hero.x + 1.8, y: g.hero.y - 2.2, r: 1.3, at: room.time + strike, on: 'ground', done: strike < 0 });
    room.advance = () => [];
  }, [place, seed, sky, strike ?? null]);
};

const SCENES = {
  board: async (page) => {
    await page.evaluate(() => window.__openSpot('board'));
    await page.waitForTimeout(800);
    await page.evaluate(() => document.querySelector('#panel .jhead')?.click());
    await page.waitForTimeout(800);
  },
  rain: job(FIELDS, 7, 'rain'),
  fog: job(FEN, 7, 'fog'),
  'storm-warn': job(FIELDS, 7, 'storm', 0.35),
  'storm-flash': job(FIELDS, 7, 'storm', -0.02),
};

(async () => {
  const browser = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const DEV = { phone: { viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true }, laptop: { viewport: { width: 1280, height: 800 }, deviceScaleFactor: 2 } };
  for (const dev of devs) {
    const ctx = await browser.newContext(DEV[dev]);
    for (const [name, go] of Object.entries(SCENES)) {
      if (only && !only.includes(name)) continue;
      const page = await ctx.newPage(), errors = [];
      page.on('pageerror', (e) => errors.push(String(e)));
      page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
      await page.goto(url + (url.includes('?') ? '&' : '?') + 'hero=WARRIOR');
      await page.waitForFunction(() => window.__game && window.__views);
      await page.evaluate((ms) => { const g = window.__game; document.getElementById('title').hidden = true; if (window.__title) window.__title.open = false; if (g.mode === 'wood') g.skipWood(); Date.now = () => ms; }, NOON);
      await page.waitForTimeout(300);
      await go(page);
      const views = name === 'board' ? ['flat'] : ['flat', '3d'];
      for (const v of views) {
        await page.evaluate((v) => window.__views.switch.set(v === '3d' ? '3d' : 'pixel'), v);
        if (v === '3d') await page.waitForFunction(() => window.__views.is3d, null, { timeout: 20000 });
        await page.waitForTimeout(v === '3d' ? 1800 : 700);
        await page.screenshot({ path: `${out}/${name}-${dev}-${v}.png` });
      }
      const sky = await page.evaluate(() => window.__game.room?.map.theme.sky ?? '');
      console.log(dev, name, sky, errors.length ? 'ERRORS ' + JSON.stringify(errors.slice(0, 3)) : '');
      await page.close();
    }
    await ctx.close();
  }
  await browser.close();
})();
