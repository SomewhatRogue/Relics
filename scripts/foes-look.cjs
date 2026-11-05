// The hungry's newer sorts, each staged by the hero, and two composed encounters, flat and 2.5D, phone
// and laptop. Usage: node scripts/foes-look.cjs [url] [outdir] [only]
const { chromium } = require('playwright');
const url = process.argv[2] || 'http://localhost:4380/';
const out = process.argv[3] || 'shots';
const only = process.argv[4];

const PLACE = { village: { name: 'Barrowby', kind: 'village', region: 'Barrowfields', ruin: 2 }, field: { name: 'Lowfurrow Fields', kind: 'field', region: 'Barrowfields', ruin: 2 }, mine: { name: 'The Copperdeep Shafts', kind: 'mine', region: 'Copperdeep', ruin: 2 } };
// Each: where, and what's put by the hero (run in the page; `mk(variant, dx, dy, more)` adds a goblin).
const SCENES = {
  banner: ['village', `mk('banner', 0, -4.6); for (const [dx, dy] of [[-1.5,-3],[0,-2.6],[1.4,-3.1],[-0.6,-3.6],[0.9,-3.9]]) mk(undefined, dx, dy);`],
  netter: ['village', `mk('netter', 1.5, -5); for (const [dx, dy] of [[-1.2,-2],[1,-2.2]]) mk(undefined, dx, dy); h.netUntil = r.time + 999; h.act = 'stun'; h.actDur = 999;`],
  thief: ['village', `const t = mk('thief', 1.8, -1.2); t.loot = { gold: 20 }; t.fx = 1; t.fy = 0; mk(undefined, -1.2, -2.2);`],
  logs: ['village', `const l = mk('log', 0, -4.8, { radius: 0.85, weight: 5 }); l.fx = 0; l.fy = 1; window.__charge = l;`],
  roofer: ['village', `const b = r.map.blocks.find((q) => q.kind === 'house' || q.kind === 'barn') || { x: h.x - 2, y: h.y - 7, w: 4, h: 3 }; const e = mk('roofer', 0, 0, { bow: true, z: 2 }); Object.assign(e, { x: b.x + b.w / 2, y: b.y + b.h * 0.4, home: { x: b.x + b.w / 2, y: b.y + b.h * 0.4 } }); Object.assign(h, { x: b.x + b.w / 2 + 1, y: b.y + b.h + 3 }); window.__shoot = e;`],
  wolves: ['field', `mk('keeper', 0, -6); for (const [dx, dy] of [[-2.4,-0.6],[2.3,0.4],[-1.2,2.2]]) mk('wolf', dx, dy, { radius: 0.3, weight: 0.5 }); window.__pounce = r.enemies[r.enemies.length - 1];`],
  oil: ['village', `mk('oiler', -2.5, -5); mk('torch', 2, -3); r.slicks.push({ id: 1, x: h.x, y: h.y, r: 1.25, until: 999, lit: -1 }, { id: 2, x: h.x + 3, y: h.y - 1.5, r: 1.25, until: 999, lit: r.time }); window.__torch = r.enemies[r.enemies.length - 1];`],
  sapper: ['field', `const s = mk('sapper', 0.5, -3.5); Object.assign(s, { under: true, act: 'carried', z: -1, fx: 0, fy: 1, digT: 1 }); window.__erupt = mk('sapper', -2, 1.2);`],
  crows: ['field', `r.map.npcs = [...(r.map.npcs || []), { x: h.x - 1, y: h.y - 3, name: '', talk: 'dead', look: 'farmer', pose: 'corpse' }]; r.crows = [{ id: 1, x: h.x - 1, y: h.y - 3.2, up: -1 }, { id: 2, x: h.x + 2.5, y: h.y - 1, up: r.time - 0.6 }]; h.crowsUntil = r.time + 999; mk(undefined, 2, -5);`],
  blind: ['mine', `for (const [dx, dy] of [[-1.6,-2.4],[0.4,-3.4],[1.8,-2]]) mk('blind', dx, dy); window.__slash = r.enemies[r.enemies.length - 1];`],
};
// Two composed encounters (shared/encounter.ts), as the room lays them out: a village's first room and a field's.
const COMPOSED = { 'enc-village': ['village', 8], 'enc-field': ['field', 3] };

async function setUp(page) {
  await page.waitForFunction(() => window.__game);
  await page.evaluate(() => { window.__game.create('WARRIOR', 'BRANNOCK'); document.getElementById('title').hidden = true; window.__title.open = false; });
  await page.waitForTimeout(300);
  await page.evaluate(() => window.__game.mode === 'wood' && window.__game.skipWood());
  await page.waitForTimeout(300);
}

async function job(page, place, seed) {
  await page.evaluate(([p, s]) => { const g = window.__game, j = g.jobs()[1]; g.startJob({ ...j, place: p, objective: 'rescue', rooms: 1, seed: s, layout: 3 }); }, [place, seed]);
  await page.waitForTimeout(400);
}

async function stage(page, code) {
  await page.evaluate((code) => {
    const g = window.__game, r = g.room, h = g.hero, base = JSON.parse(JSON.stringify(r.enemies.find((e) => e.kind === 'scrapper') || r.enemies[0]));
    for (const e of r.enemies) Object.assign(e, { x: 1.2, y: 1.2, act: 'dead', actT: 99, escaped: true });
    const x0 = Math.round(r.map.w / 2), y0 = r.map.hero.y - 5;
    Object.assign(h, { x: x0, y: y0, fx: 0, fy: -1, safeT: 0 });
    let id = Math.max(...r.enemies.map((e) => e.id)) + 1;
    const mk = (variant, dx, dy, more = {}) => {
      const e = { ...JSON.parse(JSON.stringify(base)), id: id++, kind: 'scrapper', variant, x: h.x + dx, y: h.y + dy, home: { x: h.x + dx, y: h.y + dy }, hp: 40, maxHp: 40, radius: 0.34, weight: 0.6, act: 'chase', attack: null, alert: true, respawns: false, escaped: false, name: undefined, bow: false, z: 0, feeding: false, pack: 1, cooldown: 99, ...more };
      const dx2 = h.x - e.x, dy2 = h.y - e.y, l = Math.hypot(dx2, dy2) || 1;
      e.fx = dx2 / l, e.fy = dy2 / l;
      r.enemies.push(e);
      return e;
    };
    eval(code);
    const pos = r.enemies.filter((e) => !e.escaped).map((e) => [e, e.x, e.y]);
    window.__hold = setInterval(() => {
      for (const [e, x, y] of pos) Object.assign(e, { x, y, cooldown: 99 }, e.under ? { digT: 0.5 } : {});
      h.hp = h.maxHp;
      const t = r.time;
      // Wind-ups held part way, so the telegraph shows.
      const hold = (e, kind, spec, cx, cy) => e && (e.act = 'attack', e.attack = { kind, t: spec.windup * 0.6, windup: spec.windup, active: 0.1, recover: 0.5, dmg: 1, knock: 0, unblockable: spec.unb, dx: e.fx, dy: e.fy, ox: e.x, oy: e.y, range: spec.range || 0, arc: spec.arc || 0, cx: cx ?? e.x, cy: cy ?? e.y, radius: spec.radius || 0, done: false });
      if (window.__charge) hold(window.__charge, 'charge', { windup: 1.35, range: 9, radius: 0.85, unb: true });
      if (window.__shoot) hold(window.__shoot, 'shot', { windup: 1, range: 9.5, arc: 7 });
      if (window.__pounce) hold(window.__pounce, 'pounce', { windup: 0.55, range: 2.6, radius: 0.35 });
      if (window.__torch) hold(window.__torch, 'torch', { windup: 0.9, radius: 1.25, unb: true }, h.x, h.y);
      if (window.__erupt) hold(window.__erupt, 'erupt', { windup: 0.7, radius: 1.05, unb: true });
      if (window.__slash) hold(window.__slash, 'stab', { windup: 0.5, range: 1.45, arc: 70 });
      void t;
    }, 10);
  }, code);
}

(async () => {
  const browser = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  for (const [dev, opts] of [['phone', { viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true }], ['laptop', { viewport: { width: 1280, height: 800 }, deviceScaleFactor: 2 }]]) {
    for (const look of ['flat', '3d']) {
      const ctx = await browser.newContext(opts);
      const page = await ctx.newPage();
      const errors = [];
      page.on('pageerror', (e) => errors.push(String(e)));
      page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
      await page.goto(url + '?look=' + look);
      await setUp(page);
      for (const [name, [place, code]] of Object.entries(SCENES)) {
        if (only && !name.startsWith(only)) continue;
        await page.evaluate(() => { clearInterval(window.__hold); for (const k of ['__charge', '__shoot', '__pounce', '__torch', '__erupt', '__slash']) window[k] = undefined; });
        await job(page, PLACE[place], 5);
        await stage(page, code);
        await page.waitForTimeout(look === '3d' ? 1200 : 600);
        await page.screenshot({ path: `${out}/${name}-${dev}-${look}.png` });
      }
      for (const [name, [place, seed]] of Object.entries(COMPOSED)) {
        if (only && !name.startsWith(only)) continue;
        await page.evaluate(() => { clearInterval(window.__hold); for (const k of ['__charge', '__shoot', '__pounce', '__torch', '__erupt', '__slash']) window[k] = undefined; });
        await job(page, PLACE[place], seed);
        // Walk the hero up toward the first pack, and let it see them.
        await page.evaluate(() => {
          const g = window.__game, r = g.room, h = g.hero, alive = r.enemies.filter((e) => e.act !== 'dead' && e.pack !== undefined && e.pack < 90);
          // The biggest pack, from a little below its middle.
          const ids = [...new Set(alive.map((e) => e.pack))], big = ids.map((id) => alive.filter((e) => e.pack === id)).sort((a, b) => b.length - a.length)[0] || [];
          const mx = big.reduce((s, e) => s + e.x, 0) / (big.length || 1), my = big.reduce((s, e) => s + e.y, 0) / (big.length || 1);
          const at = big.length ? { x: mx, y: Math.min(r.map.h - 2, my + 4.5) } : { x: h.x, y: h.y };
          Object.assign(h, { ...at, fx: 0, fy: -1 });
          window.__hold = setInterval(() => (h.hp = h.maxHp, Object.assign(h, at)), 20);
        });
        await page.waitForTimeout(1500);
        await page.screenshot({ path: `${out}/${name}-${dev}-${look}.png` });
      }
      console.log(dev, look, errors.length ? errors.slice(0, 3) : 'no errors');
      await ctx.close();
    }
  }
  await browser.close();
})();
