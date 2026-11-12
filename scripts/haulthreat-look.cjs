// The Haulier's threat moves on a phone (docs/design/boss-threat.md step 3): crouched to leap, in the air,
// the crank with its chain and sparks coming down, burning floor, and the wrench. Usage:
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
    for (const n of [4, 9]) {
      g.profile.deep.floor = n;
      g.descend();
      if (g.room.enemies.some((e) => e.boss?.who === 'haulier')) return g.run.job.floor;
      g.profile.deep.floor = n;
    }
    return 0;
  });
  console.log('Haulier floor:', where);
  await page.waitForTimeout(800);
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
  // Holding a cart, aiming it at the Haulier (the dotted arrow out to where it'll stop).
  await page.evaluate(() => {
    const g = window.__game, r = g.room, h = r.enemies.find((e) => e.boss?.who === 'haulier'), me = g.hero;
    const c = r.props.find((p) => p.kind === 'cart' && !p.roll);
    Object.assign(h, { x: c.x + 5, y: c.y - 2, attack: null, act: 'chase' });
    Object.assign(h.boss, { roarUntil: 1e9, phase: 1 });
    Object.assign(me, { x: c.x - 1, y: c.y + 0.2, hp: me.maxHp });
    c.heldBy = me.id;
  });
  await page.mouse.move(330, 380);
  await page.waitForTimeout(600);
  await shot('cart-aim');
  console.log('errors:', errors.length ? errors.slice(0, 5) : 'none');
  await browser.close();
})();
