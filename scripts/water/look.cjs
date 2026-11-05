// Water, phone and laptop, flat and 2.5D: a river room with its broken bridge and ford, a ford with
// blood spilled in it and on the bank (just after, and a few seconds on as it drifts), and a hero wading
// the shallows with goblins coming through behind (rings at their feet).
// Usage: node scripts/water/look.cjs [url] [outdir]
const { chromium } = require('playwright');
const url = process.argv[2] || 'http://localhost:4400/?hero=WARRIOR';
const out = process.argv[3] || 'shots';
const NOON = 2400000 * 700 + 1200000;
const BARROWBY = { name: 'Barrowby', kind: 'village', region: 'Barrowfields', ruin: 1 };
const CAMPS = { name: 'The Charcoal Camps', kind: 'forest', region: 'Greyhollow', ruin: 2 };
const SCENES = [
  { name: 'river', place: CAMPS, seed: 8, room: 1, what: 'river' },
  { name: 'blood', place: BARROWBY, seed: 3, room: 0, what: 'blood', wait: 900 },
  { name: 'blood-later', place: BARROWBY, seed: 3, room: 0, what: 'blood', wait: 3600 },
  { name: 'ripples', place: BARROWBY, seed: 3, room: 0, what: 'ripples' },
];

async function to(page, s) {
  await page.evaluate(async ([s, place]) => {
    const g = window.__game, wait = (ms) => new Promise((r) => setTimeout(r, ms)), j = g.jobs()[1];
    g.startJob({ ...j, place, objective: 'hunt', boss: 'SKARN', rooms: 5, seed: s.seed, layout: 3, deep: false });
    await wait(120);
    for (let k = 0; k < s.room; k++) {
      for (const e of g.room.enemies) Object.assign(e, { hp: 0, act: 'dead', respawns: false, death: 'burst' });
      g.room.exitOpen = true;
      const m = g.room.map, a = m.exit ?? m.roads.find((r) => r.road[0] === 'h').area;
      Object.assign(g.hero, { x: a.x + a.w / 2, y: a.y + a.h / 2 });
      await wait(250);
    }
  }, [s, s.place]);
}

/** Stand by the ford; spill blood, or wade with goblins behind. */
async function act(page, s) {
  await page.evaluate(async (s) => {
    const g = window.__game, fx = window.__fx, m = g.room.map, wait = (ms) => new Promise((r) => setTimeout(r, ms));
    const ford = m.water.filter((w) => !w.deep).sort((a, b) => b.w * b.h - a.w * a.h)[0], deep = m.water.find((w) => w.deep && w.w > 4);
    const fc = { x: ford.x + ford.w / 2, y: ford.y + ford.h / 2 };
    g.hero.safeT = 1e9;
    for (const e of g.room.enemies) Object.assign(e, { cooldown: 99, alert: false });
    if (s.what === 'river') return void Object.assign(g.hero, { x: fc.x - 1.5, y: ford.y + ford.h + 1.2 });
    if (s.what === 'blood') {
      for (const e of g.room.enemies) Object.assign(e, { hp: 0, act: 'dead', respawns: false, death: 'burst', x: 1, y: 1 });
      Object.assign(g.hero, { x: fc.x - 2.5, y: ford.y + ford.h + 1.6 });
      const px = (x, y) => [8 + x * 16, 56 + y * 16];
      const kill = (x, y, how, kind = 'scrapper') => { const [a, b] = px(x, y); fx.gore.death({ k: 'death', how, kind, dx: 1, dy: 0.3, x, y }, a, b); };
      kill(fc.x - 0.8, fc.y - 0.3, 'burst');
      kill(fc.x + 1.2, fc.y + 0.4, 'behead');
      kill(fc.x - 1.8, ford.y + ford.h + 1.0, 'burst');
      if (deep) kill(Math.min(deep.x + deep.w - 1.5, fc.x + 4.5), deep.y + deep.h / 2, 'burst', 'butcher');
      return;
    }
    // Wading: across the ford, two goblins coming through after.
    Object.assign(g.hero, { x: ford.x + 0.6, y: fc.y });
    g.room.enemies.slice(0, 2).forEach((e, i) => Object.assign(e, { x: ford.x + 0.4 + i * 0.3, y: ford.y + ford.h + 2 + i, alert: true, hp: 999, cooldown: 99, act: 'chase' }));
  }, s);
  if (s.what === 'ripples') {
    await page.keyboard.down('d');
    await page.waitForTimeout(1100);
    await page.keyboard.up('d');
  }
}

(async () => {
  const browser = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const errors = [];
  for (const look of ['flat', '3d']) for (const [dev, opts] of [['phone', { viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true }], ['laptop', { viewport: { width: 1280, height: 800 }, deviceScaleFactor: 2 }]]) {
    const ctx = await browser.newContext(opts), page = await ctx.newPage();
    page.on('pageerror', (e) => errors.push(`${dev} ${look} ${e}`));
    page.on('console', (m) => m.type() === 'error' && errors.push(`${dev} ${look} ${m.text()}`));
    for (const s of SCENES) {
      await page.goto(url + (look === '3d' ? '&look=3d' : '&look=flat'));
      await page.waitForFunction(() => window.__game && typeof window.render_game_to_text === 'function');
      await page.evaluate((ms) => { Date.now = () => ms; }, NOON);
      await to(page, s);
      await page.waitForTimeout(look === '3d' ? 1300 : 500);
      await act(page, s);
      await page.waitForTimeout(s.wait ?? 250);
      await page.screenshot({ path: `${out}/${s.name}-${dev}-${look}.png` });
      const info = await page.evaluate(() => { const g = window.__game, f = window.__fx; return { hero: [+g.hero.x.toFixed(1), +g.hero.y.toFixed(1)], clouds: f.wet ? f.wet.clouds.length : -1, rings: f.wet ? f.wet.ripples.length : -1, decals: f.decals.length }; });
      console.log(dev, look, s.name, JSON.stringify(info));
    }
    await ctx.close();
  }
  console.log('errors', JSON.stringify(errors));
  await browser.close();
})();
