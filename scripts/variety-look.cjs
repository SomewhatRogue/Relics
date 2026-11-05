// Layout 4 (docs/terrain-nodes.md; Kyle 2026-11-04: "choices between screens, more than just high road,
// low road"): forks whose two ways show a word and a cue, each staged scene, and a few of the new rooms,
// phone and laptop, flat and 2.5D. Targets come from scripts/variety/find.ts (targets.json).
// Usage: node scripts/variety-look.cjs [url] [outdir] [only-name-prefix]
const { chromium } = require('playwright');
const { targets } = require('./variety/targets.json');
const url = process.argv[2] || 'http://localhost:4403/?hero=WARRIOR';
const out = process.argv[3] || 'shots';
const only = process.argv[4] || '';
const NOON = 2400000 * 700 + 1200000;
const ROOMS = ['room-mill', 'room-orchard', 'room-churchyard', 'room-deepwood', 'room-cave', 'room-minehead', 'room-barrows', 'room-stackyard'];
const LIST = targets.filter((t) => (!t.name.startsWith('room-') || ROOMS.includes(t.name)) && t.name.startsWith(only));

async function to(page, s) {
  await page.evaluate(async (s) => {
    const g = window.__game, wait = (ms) => new Promise((r) => setTimeout(r, ms)), j = g.jobs()[1];
    g.startJob({ ...j, place: s.place, objective: 'hunt', boss: 'SKARN', rooms: 5, seed: s.seed, layout: 4, deep: false, twist: 'none', time: 'day' });
    await wait(150);
    for (let k = 0; k < s.room; k++) {
      for (const e of g.room.enemies) Object.assign(e, { hp: 0, act: 'dead', respawns: false, death: 'burst' });
      g.room.exitOpen = true;
      const m = g.room.map, a = m.exit ?? m.roads.find((r) => r.road[0] === s.took).area;
      Object.assign(g.hero, { x: a.x + a.w / 2, y: a.y + a.h / 2 });
      await wait(300);
    }
  }, s);
}

async function stand(page, s) {
  await page.evaluate((s) => {
    const g = window.__game;
    // Nobody swings while the shot's taken; the scene's own goblins go on with what they're at.
    for (const e of g.room.enemies) e.cooldown = 99;
    if (s.open) {
      for (const e of g.room.enemies) Object.assign(e, { hp: 0, act: 'dead', respawns: false, death: 'burst' });
      g.room.exitOpen = true;
    }
    Object.assign(g.hero, { x: Math.max(1, Math.min(g.room.map.w - 1, s.x)), y: Math.max(1, Math.min(g.room.map.h - 1, s.y)) });
  }, s);
}

(async () => {
  const browser = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const errors = [];
  for (const look of ['flat', '3d']) for (const [dev, opts] of [['phone', { viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true }], ['laptop', { viewport: { width: 1280, height: 800 }, deviceScaleFactor: 2 }]]) {
    const ctx = await browser.newContext(opts), page = await ctx.newPage();
    page.on('pageerror', (e) => errors.push(`${dev} ${look} ${e}`));
    page.on('console', (m) => m.type() === 'error' && errors.push(`${dev} ${look} ${m.text()}`));
    for (const s of LIST) {
      await page.goto(url + (look === '3d' ? '&look=3d' : ''));
      await page.waitForFunction(() => window.__game && typeof window.render_game_to_text === 'function');
      await page.evaluate((ms) => { Date.now = () => ms; }, NOON);
      await to(page, s);
      await stand(page, s);
      // A fork: a shot from a few steps inside each of its ways, its word and its cue in view.
      const ways = s.name.startsWith('fork') ? await page.evaluate(() => window.__game.room.map.roads.map((r) => r.way)) : [null];
      for (const [k, way] of ways.entries()) {
        if (way) await page.evaluate((k) => {
          const g = window.__game, r = g.room.map.roads[k], a = r.area, c = { x: a.x + a.w / 2, y: a.y + a.h / 2 };
          const d = r.side === 'W' ? [4.5, 0] : r.side === 'E' ? [-4.5, 0] : [0, 5.5];
          Object.assign(g.hero, { x: c.x + d[0], y: c.y + d[1] });
        }, k);
        await page.waitForTimeout(look === '3d' ? 1500 : 1000);
        await page.screenshot({ path: `${out}/${s.name}${way ? '-' + way : ''}-${dev}-${look}.png` });
      }
      const info = await page.evaluate(() => {
        const g = window.__game, m = g.room.map;
        return { room: g.run && g.run.index, roads: m.roads && m.roads.map((r) => [r.label, r.way, r.side]), banner: document.getElementById('banner')?.textContent, led: m.led && m.led.n, held: m.blocks.filter((b) => b.held).map((b) => b.torched) };
      });
      console.log(dev, look, s.name, JSON.stringify(info));
    }
    await ctx.close();
  }
  console.log('errors', JSON.stringify(errors));
  await browser.close();
})();
