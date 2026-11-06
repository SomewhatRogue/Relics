// The Staithe (Kyle approved the biomes proposal, 2026-11-05) on a phone, FLAT and 2.5D: arriving mid-raid
// (the log going across, the gaffer at the jetty's end, the smokehouse catching), the gaffer's hook at
// you (its thin red lane), oil burning on the water as it drifts down onto the jetty, and the Barrowfields'
// map with the Staithe pinned. Targets from scripts/staithe/find.ts (target.json).
// Usage: node scripts/staithe-look.cjs [url] [outdir]
const { chromium } = require('playwright');
const { nets, day } = require('./staithe/target.json');
const url = process.argv[2] || 'http://localhost:4422/?hero=WARRIOR';
const out = process.argv[3] || 'shots';
const NOON = 2400000 * 700 + 1200000;
const PHONE = { viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true };

/** Into the NETS room: the rooms before it cleared, out by the road that leads to it. */
async function toStaithe(page, look) {
  await page.goto(url + (look === '3d' ? '&look=3d' : ''));
  await page.waitForFunction(() => window.__game && window.__fx && typeof window.render_game_to_text === 'function');
  await page.evaluate((ms) => { Date.now = () => ms; }, NOON);
  return page.evaluate(async (s) => {
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
    const st = g.room.map.staithe;
    return st ? { ring: st.ring, across: st.across, down: st.down } : null;
  }, nets);
}

/** The shot's moment, laid out in the room and stepped with the effects fed (the game's own step held). */
async function scene(page, what) {
  return page.evaluate(async (what) => {
    const g = window.__game, r = g.room, fx = window.__fx, st = r.map.staithe, h = g.hero, wait = (ms) => new Promise((d) => setTimeout(d, ms));
    const step = (n) => { for (let i = 0; i < n; i++) { r.step(); for (const ev of r.events) fx.on(ev); } };
    Object.assign(h, { hp: 9999, maxHp: 9999, safeT: 0 });
    const [ax, ay] = st.across, [dx, dy] = st.down, jet = r.map.blocks.find((b) => b.kind === 'jetty');
    const info = {};
    if (what === 'arrive') {
      // Just in, a few steps up the bank from the landing: the scene going on, nobody's seen you yet.
      Object.assign(h, { x: st.ring.x - ax * 2.2 - dx * 1.2, y: st.ring.y - ay * 2.2 - dy * 1.2, fx: ax, fy: ay });
      step(150);
      Object.assign(h, { x: st.ring.x - ax * 2.2 - dx * 1.2, y: st.ring.y - ay * 2.2 - dy * 1.2, safeT: 0 });
      g.step = () => [];
      info.log = r.map.blocks.find((b) => b.kind === 'gangway').layAt;
    } else if (what === 'hook') {
      // The gaffer turned on you: its hook winding up down the thin lane, its brute beside it.
      g.step = () => [];
      const gf = r.enemies.find((e) => e.variant === 'gaffer'), br = r.enemies.find((e) => e.variant === 'heavy');
      for (const e of r.enemies) if (e !== gf && e !== br && e.variant !== 'log' && !(e.task && e.task.k === 'kindle')) Object.assign(e, { x: 1, y: 1, act: 'dead', hp: 0, death: 'burst', respawns: false });
      const k = gf.x + dx * 3.2 > 1 && gf.x + dx * 3.2 < r.map.w - 1 && gf.y + dy * 3.2 > 1 && gf.y + dy * 3.2 < r.map.h - 1 ? 1 : -1;
      Object.assign(h, { x: gf.x + dx * 3.2 * k - ax * 0.6, y: gf.y + dy * 3.2 * k - ay * 0.6, fx: -dx * k, fy: -dy * k, act: 'idle' });
      Object.assign(gf, { alert: true, task: undefined, cooldown: 0 });
      step(1);
      const a = gf.attack;
      if (!a || a.kind !== 'hook') {
        const l = Math.hypot(h.x - gf.x, h.y - gf.y);
        gf.fx = (h.x - gf.x) / l, gf.fy = (h.y - gf.y) / l;
        gf.attack = { kind: 'hook', aimed: h.id, t: 0, windup: 0.9, active: 0.1, recover: 0.9, dmg: 6, knock: 0, unblockable: false, dx: gf.fx, dy: gf.fy, ox: gf.x, oy: gf.y, range: 4, arc: 6, cx: gf.x, cy: gf.y, radius: 0, done: false };
        gf.act = 'attack';
      }
      gf.attack.t = gf.attack.windup * 0.75;
      info.hook = gf.attack.kind;
    } else if (what === 'oil') {
      // The skimmer's oil alight on the water, drifting down onto the jetty: its boards and the net on it catching.
      Object.assign(h, { x: st.ring.x - ax * 1.5 - dx * 2, y: st.ring.y - ay * 1.5 - dy * 2, fx: ax, fy: ay });
      for (const e of r.enemies) if (e.variant !== 'skimmer' && e.variant !== 'log') Object.assign(e, { cooldown: 99 });
      r.events.length = 0;
      const sk = r.enemies.find((e) => e.variant === 'skimmer');
      const spots = [[st.pour[0], st.pour[1]], [jet.x + jet.w / 2 - dx * 2.6 - ax * 1.0, jet.y + jet.h / 2 - dy * 2.6 - ay * 1.0]];
      for (const [x, y] of spots) r.slicks.push({ id: 900 + r.slicks.length, x, y, r: 1.1, until: r.time + 60, lit: r.time, burn: 12, drift: [dx * 0.42, dy * 0.42] });
      if (sk) Object.assign(sk, { alert: true });
      step(150);
      g.step = () => [];
      info.jetty = [jet.burning, jet.hp];
      info.slicks = r.slicks.filter((s) => s.lit >= 0).length;
    }
    for (const q of r.heroes) r.prev.set('h:' + q.id, [q.x, q.y]);
    for (const e of r.enemies) r.prev.set('e:' + e.id, [e.x, e.y]);
    await wait(10);
    return info;
  }, what);
}

(async () => {
  const browser = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const errors = [];
  for (const look of ['flat', '3d']) {
    const ctx = await browser.newContext(PHONE), page = await ctx.newPage();
    page.on('pageerror', (e) => errors.push(`${look} ${e}`));
    page.on('console', (m) => m.type() === 'error' && errors.push(`${look} ${m.text()}`));
    for (const what of ['arrive', 'hook', 'oil']) {
      const st = await toStaithe(page, look);
      if (!st) { errors.push(`${look} ${what}: no staithe in the room`); continue; }
      const info = await scene(page, what);
      await page.waitForTimeout(look === '3d' ? 1500 : 900);
      await page.screenshot({ path: `${out}/staithe-${what}-${look}.png` });
      const goal = await page.evaluate(() => window.__game.goalText && window.__game.goalText());
      console.log(what, look, JSON.stringify(info), goal);
    }
    // The Barrowfields with the Staithe pinned: its map screen.
    await page.goto(`${url}&exped=${day}${look === '3d' ? '&look=3d' : ''}`);
    await page.waitForFunction(() => window.__game && window.__game.room.exped, null, { timeout: 60000 });
    await page.evaluate((ms) => { Date.now = () => ms; }, NOON);
    await page.waitForTimeout(800);
    // Seen from the bank first, so the map shows the ground round it.
    await page.evaluate(() => {
      const g = window.__game, st = g.room.map.staithe, x = g.room.exped;
      Object.assign(g.hero, { x: st.ring.x - 1.5, y: st.ring.y + 1.5, hp: 9999, maxHp: 9999, safeT: 0 });
      for (let i = 0; i < 20; i++) g.room.step();
      x.seen = x.seen.replace(/./g, 'f');
    });
    await page.waitForTimeout(look === '3d' ? 1500 : 800);
    await page.screenshot({ path: `${out}/staithe-bigworld-${look}.png` });
    await page.click('#mapbtn');
    await page.waitForTimeout(600);
    await page.screenshot({ path: `${out}/staithe-map-${look}.png` });
    const pins = await page.evaluate(() => { const x = window.__game.room.exped; return { goals: x.goals.map((g) => g.kind), sides: x.sides.map((g) => g.kind) }; });
    console.log('map', look, JSON.stringify(pins));
    await ctx.close();
  }
  console.log(errors.length ? 'ERRORS ' + JSON.stringify(errors.slice(0, 5)) : 'no page errors');
  await browser.close();
})();
