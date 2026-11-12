// THE LEECHMAN on a phone (docs/design/deep-layer-bosses.md section 2): idle in the shallows, THE LINE cast, a handful of
// leeches in flight and on a hero, the peat slab and its mud, the windlass held and the drained mud, phase 2's wider
// water with a log laid, the Leechman in the water off a log. The room is stepped by hand (the page's own step is stopped)
// so each shot is the exact moment. Usage: node scripts/leech-look.cjs [url] [outdir]
const { chromium } = require('playwright');
const url = process.argv[2] || 'http://localhost:4173/';
const out = process.argv[3] || 'shots';

(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  await page.goto(`${url}?hero=WARRIOR`);
  await page.waitForFunction(() => window.__game && window.__game.mode === 'town', null, { timeout: 20000 });
  const where = await page.evaluate(() => {
    const g = window.__game;
    g.enterDeep();
    g.profile.deep.floor = 14;
    g.descend();
    const r = g.room, NO = { mx: 0, my: 0, ax: 0, ay: 0, attack: false, block: false, attackSeq: 0, blockSeq: 0, rollSeq: 0, weaponSeq: 0, relicSeq: 0, relicSwapSeq: 0, relicPickSeq: 0, relicPick: 0, augmentSeq: 0, classSeq: 0, grabSeq: 0, takeSeq: 0, take: 0, gearSeq: 0, gearOp: 0, gearArg: 0, potionSeq: 0, beltSeq: 0, openSeq: 0, open: 0, reload: false, reloadSeq: 0 };
    const fx = window.__fx, L = () => r.enemies.find((e) => e.boss?.who === 'leechman');
    const lk = (window.__lk = { r, fx, NO, L, grab: 0 });
    // Stepped by hand, events to the effects; stops when `until` says so (or after `max` seconds).
    lk.run = (secs, until, intent) => { const t0 = r.time; for (let i = 0; r.time - t0 < secs && i < 4000; i++) { if (until && until()) return true; r.setIntent(g.hero.id, { ...NO, ...(intent || {}), grabSeq: lk.grab }); r.step(); for (const ev of r.events) fx.on(ev); } return until ? until() : true; };
    lk.force = (move, phase, boss, hero) => {
      const h = L(), base = { 1: ['line', 'leeches', 'wade', 'peat', 'line', 'leeches'], 2: ['line', 'leeches', 'peat', 'wade', 'line', 'peat', 'leeches', 'line'] }[phase];
      const rot = [...base], n = rot.length, i0 = (((r.bosses.swaps[phase - 1] ?? 0) % n) + n) % n;
      for (let k = 0; k < n; k++) { const i = (i0 + k) % n, j = (i + 1) % n; if (rot[i] === rot[j]) continue; [rot[i], rot[j]] = [rot[j], rot[i]]; break; }
      Object.assign(h, { x: boss[0], y: boss[1], fx: 0, fy: 1, alert: true, attack: null, act: 'chase', actT: 0, cooldown: 0, kvx: 0, kvy: 0 });
      Object.assign(h.boss, { phase, rot: rot.indexOf(move), rotAt: r.time, stagUntil: -9, downUntil: -9, roarUntil: -9 });
      Object.assign(g.hero, { x: hero[0], y: hero[1], hp: 9999, maxHp: 9999, safeT: 0 });
      r.bosses.started = r.bosses.started < 0 ? r.time : r.bosses.started;
      r.bosses.phase = phase;
      lk.nextAddsOff();
    };
    lk.nextAddsOff = () => { r.enemies.splice(0, r.enemies.length, ...r.enemies.filter((e) => e.boss)); };
    lk.at = (move, k) => lk.run(9, () => { const a = L().attack; return !!a && L().boss.cmove === move && a.t >= a.windup * k; });
    lk.until = (move, secs) => lk.run(9, () => { const a = L().attack; return !!a && L().boss.cmove === move && a.t >= secs; });
    g.step = () => [];
    return [g.run.job.floor, r.enemies.some((e) => e.boss?.who === 'leechman')];
  });
  console.log('floor, leechman:', where);
  await page.waitForTimeout(900);
  const shot = async (name) => { await page.waitForTimeout(260); await page.screenshot({ path: `${out}/leech-${name}.png` }); console.log(name); };
  const P = (fn, arg) => page.evaluate(fn, arg);

  // Idle in the shallows.
  await P(() => { const lk = window.__lk, h = lk.L(); Object.assign(window.__game.hero, { x: 6, y: 9.4 }); Object.assign(h, { x: 6, y: 6.2, fx: 0, fy: 1, alert: false, cooldown: 99 }); lk.nextAddsOff(); });
  await shot('idle');
  // THE LINE: the whirl, then the cast flying down the lane.
  await P(() => { const lk = window.__lk; lk.force('line', 1, [6, 5.2], [6, 10]); lk.run(0.1); });
  console.log('whirl', await P(() => window.__lk.at('line', 0.8)));
  await shot('line-whirl');
  console.log('cast', await P(() => { const lk = window.__lk, h = lk.L(); return lk.run(3, () => h.attack && h.attack.t >= h.attack.windup + 0.06); }));
  await shot('line-cast');
  // The haul and the punish.
  await P(() => { const lk = window.__lk; lk.run(0.5, () => lk.L().boss.cmove === 'punish' && lk.L().attack && lk.L().attack.t > 0.2); });
  await shot('haul-punish');
  // Leeches: flung, and on the hero.
  await P(() => { const lk = window.__lk; lk.run(1.5); lk.force('leeches', 1, [6, 5.4], [6, 10]); });
  await P(() => window.__lk.at('leeches', 0.25));
  await shot('leeches-pluck');
  await P(() => { const lk = window.__lk, h = lk.L(); lk.run(3, () => h.attack && h.attack.t >= h.attack.windup - 0.18); });
  await shot('leeches-flung');
  await P(() => { const lk = window.__lk, h = lk.L(); lk.run(3, () => h.attack && h.attack.t >= h.attack.windup + 0.1); lk.run(1.1); });
  await shot('leeches-on-hero');
  // Peat: lifted, flying, and the mud it leaves.
  await P(() => { const lk = window.__lk; lk.run(0.2, null, { mx: 0, my: 0, attack: false }); lk.force('peat', 1, [6, 4.2], [6, 10.6]); });
  await P(() => window.__lk.at('peat', 0.62));
  await shot('peat-lift');
  await P(() => { const lk = window.__lk, h = lk.L(); lk.run(3, () => h.attack && h.attack.t >= h.attack.windup - 0.17); });
  await shot('peat-slab');
  await P(() => { const lk = window.__lk, h = lk.L(); lk.run(3, () => h.attack && h.attack.t >= h.attack.windup + 0.06); lk.run(0.35); });
  await shot('peat-mud');
  // The wade-in blow.
  await P(() => { const lk = window.__lk; lk.run(1.2); lk.force('wade', 1, [6, 6], [6, 8]); });
  await P(() => { const lk = window.__lk, h = lk.L(); lk.run(3, () => h.attack && h.attack.t >= h.attack.windup + 0.05); });
  await shot('wade-swing');
  // The windlass: taken, turning, and the shallows drained.
  await P(() => {
    const lk = window.__lk, h = lk.L();
    lk.run(2);
    Object.assign(h, { x: 5, y: 5.5, attack: null, cooldown: 99, act: 'chase' });
    Object.assign(h.boss, { roarUntil: 1e9 });
    Object.assign(window.__game.hero, { x: 1.9, y: 7.2, fx: -1, fy: 0, hp: 9999 });
    lk.run(0.3);
    lk.grab++; lk.run(0.2);
  });
  await P(() => window.__lk.run(2.4));
  await shot('windlass-held');
  await P(() => { const lk = window.__lk; lk.run(4, () => lk.r.map.drained); });
  await page.waitForTimeout(400);
  await shot('drained-gurgle');
  await page.waitForTimeout(1800);
  await P(() => { const lk = window.__lk, h = lk.L(); Object.assign(h, { x: 4.6, y: 6.3, fx: 1, fy: 0 }); Object.assign(h.boss, { roarUntil: -9 }); lk.run(0.1); });
  await shot('drained-mud-crawl');
  // The water comes back and the windlass is stuck.
  await P(() => { const lk = window.__lk; lk.run(14, () => !lk.r.map.drained); lk.run(0.4); lk.grab++; lk.run(0.3); });
  await shot('windlass-stuck');
  // Phase 2: the water rises; a log laid across a channel; the Leechman off it.
  await P(() => {
    const lk = window.__lk, h = lk.L();
    Object.assign(h.boss, { roarUntil: -9 });
    Object.assign(h, { x: 6, y: 7.2, hp: Math.floor(h.maxHp * 0.49), attack: null, cooldown: 0, alert: true });
    lk.run(0.1);
  });
  await P(() => window.__lk.run(0.1));
  await shot('phase2-flood');
  console.log('log setup', await P(() => {
    const lk = window.__lk, h = lk.L(), r = lk.r;
    lk.force('wade', 2, [5.4, 7.2], [0.8, 7.2]);
    h.boss.flood = true; h.hp = Math.floor(h.maxHp * 0.45);
    lk.run(10, () => r.props.some((p) => p.kind === 'log'));
    lk.run(0.6);
    return [r.props.map((p) => p.kind).join(), r.map.water.filter((w) => w.deep).map((w) => Math.round(w.w * 10) / 10).join(), h.boss.phase, h.x, h.y];
  }));
  await shot('log-laid');
  // Knocked in: the Leechman on the log goes into the water.
  await P(() => {
    const lk = window.__lk, h = lk.L(), r = lk.r, west = r.map.water.find((w) => w.deep), lg = r.props.find((p) => p.kind === 'log');
    const cy = lg ? lg.y : 7.5;
    Object.assign(h, { x: west.x + west.w / 2, y: cy, cooldown: 99, attack: null, act: 'chase' });
    Object.assign(window.__game.hero, { x: west.x - 0.3, y: cy, fx: 1, fy: 0, hp: 9999 });
    let n = 0;
    lk.run(2, () => !r.props.some((p) => p.kind === 'log'), { ax: 1, ay: 0, attackSeq: (n += 1) < 3 ? 1 : 2 });
    lk.run(0.35);
  });
  await shot('in-the-water');
  await P(() => window.__lk.run(0.9));
  await shot('in-the-water-2');
  await P(() => { const lk = window.__lk; lk.run(3, () => lk.L().boss.downUntil <= lk.r.time); lk.run(0.35); });
  await shot('hauled-out');
  console.log('errors:', errors.length ? errors.slice(0, 5) : 'none');
  await browser.close();
})();
