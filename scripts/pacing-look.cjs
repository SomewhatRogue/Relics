// The pacing slice on a phone (sim/pacing.ts, chase.ts, bigone.ts): a swarm beat to splat (one of it
// leaning into a sprint), a tactical beat with a brute and a BIG ONE, and a held pack jeering at the edge
// of the screen while the hero has a full one. Usage: node scripts/pacing-look.cjs [url] [outdir]
const { chromium } = require('playwright');
const url = process.argv[2] || 'http://localhost:4429/';
const out = process.argv[3] || 'shots';

const PLACE = { name: 'Barrowby', kind: 'village', region: 'Barrowfields', ruin: 2 };
// Each: what's put by the hero (run in the page; `mk(variant, dx, dy, more)` adds a goblin of pack 1).
const SCENES = {
  'pace-swarm': `for (const [dx, dy] of [[-2,-3.2],[-0.8,-3.8],[0.6,-3.4],[1.9,-3],[-1.4,-2.1],[0.1,-2.4],[1.3,-1.9],[-2.6,-1.6],[2.7,-2.2]]) mk(undefined, dx, dy, { hp: 22, maxHp: 22, role: 'fodder' });
    window.__lean = mk(undefined, -0.4, -5.2, { role: 'fodder' }); window.__lean.sprintAt = r.time;`,
  'pace-tactic': `mk('heavy', -2.2, -3.6, { role: 'heavy', hp: 110, maxHp: 110 }); mk(undefined, -3.2, -2.4, { role: 'fodder' }); mk(undefined, -1, -2.2, { role: 'fodder' });
    mk('archer', 0.2, -6.4, { role: 'archer', bow: true });
    window.__big = mk('ironhide', 2.4, -4.2, { role: 'ironhide', big: true, hp: 270, maxHp: 270, radius: 0.44, weight: 1.1, pack: 2 }); mk(undefined, 3.4, -3, { role: 'fodder', pack: 2 });`,
  'pace-held': `mk('heavy', -1.4, -1.8, { role: 'heavy', hp: 110, maxHp: 110 }); for (const [dx, dy] of [[-2.4,-1],[0.2,-2.2],[1.2,-1.2],[-0.6,-0.9],[2,-2]]) mk(undefined, dx, dy, { role: 'fodder' });
    mk('lunger', 0.9, -3, { role: 'lunger' });
    window.__held = [[-1.6,-7.4],[-0.4,-7.9],[0.9,-7.5],[2.1,-7.9],[0.3,-8.6]].map(([dx, dy], i) => mk(i === 4 ? 'shield' : undefined, dx, dy, { role: i === 4 ? 'shield' : 'fodder', pack: 2, held: r.time }));`,
};

async function setUp(page) {
  await page.waitForFunction(() => window.__game);
  await page.evaluate(() => { window.__game.create('ROGUE', 'WREN'); document.getElementById('title').hidden = true; window.__title.open = false; });
  await page.waitForTimeout(300);
  await page.evaluate(() => window.__game.mode === 'wood' && window.__game.skipWood());
  await page.waitForTimeout(300);
}

async function stage(page, code) {
  await page.evaluate((code) => {
    const g = window.__game, j = g.jobs()[1];
    g.startJob({ ...j, place: window.__place, objective: 'rescue', rooms: 1, seed: 5, layout: 3 });
  }, code);
  await page.waitForTimeout(400);
  await page.evaluate((code) => {
    const g = window.__game, r = g.room, h = g.hero, base = JSON.parse(JSON.stringify(r.enemies.find((e) => e.kind === 'scrapper') || r.enemies[0]));
    for (const e of r.enemies) Object.assign(e, { x: 1.2, y: 1.2, act: 'dead', actT: 99, escaped: true });
    const x0 = Math.round(r.map.w / 2), y0 = r.map.hero.y - 4;
    Object.assign(h, { x: x0, y: y0, fx: 0, fy: -1, safeT: 0 });
    let id = Math.max(...r.enemies.map((e) => e.id)) + 1;
    const mk = (variant, dx, dy, more = {}) => {
      const e = { ...JSON.parse(JSON.stringify(base)), id: id++, kind: 'scrapper', variant, x: h.x + dx, y: h.y + dy, home: { x: h.x + dx, y: h.y + dy }, hp: 36, maxHp: 36, radius: 0.34, weight: 0.6, act: 'chase', attack: null, alert: true, respawns: false, escaped: false, name: undefined, bow: false, z: 0, feeding: false, pack: 1, cooldown: 99, held: 0, big: false, sprintAt: undefined, ...more };
      const dx2 = h.x - e.x, dy2 = h.y - e.y, l = Math.hypot(dx2, dy2) || 1;
      e.fx = dx2 / l, e.fy = dy2 / l;
      r.enemies.push(e);
      return e;
    };
    window.__lean = window.__big = window.__held = undefined;
    eval(code);
    const pos = r.enemies.filter((e) => !e.escaped).map((e) => [e, e.x, e.y]);
    clearInterval(window.__hold);
    window.__hold = setInterval(() => {
      for (const [e, x, y] of pos) Object.assign(e, { x, y, cooldown: 99 });
      h.hp = h.maxHp;
      // Held as the shot is taken: the lean's tell, the held pack, the BIG ONE's stomp part way wound up.
      if (window.__lean) window.__lean.sprintAt = r.time - 0.15;
      for (const e of window.__held || []) e.held = r.time - 1;
      const b = window.__big;
      if (b) Object.assign(b, { act: 'attack', attack: { kind: 'slam', t: 0.7, windup: 1.25, active: 0.12, recover: 1.2, dmg: 1, knock: 0, unblockable: true, dx: b.fx, dy: b.fy, ox: b.x, oy: b.y, range: 0, arc: 0, cx: b.x, cy: b.y, radius: 1.8, done: false } });
    }, 10);
  }, code);
}

(async () => {
  const browser = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  await page.goto(url + '?look=flat');
  await setUp(page);
  await page.evaluate((p) => (window.__place = p), PLACE);
  for (const [name, code] of Object.entries(SCENES)) {
    await stage(page, code);
    await page.waitForTimeout(700);
    await page.screenshot({ path: `${out}/${name}-phone.png` });
    console.log(name, await page.evaluate(() => window.__game.room.enemies.filter((e) => !e.escaped).map((e) => `${e.variant || e.role}${e.big ? '(BIG)' : ''}${e.held ? '(held)' : ''}`).join(' ')));
  }
  console.log(errors.length ? errors.slice(0, 5) : 'no errors');
  await browser.close();
})();
