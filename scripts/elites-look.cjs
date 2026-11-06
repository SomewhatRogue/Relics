// Elites and the new meaty sorts on a phone (shared/elites.ts, shared/meaty.ts): the Planker, the Swingle and
// the Forker each winding up its blow at the hero (the telegraph as the room judges it), and a brute with each
// affix built: Plated, Quick, Gorging. Usage: node scripts/elites-look.cjs [url] [outdir]
const { chromium } = require('playwright');
const url = process.argv[2] || 'http://localhost:4451/';
const out = process.argv[3] || 'shots';

const PLACE = { name: 'Barrowby', kind: 'village', region: 'Barrowfields', ruin: 1 };
// The wind-ups as shared/meaty.ts has them, part way through (`t`), aimed at the hero below.
const DOOR = { kind: 'cleave', windup: 1.0, active: 0.1, recover: 1.3, range: 1.8, arc: 110, radius: 0, unblockable: false };
const SPIN = { kind: 'slam', windup: 1.3, active: 0.2, recover: 0.1, range: 0, arc: 0, radius: 2.3, unblockable: true };
const JAB = { kind: 'stab', windup: 0.9, active: 0.1, recover: 0.8, range: 1.9, arc: 18, radius: 0, unblockable: false, tines: 1.72 };
const SCENES = {
  'meaty-planker': `window.__wind = [mk('planker', 0, -1.6, { role: 'planker', hp: 120, maxHp: 120, radius: 0.46 }), ${JSON.stringify(DOOR)}, 0.65];
    mk(undefined, -1.8, -3, { role: 'fodder' }); mk(undefined, 1.6, -3.2, { role: 'fodder' });`,
  'meaty-swingle': `window.__wind = [mk('swingle', 0.2, -1.4, { role: 'swingle', hp: 100, maxHp: 100, radius: 0.42 }), ${JSON.stringify(SPIN)}, 0.8];
    mk(undefined, -2.4, -3.4, { role: 'fodder' }); mk(undefined, 2.6, -3.6, { role: 'fodder' });`,
  'meaty-forker': `window.__wind = [mk('forker', 0, -3, { role: 'forker', hp: 90, maxHp: 90, radius: 0.4 }), ${JSON.stringify(JAB)}, 0.6];
    mk(undefined, -2, -4.2, { role: 'fodder' }); mk(undefined, 2.2, -4.4, { role: 'fodder' });`,
  'elite-plated': `mk('heavy', 0, -2.2, { role: 'heavy', hp: 110, maxHp: 110, elite: ['plated'] }); mk(undefined, -1.8, -3.2, { role: 'fodder' });`,
  'elite-quick': `mk('heavy', 0, -2.2, { role: 'heavy', hp: 110, maxHp: 110, elite: ['quick'], moving: true }); mk(undefined, 1.9, -3.2, { role: 'fodder' });`,
  'elite-gorging': `mk('heavy', 0, -2.2, { role: 'heavy', hp: 110, maxHp: 110, elite: ['gorging'] }); mk(undefined, -1.9, -3.1, { role: 'fodder' });`,
  'elite-all': `mk('heavy', -2.4, -2.6, { role: 'heavy', hp: 110, maxHp: 110, elite: ['plated'] }); mk('shield', 0, -3, { role: 'shield', hp: 44, maxHp: 44, elite: ['quick'], moving: true }); mk('heavy', 2.4, -2.6, { role: 'heavy', hp: 110, maxHp: 110, elite: ['gorging'] });
    mk('planker', -1.4, -5.4, { role: 'planker', hp: 120, maxHp: 120, radius: 0.46 }); mk('swingle', 0.4, -5.8, { role: 'swingle', hp: 100, maxHp: 100, radius: 0.42 }); mk('forker', 2, -5.4, { role: 'forker', hp: 90, maxHp: 90, radius: 0.4 });`,
};

async function setUp(page) {
  await page.waitForFunction(() => window.__game);
  await page.evaluate(() => { window.__game.create('ROGUE', 'WREN'); document.getElementById('title').hidden = true; window.__title.open = false; });
  await page.waitForTimeout(300);
  await page.evaluate(() => window.__game.mode === 'wood' && window.__game.skipWood());
  await page.waitForTimeout(300);
}

async function stage(page, code) {
  await page.evaluate(() => {
    const g = window.__game, j = g.jobs()[1];
    g.startJob({ ...j, place: window.__place, objective: 'rescue', rooms: 1, seed: 5, layout: 3 });
  });
  await page.waitForTimeout(400);
  await page.evaluate((code) => {
    const g = window.__game, r = g.room, h = g.hero, base = JSON.parse(JSON.stringify(r.enemies.find((e) => e.kind === 'scrapper') || r.enemies[0]));
    for (const e of r.enemies) Object.assign(e, { x: 1.2, y: 1.2, act: 'dead', actT: 99, escaped: true });
    const x0 = Math.round(r.map.w / 2), y0 = r.map.hero.y - 4;
    Object.assign(h, { x: x0, y: y0, fx: 0, fy: -1, safeT: 0 });
    let id = Math.max(...r.enemies.map((e) => e.id)) + 1;
    const mk = (variant, dx, dy, more = {}) => {
      const e = { ...JSON.parse(JSON.stringify(base)), id: id++, kind: 'scrapper', variant, x: h.x + dx, y: h.y + dy, home: { x: h.x + dx, y: h.y + dy }, hp: 36, maxHp: 36, radius: 0.34, weight: 0.6, act: 'chase', attack: null, alert: true, respawns: false, escaped: false, name: undefined, bow: false, z: 0, feeding: false, pack: 1, cooldown: 99, held: 0, big: false, sprintAt: undefined, elite: undefined, ...more };
      const dx2 = h.x - e.x, dy2 = h.y - e.y, l = Math.hypot(dx2, dy2) || 1;
      e.fx = dx2 / l, e.fy = dy2 / l;
      r.enemies.push(e);
      return e;
    };
    window.__wind = undefined;
    eval(code);
    const pos = r.enemies.filter((e) => !e.escaped).map((e) => [e, e.x, e.y, e.moving]);
    clearInterval(window.__hold);
    window.__hold = setInterval(() => {
      for (const [e, x, y, moving] of pos) Object.assign(e, { x, y, cooldown: 99, moving: !!moving });
      h.hp = h.maxHp;
      // Held part way through its wind-up as the shot is taken (the Forker's lane from its tines).
      const w = window.__wind;
      if (w) {
        const [e, s, k] = w, off = s.tines || 0;
        Object.assign(e, { act: 'attack', attack: { ...s, t: s.windup * k, dmg: 1, knock: 0, dx: e.fx, dy: e.fy, ox: e.x + e.fx * off, oy: e.y + e.fy * off, cx: e.x, cy: e.y, done: false } });
      }
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
  for (const look of ['flat', '3d']) {
    await page.goto(url + '?look=' + look);
    await setUp(page);
    await page.evaluate((p) => (window.__place = p), PLACE);
    for (const [name, code] of Object.entries(SCENES)) {
      if (look === '3d' && !['meaty-planker', 'meaty-swingle', 'meaty-forker', 'elite-all'].includes(name)) continue;
      await stage(page, code);
      await page.waitForTimeout(700);
      await page.screenshot({ path: `${out}/${name}-${look}-phone.png` });
      console.log(name, look, await page.evaluate(() => window.__game.room.enemies.filter((e) => !e.escaped).map((e) => `${e.variant || e.role}${e.elite ? '[' + e.elite.join('+') + ']' : ''}${e.attack ? '(' + e.attack.kind + ')' : ''}`).join(' ')));
    }
  }
  console.log(errors.length ? errors.slice(0, 5) : 'no errors');
  await browser.close();
})();
