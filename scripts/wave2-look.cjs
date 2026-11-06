// The second wave on a phone (shared/meaty2.ts, shared/elites.ts): the Kegman, the Pouncer and the Gorger each
// winding up (the telegraph as the room judges it; the Pouncer crouched, then in the air), the Gorger pulling a
// body in, a Kegman's keg about to go up, and a brute with each new affix: Oil-soaked (and alight, its burst
// coming), Hornblower (blowing, its call's spot at the edge), Smouldering (and dead, its embers coming up).
// Usage: node scripts/wave2-look.cjs [url] [outdir]
const { chromium } = require('playwright');
const url = process.argv[2] || 'http://localhost:4481/';
const out = process.argv[3] || 'shots';

const PLACE = { name: 'Barrowby', kind: 'village', region: 'Barrowfields', ruin: 1 };
const SWING = { kind: 'cleave', windup: 0.9, active: 0.1, recover: 0.8, range: 1.5, arc: 90, radius: 0, unblockable: false };
const LEAP = { kind: 'slam', windup: 1.2, active: 0.1, recover: 0.05, range: 0, arc: 0, radius: 1.1, unblockable: true, leap: true };
const BITE = { kind: 'cleave', windup: 1.0, active: 0.1, recover: 0.9, range: 1.7, arc: 100, radius: 0, unblockable: false };
const M = (v, hp, r) => `{ role: '${v}', hp: ${hp}, maxHp: ${hp}, radius: ${r} }`;
const SCENES = {
  'w2-kegman': `window.__wind = [mk('kegman', 0, -1.4, ${M('kegman', 70, 0.42)}), ${JSON.stringify(SWING)}, 0.6];
    mk(undefined, -1.8, -2.6, { role: 'fodder' }); mk(undefined, 1.7, -2.8, { role: 'fodder' }); mk(undefined, 0.2, -3.2, { role: 'fodder' });`,
  'w2-pouncer-crouch': `window.__wind = [mk('pouncer', 0.4, -4.4, ${M('pouncer', 80, 0.4)}), ${JSON.stringify(LEAP)}, 0.35];
    mk(undefined, -1.8, -5.6, { role: 'fodder' }); mk(undefined, 2.2, -5.8, { role: 'fodder' });`,
  'w2-pouncer-air': `window.__wind = [mk('pouncer', 0.4, -4.4, ${M('pouncer', 80, 0.4)}), ${JSON.stringify(LEAP)}, 0.8];`,
  'w2-gorger': `window.__wind = [mk('gorger', 0, -1.6, ${M('gorger', 110, 0.48)}), ${JSON.stringify(BITE)}, 0.6];
    mk(undefined, -2, -3, { role: 'fodder', hp: 22, maxHp: 22 }); mk(undefined, 2, -3.1, { role: 'fodder', hp: 22, maxHp: 22 }); mk(undefined, -0.4, -3.6, { role: 'fodder', hp: 22, maxHp: 22 });`,
  'w2-gorger-pull': `const g = mk('gorger', 0, -3.2, ${M('gorger', 132, 0.58)}); g.grown = 1; const b = mk(undefined, 2.8, -1.6, { role: 'fodder', act: 'dead', actT: 0.5, actDur: 20, death: 'fall', hp: 0 });
    window.__meal = [g, b, 0.55]; mk(undefined, -1.8, -4.4, { role: 'fodder' });`,
  'w2-keg-burst': `const k = mk('kegman', 0.6, -1.2, ${M('kegman', 70, 0.42)}); Object.assign(k, { act: 'dead', actT: 0.3, actDur: 20, death: 'fall', hp: 0 });
    window.__blast = [k, 'keg', 1.0, 1.6, 0.55]; mk(undefined, -1.2, -2.4, { role: 'fodder' }); mk(undefined, 1.6, -2.2, { role: 'fodder' });`,
  'w2-elite-oiled': `mk('heavy', 0, -2.2, { role: 'heavy', hp: 110, maxHp: 110, elite: ['oiled'] }); mk(undefined, -1.8, -3.2, { role: 'fodder' });`,
  'w2-elite-oiled-alight': `const o = mk('heavy', 0, -2.2, { role: 'heavy', hp: 110, maxHp: 110, elite: ['oiled'], act: 'stunned', actT: 0.2, actDur: 1.15 });
    window.__blast = [o, 'oiled', 1.0, 1.6, 0.5]; window.__burn = o; mk(undefined, -1.4, -3, { role: 'fodder' }); mk(undefined, 1.3, -3.1, { role: 'fodder' });`,
  'w2-elite-horn': `const hb = mk('heavy', 0, -3, { role: 'heavy', hp: 50, maxHp: 110, elite: ['horn'] }); window.__call = [hb, 0.6]; mk(undefined, -1.8, -3.8, { role: 'fodder' });`,
  'w2-elite-ember': `mk('heavy', 0, -2.2, { role: 'heavy', hp: 110, maxHp: 110, elite: ['ember'] }); mk(undefined, 1.9, -3.2, { role: 'fodder' });`,
  'w2-elite-ember-dead': `const d = mk('heavy', 0.4, -1.4, { role: 'heavy', hp: 0, maxHp: 110, elite: ['ember'], act: 'dead', actT: 0.4, actDur: 20, death: 'fall' });
    window.__blast = [d, 'ember', 1.2, 1.8, 0.6];`,
  'w2-all': `mk('kegman', -2.2, -3, ${M('kegman', 70, 0.42)}); mk('pouncer', 0, -3.6, ${M('pouncer', 80, 0.4)}); mk('gorger', 2.2, -3, ${M('gorger', 110, 0.48)});
    mk('heavy', -2.4, -6, { role: 'heavy', hp: 110, maxHp: 110, elite: ['oiled'] }); mk('shield', 0, -6.4, { role: 'shield', hp: 44, maxHp: 44, elite: ['horn'] }); mk('heavy', 2.4, -6, { role: 'heavy', hp: 110, maxHp: 110, elite: ['ember'] });`,
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
      const e = { ...JSON.parse(JSON.stringify(base)), id: id++, kind: 'scrapper', variant, x: h.x + dx, y: h.y + dy, home: { x: h.x + dx, y: h.y + dy }, hp: 36, maxHp: 36, radius: 0.34, weight: 0.6, act: 'chase', attack: null, alert: true, respawns: false, escaped: false, name: undefined, bow: false, z: 0, feeding: false, pack: 1, cooldown: 99, held: 0, big: false, sprintAt: undefined, elite: undefined, blast: undefined, call: undefined, meal: null, grown: undefined, ...more };
      const dx2 = h.x - e.x, dy2 = h.y - e.y, l = Math.hypot(dx2, dy2) || 1;
      e.fx = dx2 / l, e.fy = dy2 / l;
      r.enemies.push(e);
      return e;
    };
    window.__wind = window.__blast = window.__call = window.__meal = window.__burn = undefined;
    eval(code);
    const pos = r.enemies.filter((e) => !e.escaped).map((e) => [e, e.x, e.y, e.moving, e.act, e.actT]);
    clearInterval(window.__hold);
    window.__hold = setInterval(() => {
      const t = r.time;
      for (const [e, x, y, moving, act, actT] of pos) Object.assign(e, { x, y, cooldown: 99, moving: !!moving, ...(act === 'dead' || act === 'stunned' ? { act, actT } : {}) });
      h.hp = h.maxHp;
      // Held part way through its wind-up as the shot is taken (a Pouncer's circle round where the hero stands, its body along its flight).
      const w = window.__wind;
      if (w) {
        const [e, s, k] = w, home = pos.find((p) => p[0] === e);
        const a = { ...s, t: s.windup * k, dmg: 1, knock: 0, dx: e.fx, dy: e.fy, ox: home[1], oy: home[2], cx: s.leap ? h.x : e.x, cy: s.leap ? h.y : e.y, done: false };
        if (s.leap) {
          const q = Math.max(0, Math.min(1, (k - 0.55) / 0.45));
          Object.assign(e, { x: home[1] + (h.x - home[1]) * q, y: home[2] + (h.y - home[2]) * q });
        }
        Object.assign(e, { act: 'attack', attack: a });
      }
      const b = window.__blast;
      if (b) { const [e, k, fuse, rr, part] = b, home = pos.find((p) => p[0] === e); e.blast = { k, x: home[1], y: home[2], r: rr, at: t + fuse * (1 - part) }; }
      const c = window.__call;
      if (c) { const [e, part] = c; e.call = { at: t - 2 * part, until: t + 2 * (1 - part), x: Math.max(1, h.x - 5), y: e.y }; }
      const m = window.__meal;
      if (m) { const [e, body, part] = m; e.meal = { b: body.id, x: body.x, y: body.y, at: t - 1.5 * part, until: t + 1.5 * (1 - part) }; }
      if (window.__burn) window.__burn.burnUntil = t + 2;
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
      if (look === '3d' && !['w2-pouncer-crouch', 'w2-keg-burst', 'w2-elite-horn', 'w2-all'].includes(name)) continue;
      await stage(page, code);
      await page.waitForTimeout(700);
      await page.screenshot({ path: `${out}/${name}-${look}-phone.png` });
      console.log(name, look, await page.evaluate(() => window.__game.room.enemies.filter((e) => !e.escaped).map((e) => `${e.variant || e.role}${e.elite ? '[' + e.elite.join('+') + ']' : ''}${e.attack ? '(' + e.attack.kind + ')' : ''}${e.blast ? '{' + e.blast.k + '}' : ''}${e.call ? '<horn>' : ''}${e.meal ? '<pull>' : ''}`).join(' ')));
    }
  }
  console.log(errors.length ? errors.slice(0, 5) : 'no errors');
  await browser.close();
})();
