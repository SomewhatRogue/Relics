// The Doorkeepers' threat on a phone (docs/design/boss-threat.md step 3), at the Deep's sealed door: the
// vault in the air over its circle, and the ENRAGED quake's circles with the crack running at them.
// Usage: node scripts/doorthreat-look.cjs [url] [outdir]
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
    for (const n of [4, 9]) {
      g.profile.deep.floor = n;
      g.descend();
      if (g.room.enemies.some((e) => e.name === 'HASP')) return g.run.job.floor;
      g.profile.deep.floor = n;
    }
    return 0;
  });
  console.log('Doorkeepers floor:', where);
  await page.waitForTimeout(800);
  const force = (move, phase, at, heroAt) => page.evaluate(({ move, phase, at, heroAt }) => {
    const g = window.__game, r = g.room, e = r.enemies.find((x) => x.name === 'HASP'), w = r.enemies.find((x) => x.name === 'LATCH'), me = g.hero;
    const R = { 1: ['jab', 'sweep', 'bash', 'jab', 'vault', 'jab', 'charge', 'jab', 'sweep', 'bash', 'jab', 'charge'], 2: ['jab', 'spin', 'jab', 'quake', 'jab', 'spin', 'jab', 'sweep', 'bash', 'jab', 'spin', 'vault', 'jab', 'spin', 'jab', 'spin'] };
    const rot = [...R[phase]], sw = r.bosses.swaps[phase - 1], i = ((sw % rot.length) + rot.length) % rot.length, j = (i + 1) % rot.length;
    [rot[i], rot[j]] = [rot[j], rot[i]];
    if (phase === 2) Object.assign(w, { hp: 0, act: 'dead' }), (r.bosses.phase = 2);
    else w.boss.openUntil = 1e9;
    Object.assign(e, { x: at[0], y: at[1], fx: 0, fy: 1, alert: true, attack: null, act: 'chase', actT: 0, cooldown: 0, kvx: 0, kvy: 0 });
    Object.assign(e.boss, { job: 'move', phase, rot: rot.indexOf(move), rotAt: r.time, roarUntil: -9, openUntil: -9 });
    Object.assign(me, { x: heroAt[0], y: heroAt[1], hp: me.maxHp, safeT: 0 });
    if (r.bosses.started < 0) r.bosses.started = r.time;
    r.bosses.swapAt = r.time + 99;
  }, { move, phase, at, heroAt });
  const at = (move, k) => page.waitForFunction(({ move, k }) => {
    const e = window.__game.room.enemies.find((x) => x.name === 'HASP'), a = e?.attack;
    return !!a && a.boss === move && a.t >= a.windup * k;
  }, { move, k }, { timeout: 8000 }).then(() => true, () => false);
  const shot = async (name) => { await page.screenshot({ path: `${out}/door-${name}.png` }); console.log(name); };
  const m = await page.evaluate(() => [window.__game.room.map.w, window.__game.room.map.h]);
  await force('vault', 1, [m[0] / 2 + 3, m[1] / 2 - 2], [m[0] / 2 - 2, m[1] / 2 + 1.5]);
  if (await at('vault', 0.5)) await shot('vault-crouch');
  if (await at('vault', 0.8)) await shot('vault-air');
  await force('quake', 2, [m[0] / 2, m[1] / 2 - 3], [m[0] / 2 + 0.3, m[1] / 2 + 2]);
  if (await at('quake', 0.75)) await shot('quake');
  await page.waitForTimeout(450);
  await shot('quake-burst');
  console.log('errors:', errors.length ? errors.slice(0, 5) : 'none');
  await browser.close();
})();
