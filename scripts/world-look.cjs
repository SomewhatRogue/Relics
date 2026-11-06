// World effects, on a phone, FLAT and 2.5D (shared/worldfx.ts): a jolt across a ford (the sky's strike into
// the water, everyone in it jolted), a FED butcher beside one at its meal (the red ring filling), iced
// shallows with goblins held on them, and a steam cloud with the hero inside. On Barrowby's ford (seed 3,
// the first room). The game's own step is held; the room is stepped here and its events handed to the
// effects, so what's drawn is what the room decided.
// Usage: node scripts/world-look.cjs [url] [outdir]
const { chromium } = require('playwright');
const url = process.argv[2] || 'http://localhost:4415/?hero=MAGE';
const out = process.argv[3] || 'shots';
const NOON = 2400000 * 700 + 1200000;
const BARROWBY = { name: 'Barrowby', kind: 'village', region: 'Barrowfields', ruin: 1 };
const PHONE = { viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true };

async function setup(page, look) {
  await page.goto(url + '&look=' + look);
  await page.waitForFunction(() => window.__game && window.__fx && typeof window.render_game_to_text === 'function');
  await page.evaluate((ms) => { Date.now = () => ms; }, NOON);
  await page.evaluate(async (place) => {
    const g = window.__game, wait = (ms) => new Promise((r) => setTimeout(r, ms)), j = g.jobs()[1];
    g.startJob({ ...j, place, objective: 'hunt', boss: 'SKARN', rooms: 5, seed: 3, layout: 3, deep: false });
    await wait(300);
  }, BARROWBY);
  await page.waitForTimeout(look === '3d' ? 1500 : 500);
}

/** Lay the scene out on the ford (the room held still), and step it `steps` ticks with the effects fed. */
async function scene(page, what) {
  return page.evaluate(async (what) => {
    const g = window.__game, r = g.room, fx = window.__fx, m = r.map, wait = (ms) => new Promise((d) => setTimeout(d, ms));
    g.step = () => [];
    const ford = m.water.filter((w) => !w.deep).sort((a, b) => b.w * b.h - a.w * a.h)[0];
    const c = { x: ford.x + ford.w / 2, y: ford.y + ford.h / 2 }, h = g.hero, t = r.time;
    h.safeT = 0;
    // (The job's own weather held off: no strike of its own on the hero mid-shot.)
    r.nextStrike = 1e9;
    r.strikes.length = 0;
    r.ices.length = 0;
    r.smokes.length = 0;
    const gobs = r.enemies.filter((e) => e.kind === 'scrapper'), big = r.enemies.filter((e) => e.kind === 'butcher');
    const park = (e) => Object.assign(e, { x: 1, y: 1, act: 'dead', hp: 0, death: 'burst', respawns: false });
    r.enemies.forEach(park);
    const put = (e, x, y, more = {}) => Object.assign(e, { x, y, act: 'chase', actT: 0, actDur: 5, variant: undefined, bow: false, hp: 60, maxHp: 60, attack: null, cooldown: 99, kvx: 0, kvy: 0, alert: true, death: '', fx: -1, fy: 0.4, frozenUntil: 0, chillUntil: 0, burnUntil: 0, eaten: false, ashed: false, meal: null, fed: false, fedUntil: 0, ...more });
    const step = (n) => { for (let i = 0; i < n; i++) { r.step(); for (const ev of r.events) fx.on(ev); } };
    const info = { ford: [+ford.x.toFixed(1), +ford.y.toFixed(1), ford.w, ford.h] };
    if (what === 'jolt') {
      Object.assign(h, { x: c.x - 2.2, y: ford.y + ford.h + 1.4, fx: 1, fy: -0.5 });
      const spots = [[c.x - 1.6, c.y - 0.4], [c.x + 0.4, c.y + 0.5], [c.x + 1.8, c.y - 0.6], [c.x + 3.2, c.y + 0.3], [c.x - 0.5, c.y + 0.9]];
      spots.forEach(([x, y], i) => gobs[i] && put(gobs[i], x, y, { hp: 200, maxHp: 200 }));
      r.strikes.push({ id: 999, x: spots[0][0], y: spots[0][1], r: 1.3, at: r.time + 0.05, on: 'goblin' });
      step(4);
      info.hurt = gobs.slice(0, 5).map((e) => e.maxHp - e.hp);
      // On past the strike's flash (the goblins held where they stood), the jolt's crackle kept up below.
      for (let i = 0; i < 20; i++) step(1), spots.forEach(([x, y], k) => gobs[k] && Object.assign(gobs[k], { x, y, kvx: 0, kvy: 0, cooldown: 99, attack: null }));
      // Keep the crackle up for the camera (the room's jolt, re-shown).
      window.__keep = setInterval(() => window.__poolEv && fx.on(window.__poolEv), 120);
      return info;
    }
    if (what === 'fed') {
      Object.assign(h, { x: c.x - 0.6, y: ford.y + ford.h + 2.6, fx: 1, fy: -0.3 });
      // (Barrowby's first room has no butchers: two of its goblins stand in for them.)
      const asButcher = (e) => e && Object.assign(e, { kind: 'butcher', radius: 0.62, weight: 3.5 });
      const b1 = big[0] ?? asButcher(gobs[5]), b2 = big[1] ?? asButcher(gobs[6]);
      const body = gobs[0], body2 = gobs[1];
      put(body, c.x + 0.5, ford.y + ford.h + 1.0);
      Object.assign(body, { act: 'dead', hp: 0, death: 'fall' });
      put(body2, c.x - 1.6, ford.y + ford.h + 1.9);
      Object.assign(body2, { act: 'dead', hp: 0, death: 'fall', ashed: true });
      put(b1, c.x + 1.6, ford.y + ford.h + 1.1, { hp: 200, maxHp: 260, fx: -1, fy: 0 });
      b1.meal = { b: body.id, x: body.x, y: body.y, at: t - 1.1, until: t + 0.9 };
      if (b2) put(b2, c.x - 1.8, ford.y + ford.h + 0.6, { hp: 260, maxHp: 260, fed: true, fedUntil: t + 60, fx: -1, fy: 0.2 });
      info.butchers = [b1 && b1.kind, b2 && b2.kind];
      return info;
    }
    if (what === 'ice') {
      Object.assign(h, { x: c.x - 2.6, y: ford.y + ford.h + 1.2, fx: 1, fy: -0.5 });
      r.ices.push({ id: 1, x: c.x, y: c.y, r: 2.6, at: t - 1, until: t + 60 });
      [[c.x - 0.8, c.y - 0.3], [c.x + 0.9, c.y + 0.4], [c.x + 0.2, c.y - 0.8]].forEach(([x, y], i) => gobs[i] && put(gobs[i], x, y, { onIce: true, chillUntil: t + 60 }));
      fx.on({ k: 'iced', x: c.x, y: c.y, r: 2.6 });
      step(1);
      info.onIce = gobs.slice(0, 3).map((e) => e.onIce);
      return info;
    }
    // Steam: the hero inside a cloud over the ford, a goblin outside it.
    Object.assign(h, { x: c.x, y: c.y, fx: 1, fy: 0 });
    r.smokes.push({ x: c.x, y: c.y, until: t + 60, r: 1.4, steam: true, next: 1e9, by: '' });
    put(gobs[0], c.x + 3.4, c.y + 1.2);
    fx.on({ k: 'steamup', x: c.x, y: c.y, r: 1.4 });
    step(2);
    info.hidden = h.hiddenUntil > r.time;
    return info;
  }, what).then(async (info) => {
    // Drawn where they are now, not eased from before the scene was laid (the room is held, so no tick moves them on).
    await page.evaluate(() => { const r = window.__game.room; for (const h of r.heroes) r.prev.set('h:' + h.id, [h.x, h.y]); for (const e of r.enemies) r.prev.set('e:' + e.id, [e.x, e.y]); });
    return info;
  });
}

(async () => {
  const browser = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const errors = [];
  for (const look of ['flat', '3d']) {
    const ctx = await browser.newContext(PHONE), page = await ctx.newPage();
    page.on('pageerror', (e) => errors.push(`${look} ${e}`));
    page.on('console', (m) => m.type() === 'error' && errors.push(`${look} ${m.text()}`));
    // The jolt's event, kept so the camera catches its crackle (it lives under half a second).
    await page.addInitScript(() => {
      const keep = () => {
        if (!window.__fx || window.__fx.__kept) return setTimeout(keep, 50);
        const on = window.__fx.on.bind(window.__fx);
        window.__fx.on = (ev) => (ev.k === 'pooljolt' && (window.__poolEv = ev), on(ev));
        window.__fx.__kept = true;
      };
      keep();
    });
    for (const what of ['jolt', 'fed', 'ice', 'steam']) {
      await setup(page, look);
      const info = await scene(page, what);
      await page.waitForTimeout(what === 'jolt' ? 450 : look === '3d' ? 1500 : 1000);
      // FED said over the one that's eaten, just before the camera (the callout lives about a second).
      if (what === 'fed') await page.evaluate(() => { const b = window.__game.room.enemies.find((e) => e.fed); if (b) window.__fx.on({ k: 'fed', x: b.x, y: b.y, n: 65 }); }), await page.waitForTimeout(250);
      await page.screenshot({ path: `${out}/world-${what}-${look}.png` });
      info.after = await page.evaluate(() => { const g = window.__game, r = g.room; return { hero: [+g.hero.x.toFixed(1), +g.hero.y.toFixed(1), g.hero.act, Math.round(g.hero.hp)], z: (r.zones||[]).map((z) => z.kind || 'bless'), t: +r.time.toFixed(2), b: r.enemies.filter((e) => e.kind === 'butcher').map((e) => [+e.x.toFixed(1), +e.y.toFixed(1)]), same: r === window.__room }; });
      await page.evaluate(() => window.__keep && clearInterval(window.__keep));
      console.log(what, look, JSON.stringify(info));
    }
    await ctx.close();
  }
  console.log(errors.length ? 'ERRORS ' + JSON.stringify(errors.slice(0, 5)) : 'no page errors');
  await browser.close();
})();
