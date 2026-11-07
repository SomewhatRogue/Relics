// The world's effects and floor hazards in 2.5D on a phone (DECISIONS 2026-11-06): smoke and steam,
// oil (lit and not) with a goblin in it and a telegraph across it, poison, a snare, a keg about to go,
// round telegraphs' signs (net, oil pot, torch), a frozen and a netted goblin, and the Staithe's oil
// burning on the water with the skimmer's pour coming. The sim is held still for each shot.
// Usage: node scripts/fx3d-look.cjs [url] [outdir] [tag]
const { chromium } = require('playwright');
const { nets } = require('./staithe/target.json');
const url = process.argv[2] || 'http://localhost:4581/?hero=ROGUE';
const out = process.argv[3] || 'shots';
const tag = process.argv[4] || 'after';
const NOON = 2400000 * 700 + 1200000;
const PHONE = { viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true };

/** An attack held part way through its wind-up. */
const atk = (kind, x, y, r, k) => ({ kind, t: 0.9 * k, windup: 0.9, active: 0.2, recover: 0.5, dmg: 1, knock: 0, unblockable: false, dx: 1, dy: 0, ox: x, oy: y, range: r, arc: 360, cx: x, cy: y, radius: r, done: false });

async function job(page) {
  await page.goto(url + '&look=3d');
  await page.waitForFunction(() => window.__game && window.__fx);
  await page.evaluate((ms) => { Date.now = () => ms; }, NOON);
  await page.evaluate(async () => {
    const g = window.__game, wait = (ms) => new Promise((r) => setTimeout(r, ms));
    g.startJob(g.jobs()[1]);
    await wait(300);
  });
}

async function scene(page, what) {
  return page.evaluate(({ what, atkSrc }) => {
    const atk = eval(atkSrc), g = window.__game, r = g.room, h = g.hero;
    const live = r.enemies.filter((e) => e.kind === 'goblin' || e.kind === 'grunt' || e.act !== 'dead').slice(0, 4);
    for (const e of r.enemies) if (!live.includes(e)) Object.assign(e, { x: 1, y: 1, hp: 0, act: 'dead', respawns: false });
    const cx = Math.min(Math.max(h.x, 6), r.map.w - 6), cy = Math.min(Math.max(h.y, 5), r.map.h - 4);
    Object.assign(h, { x: cx, y: cy, hp: 9999, maxHp: 9999, act: 'idle', fx: 0, fy: 1 });
    const put = (e, x, y, o = {}) => Object.assign(e, { x, y, hp: 5, maxHp: 10, act: 'idle', alert: false, attack: undefined, cooldown: 99, ...o });
    r.smokes.length = 0; r.slicks = []; r.puddles = []; r.snares.length = 0;
    const t = r.time;
    if (what === 'smoke') {
      r.smokes.push({ x: cx + 2.2, y: cy - 1, until: t + 9 });
      r.smokes.push({ x: cx - 2.4, y: cy + 0.5, until: t + 9, r: 1.6, steam: true });
      if (live[0]) put(live[0], cx + 2.2, cy - 0.9);
      if (live[1]) put(live[1], cx + 3.8, cy - 2.6, { act: 'attack', attack: atk('slam', cx + 3.2, cy - 1.6, 1.3, 0.6) });
      if (live[2]) put(live[2], cx - 2.2, cy + 0.6);
    } else {
      r.slicks.push({ id: 801, x: cx + 2.2, y: cy - 1.4, r: 1.2, until: t + 60, lit: t, burn: 30 });
      r.slicks.push({ id: 802, x: cx - 2.4, y: cy - 1.6, r: 1.1, until: t + 60, lit: -1 });
      r.puddles.push({ id: 803, x: cx - 2.2, y: cy + 1.9, r: 1.0, until: t + 9 });
      r.snares.push({ owner: h.id, x: cx + 0.2, y: cy + 1.6, until: t + 30 });
      if (live[0]) put(live[0], cx + 2.4, cy - 1.2);
      if (live[1]) put(live[1], cx + 4.2, cy - 0.2, { act: 'attack', attack: atk('net', cx + 3.0, cy - 0.6, 1.1, 0.7) });
      if (live[2]) put(live[2], cx - 1.0, cy - 2.8, { frozenUntil: t + 30 });
      if (live[3]) put(live[3], cx + 2.6, cy + 2.4, { snareUntil: t + 30, act: 'attack', attack: atk('torch', cx + 1.8, cy + 2.0, 0.9, 0.85) });
      const d = r.enemies.find((e) => !live.includes(e));
      if (d) Object.assign(d, { x: cx - 3.6, y: cy + 0.2, act: 'dead', hp: 0, blast: { k: 'keg', x: cx - 3.6, y: cy + 0.2, r: 1.5, at: t + 1.2 } });
    }
    g.step = () => [];
    for (const q of r.heroes) r.prev.set('h:' + q.id, [q.x, q.y]);
    for (const e of r.enemies) r.prev.set('e:' + e.id, [e.x, e.y]);
    return { live: live.length, map: r.map.name };
  }, { what, atkSrc: atk.toString() });
}

async function staithe(page) {
  await page.goto('http://localhost:4581/?hero=WARRIOR&look=3d');
  await page.waitForFunction(() => window.__game && window.__fx);
  await page.evaluate((ms) => { Date.now = () => ms; }, NOON);
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
  }, nets);
  return page.evaluate(({ atkSrc }) => {
    const atk = eval(atkSrc), g = window.__game, r = g.room, fx = window.__fx, st = r.map.staithe, h = g.hero;
    if (!st) return null;
    const step = (n) => { for (let i = 0; i < n; i++) { r.step(); for (const ev of r.events) fx.on(ev); } };
    const [ax, ay] = st.across, [dx, dy] = st.down;
    Object.assign(h, { x: st.ring.x - ax * 1.5 - dx * 2, y: st.ring.y - ay * 1.5 - dy * 2, fx: ax, fy: ay, hp: 9999, maxHp: 9999 });
    for (const e of r.enemies) if (e.variant !== 'skimmer' && e.variant !== 'log') Object.assign(e, { cooldown: 99 });
    r.slicks.push({ id: 901, x: st.pour[0], y: st.pour[1], r: 1.1, until: r.time + 60, lit: r.time, burn: 30, drift: [dx * 0.42, dy * 0.42] });
    r.slicks.push({ id: 902, x: st.pour[0] + ax * 2.2, y: st.pour[1] + ay * 2.2, r: 1.1, until: r.time + 60, lit: -1, drift: [dx * 0.42, dy * 0.42] });
    step(40);
    const sk = r.enemies.find((e) => e.variant === 'skimmer');
    if (sk) Object.assign(sk, { act: 'attack', alert: true, attack: atk('pour', st.pour[0] + ax * 1.6 + dx * 1.2, st.pour[1] + ay * 1.6 + dy * 1.2, 1.2, 0.8) });
    g.step = () => [];
    for (const q of r.heroes) r.prev.set('h:' + q.id, [q.x, q.y]);
    for (const e of r.enemies) r.prev.set('e:' + e.id, [e.x, e.y]);
    return { slicks: r.slicks.length, skimmer: !!sk };
  }, { atkSrc: atk.toString() });
}

(async () => {
  const browser = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const errors = [], ctx = await browser.newContext(PHONE), page = await ctx.newPage();
  page.on('pageerror', (e) => errors.push(String(e)));
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  for (const what of ['smoke', 'floor']) {
    await job(page);
    console.log(what, JSON.stringify(await scene(page, what)));
    await page.waitForTimeout(1500);
    await page.screenshot({ path: `${out}/fx3d-${what}-${tag}.png` });
  }
  console.log('water', JSON.stringify(await staithe(page)));
  await page.waitForTimeout(1500);
  await page.screenshot({ path: `${out}/fx3d-water-${tag}.png` });
  console.log(errors.length ? 'ERRORS ' + JSON.stringify(errors.slice(0, 5)) : 'no page errors');
  await browser.close();
})();
