// The Haulier's threat moves on a phone (docs/design/boss-threat.md step 3): crouched to leap, in the air,
// the crank with its chain and sparks coming down, burning floor, the wrench; and the carts (2026-11-12): the room's
// tracks, a track's warning and lane, a cart bursting out of a mouth, one hitting the Haulier, the HURL. Usage:
// node scripts/haulthreat-look.cjs [url] [outdir]
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
  // Down to a Haulier floor (5, else 10: boss floors take turns by the run's seed).
  const where = await page.evaluate(() => {
    const g = window.__game;
    g.enterDeep();
    for (const n of [4, 9, 14, 19, 24, 29, 34, 39]) {
      g.profile.deep.floor = n;
      g.descend();
      if (g.room.enemies.some((e) => e.boss?.who === 'haulier')) return g.run.job.floor;
      g.profile.deep.floor = n;
    }
    return 0;
  });
  console.log('Haulier floor:', where);
  await page.waitForTimeout(800);
  const shot0 = async (name) => { await page.screenshot({ path: `${out}/haul-${name}.png` }); console.log(name); };
  await shot0('room-tracks');
  const force = (move, phase, heroAt) => page.evaluate(({ move, phase, heroAt }) => {
    const g = window.__game, r = g.room, h = r.enemies.find((e) => e.boss?.who === 'haulier'), me = g.hero;
    const rot = { 1: ['pick', 'overhead', 'pick', 'leap', 'shove', 'crank'], 2: ['leap', 'pick', 'overhead', 'wrench', 'crank', 'drag', 'shove', 'pick'] }[phase];
    const sw = r.bosses.swaps[phase - 1], i = ((sw % rot.length) + rot.length) % rot.length, j = (i + 1) % rot.length;
    [rot[i], rot[j]] = [rot[j], rot[i]];
    Object.assign(h, { x: 11, y: 8.5, fx: -1, fy: 0, alert: true, attack: null, act: 'chase', actT: 0, cooldown: 0, kvx: 0, kvy: 0 });
    Object.assign(h.boss, { phase, rot: rot.indexOf(move), rotAt: r.time, stagUntil: -9, downUntil: -9, roarUntil: -9, bare: phase === 2 });
    Object.assign(me, { x: h.x + heroAt[0], y: h.y + heroAt[1], hp: me.maxHp, safeT: 0 });
    r.bosses.started = r.bosses.started < 0 ? r.time : r.bosses.started;
  }, { move, phase, heroAt });
  const at = (move, k) => page.waitForFunction(({ move, k }) => {
    const h = window.__game.room.enemies.find((e) => e.boss?.who === 'haulier'), a = h?.attack;
    return !!a && h.boss.move === move && a.t >= a.windup * k;
  }, { move, k }, { timeout: 8000 }).then(() => true, () => false);
  const shot = async (name) => { await page.screenshot({ path: `${out}/haul-${name}.png` }); console.log(name); };

  await force('leap', 1, [-5.5, 0.5]);
  if (await at('leap', 0.3)) await shot('leap-crouch');
  if (await at('leap', 0.78)) await shot('leap-air');
  await page.waitForTimeout(300);
  await shot('leap-landed');
  await force('crank', 1, [-3.5, 1]);
  if (await at('crank', 0.75)) await shot('crank');
  await page.waitForTimeout(700);
  await shot('sparks-burning');
  await force('overhead', 2, [-2, 0]);
  if (await at('wrench', 0.3)) await shot('wrench');
  // The carts. Held still for the shots: the Haulier roaring where it stands, the cart slowed once it is out.
  const slow = (speed) => page.evaluate((speed) => { for (const p of window.__game.room.props) if (p.rollBy === 'track') p.roll = Math.sign(p.roll) * speed; }, speed);
  const track = (i, from, at, goIn = 1.6) => page.evaluate(({ i, from, at, goIn }) => {
    const g = window.__game, r = g.room, h = r.enemies.find((e) => e.boss?.who === 'haulier'), me = g.hero;
    Object.assign(h, { x: at[0], y: at[1], attack: null, act: 'chase', cooldown: 99 });
    Object.assign(h.boss, { roarUntil: 1e9, phase: 1, downUntil: -9, stagUntil: -9 });
    h.holdUntil = -9;
    r.bosses.started = r.bosses.started < 0 ? r.time : r.bosses.started;
    Object.assign(me, { x: 6, y: 12.2, hp: me.maxHp, safeT: 0 });
    h.boss.track = { i, from, at: r.time, lane: r.time + goIn - 1, go: r.time + goIn };
  }, { i, from, at, goIn });
  const cartOut = () => page.waitForFunction(() => window.__game.room.props.some((p) => p.rollBy === 'track'), null, { timeout: 5000 }).then(() => true, () => false);
  await track(1, 0, [6.1, 11]);
  await page.waitForTimeout(500);
  await shot('track-warn');
  await page.waitForTimeout(700);
  await shot('track-lane');
  if (await cartOut()) {
    await slow(3.5);
    await page.waitForTimeout(250);
    await shot('cart-burst');
    await slow(5);
    await page.waitForTimeout(500);
    await shot('cart-rolling');
  }
  // A cart hitting the Haulier standing on a track.
  await page.waitForTimeout(3000);
  await track(0, 0, [6, 7.6], 0.5);
  if (await cartOut()) {
    await slow(4);
    await page.waitForFunction(() => { const h = window.__game.room.enemies.find((e) => e.boss?.who === 'haulier'); return h.boss.downUntil > window.__game.room.time; }, null, { timeout: 6000 }).catch(() => {});
    await shot('cart-hits-haulier');
    await page.waitForTimeout(500);
    await shot('haulier-down');
  }
  // The HURL: lifting a siding cart overhead, then the throw.
  await page.waitForTimeout(2500);
  await page.evaluate(() => {
    const g = window.__game, r = g.room, h = r.enemies.find((e) => e.boss?.who === 'haulier'), me = g.hero;
    const rot = ['pick', 'overhead', 'pick', 'leap', 'hurl', 'crank'], sw = r.bosses.swaps[0], i = ((sw % rot.length) + rot.length) % rot.length, j = (i + 1) % rot.length;
    [rot[i], rot[j]] = [rot[j], rot[i]];
    const c = r.props.find((p) => p.kind === 'cart' && !p.roll && !p.heldBy);
    r.bosses.started = r.time;
    Object.assign(h, { x: c.x + 0.8, y: c.y + 0.4, fx: 1, fy: 0, alert: true, attack: null, act: 'chase', cooldown: 0, kvx: 0, kvy: 0 });
    Object.assign(h.boss, { phase: 1, rot: rot.indexOf('hurl'), rotAt: r.time, stagUntil: -9, downUntil: -9, roarUntil: -9, track: undefined });
    h.holdUntil = -9;
    Object.assign(me, { x: Math.min(10, Math.max(2, c.x + 5)), y: 11, hp: me.maxHp, safeT: 0 });
  });
  if (await at('hurl', 0.6)) await shot('hurl-lift');
  if (await at('hurl', 0.97)) await shot('hurl-aimed');
  await page.waitForTimeout(250);
  await shot('hurl-thrown');
  console.log('errors:', errors.length ? errors.slice(0, 5) : 'none');
  await browser.close();
})();
