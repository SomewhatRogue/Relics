// FLAT and 2.5D side by side, the same moment in the same room (the VIEW switch flipped live): every
// Wickhold hall inside, the yard, the square and a street, a cottage inside, a job room in each country
// and the Barrowfields, phone and laptop. Prints 2.5D's draw calls and triangles for each.
// Layout 4's rooms and scenes (targets from scripts/parity2/find.ts) and the Barrowfields' camps and jobs too.
// Usage: node scripts/parity-look.cjs [url] [outdir] [only,these] [phone|laptop]
const { chromium } = require('playwright');
const { targets: L4 } = require('./parity2/targets.json');
const url = process.argv[2] || 'http://localhost:4396/';
const out = process.argv[3] || 'shots';
const only = process.argv[4] ? process.argv[4].split(',') : null;
const devs = process.argv[5] ? process.argv[5].split(',') : ['phone', 'laptop'];
const MIDNIGHT = 2400000 * 700 + 60000, NOON = 2400000 * 700 + 1200000;

const hallIn = (door, at) => async (page) => {
  await page.evaluate(([door, at]) => {
    const g = window.__game;
    if (door === 'infirmary' || door.startsWith('home')) g.world.rescued = 9;
    const b = g.room.map.blocks.find((b) => b.door === door) ?? { kind: 'house', door, x: 30, y: 20, w: 2, h: 2 };
    g.enter(b);
    const m = g.room.map;
    Object.assign(g.hero, { x: at ? at[0] : m.w / 2, y: at ? at[1] : m.h - 2.2, fx: 0, fy: -1 });
  }, [door, at ?? null]);
};
const town = (x, y, clock = MIDNIGHT) => async (page) => {
  await page.evaluate(([x, y, ms]) => { Date.now = () => ms; Object.assign(window.__game.hero, { x, y, fx: 0, fy: -1 }); }, [x, y, clock]);
};
const P = {
  village: { name: 'Barrowby', kind: 'village', region: 'Barrowfields', ruin: 1 },
  fields: { name: "Tollan's Farm", kind: 'farm', region: 'Barrowfields', ruin: 1 },
  wood: { name: 'The Charcoal Camps', kind: 'forest', region: 'Greyhollow', ruin: 2 },
  fen: { name: 'The Peat Cuts', kind: 'marsh', region: 'Fenmere', ruin: 2 },
  rock: { name: 'Brokenbridge', kind: 'river', region: 'Copperdeep', ruin: 2 },
  under: { name: 'The Wickhold Sewers', kind: 'mine', region: 'Wickhold', ruin: 2 },
};
// A job's last room (its heart, in the place's own country), the goblins held off; `inside` goes in a door.
const job = (place, seed, inside) => async (page) => {
  await page.evaluate(async ([place, seed, inside]) => {
    const g = window.__game, wait = (ms) => new Promise((r) => setTimeout(r, ms)), j = g.jobs()[1];
    Date.now = () => 2400000 * 700 + 1200000;
    g.startJob({ ...j, place, objective: 'rescue', boss: 'SKARN', rooms: 2, seed, layout: 3, deep: false, twist: 'none' });
    await wait(150);
    for (const e of g.room.enemies) Object.assign(e, { hp: 0, act: 'dead', respawns: false, death: 'burst' });
    g.room.exitOpen = true;
    const m0 = g.room.map, a = m0.exit ?? (m0.roads ?? [])[0]?.area;
    if (a) Object.assign(g.hero, { x: a.x + a.w / 2, y: a.y + a.h / 2 });
    await wait(300);
    for (const e of g.room.enemies) e.cooldown = 99;
    const m = g.room.map, house = m.blocks.find((b) => b.door && !b.locked && b.fate !== 'blocked' && (b.kind === 'house' || b.kind === 'barn'));
    if (inside && house) {
      g.enter(house);
      await wait(100);
      for (const e of g.room.enemies) Object.assign(e, { cooldown: 99, x: 1, y: 1 });
      const r = g.room.map;
      return Object.assign(g.hero, { x: r.w / 2, y: r.h - 2, fx: 0, fy: -1 });
    }
    const near = house ?? m.blocks.find((b) => b.kind !== 'sideway');
    Object.assign(g.hero, near ? { x: near.x + near.w / 2, y: Math.min(m.h - 1, near.y + near.h + 2.5) } : { x: m.w / 2, y: m.h / 2 });
  }, [place, seed, !!inside]);
};

// A layout-4 job's room (scripts/parity2/targets.json): walk the rooms to it, stand at its pieces.
const l4 = (s) => async (page) => {
  await page.evaluate(async (s) => {
    const g = window.__game, wait = (ms) => new Promise((r) => setTimeout(r, ms)), j = g.jobs()[1];
    Date.now = () => 2400000 * 700 + 1200000;
    g.startJob({ ...j, place: s.place, objective: 'hunt', boss: 'SKARN', rooms: 5, seed: s.seed, layout: 4, deep: false, twist: 'none', time: 'day' });
    await wait(150);
    for (let k = 0; k < s.room; k++) {
      for (const e of g.room.enemies) Object.assign(e, { hp: 0, act: 'dead', respawns: false, death: 'burst' });
      g.room.exitOpen = true;
      const m = g.room.map, a = m.exit ?? m.roads.find((r) => r.road[0] === s.took).area;
      Object.assign(g.hero, { x: a.x + a.w / 2, y: a.y + a.h / 2 });
      await wait(300);
    }
    for (const e of g.room.enemies) e.cooldown = 99;
    const m = g.room.map;
    Object.assign(g.hero, { x: Math.max(1, Math.min(m.w - 1, s.x)), y: Math.max(1, Math.min(m.h - 1, s.y)), fx: 0, fy: -1 });
  }, s);
};
// The Barrowfields at one of its jobs (a camp's fire, the engine, the cages, the barrows, the beacon).
const exped = (what) => async (page) => {
  await page.evaluate((what) => {
    const g = window.__game;
    Date.now = () => 2400000 * 700 + 1200000;
    g.startJob(g.jobs().at(-1));
    for (const e of g.room.enemies) e.cooldown = 99;
    const x = g.room.exped, m = g.room.map, goal = x.goals.find((q) => q.kind === what);
    if (what === 'beacon') x.phase = 'hold';
    const at = what === 'beacon' ? { x: x.zone.x, y: x.zone.y } : what === 'camp' ? m.braziers.find((b) => b.wild) : goal ?? m.braziers.find((b) => b.wild);
    Object.assign(g.hero, { x: at.x, y: Math.min(m.h - 1, at.y + 2.5), fx: 0, fy: -1 });
  }, what);
};

const SCENES = {
  ...Object.fromEntries(L4.map((t) => [t.name, l4(t)])),
  'exped-camp': exped('camp'), 'exped-engine': exped('engine'), 'exped-prisoners': exped('prisoners'), 'exped-larder': exped('larder'), 'exped-dens': exped('dens'), 'exped-shrine': exped('shrine'), 'exped-beacon': exped('beacon'),
  tower: hallIn('tower'), barracks: hallIn('hall'), lodge: hallIn('lodge'), church: hallIn('church'), rat: hallIn('tavern'),
  forge: hallIn('forge'), bank: hallIn('bank'), townhall: hallIn('townhall'), infirmary: hallIn('infirmary'), home: hallIn('home:0'),
  'tower-stair': hallIn('tower', [8.6, 4.4]),
  square: town(28, 21), 'square-day': town(28, 21, NOON), halls: town(40, 10), west: town(9, 18), rat_street: town(17, 37),
  yard: async (page) => { await page.evaluate(() => window.__game.enterYard()); },
  village: job(P.village, 7), cottage: job(P.village, 7, true), fields: job(P.fields, 7), wood: job(P.wood, 7), fen: job(P.fen, 7), rock: job(P.rock, 7), under: job(P.under, 7),
  barrowfields: async (page) => { await page.evaluate(() => { const g = window.__game; g.startJob(g.jobs().at(-1)); for (const e of g.room.enemies) e.cooldown = 99; }); },
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
      await page.goto(url + (url.includes('?') ? '&' : '?') + 'hero=WARRIOR&perf=1');
      await page.waitForFunction(() => window.__game && window.__views);
      await page.evaluate(() => { const g = window.__game; document.getElementById('title').hidden = true; if (window.__title) window.__title.open = false; if (g.mode === 'wood') g.skipWood(); Date.now = () => 2400000 * 700 + 60000; });
      await page.waitForTimeout(300);
      await go(page);
      // Hold the room still: nothing moves between the two shots.
      await page.evaluate(() => { const g = window.__game, h = { ...g.hero }; window.__hold = setInterval(() => Object.assign(g.hero, { x: h.x, y: h.y, fx: h.fx, fy: h.fy }), 16); });
      await page.evaluate(() => window.__views.switch.set('pixel'));
      await page.waitForTimeout(1500);
      await page.screenshot({ path: `${out}/${name}-${dev}-flat.png` });
      await page.evaluate(() => window.__views.switch.set('3d'));
      await page.waitForFunction(() => window.__views.is3d, null, { timeout: 15000 });
      await page.waitForTimeout(1600);
      await page.screenshot({ path: `${out}/${name}-${dev}-3d.png` });
      const st = await page.evaluate(() => window.__views.stats);
      const room = await page.evaluate(() => window.__game.room.map.name);
      console.log(dev, name, room, st ? `calls ${st.calls} tris ${st.tris ?? '?'} frame ${st.frame?.toFixed?.(0)}` : '', errors.length ? 'ERRORS ' + JSON.stringify(errors.slice(0, 3)) : '');
      await page.close();
    }
    await ctx.close();
  }
  await browser.close();
})();
