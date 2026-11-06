// The Doorkeepers on a phone (docs/plans/bosses.md rollout item 2): the great barn with the boss plate,
// a telegraphed pair attack (Locked Doors, its striped lane between them held part way wound up), and the
// sure chest opened at the kill. Usage: node scripts/boss-look.cjs [url] [outdir] [look: flat | 3d]
const { chromium } = require('playwright');
const url = process.argv[2] || 'http://localhost:4441/';
const out = process.argv[3] || 'shots';
const look = process.argv[4] || 'flat';

(async () => {
  const browser = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  await page.goto(`${url}?hero=WARRIOR&barn=arena&look=${look}`);
  await page.waitForFunction(() => window.__game && window.__game.room && window.__game.room.map.name === 'THE GREAT BARN', null, { timeout: 20000 });
  await page.waitForTimeout(500);
  const state = () => page.evaluate(() => {
    const r = window.__game.room;
    return r.enemies.map((e) => `${e.name || e.kind} ${e.act}${e.attack ? ' ' + (e.attack.boss || e.attack.kind) + ' ' + e.attack.t.toFixed(2) : ''} hp ${e.hp} ${e.boss ? e.boss.job + ' poise ' + e.boss.poise : ''}`).join(' | ') + ` || plate ${!document.getElementById('boss').hidden} "${document.getElementById('boss').textContent}"`;
  });

  // 1. The barn: walked in, the pair awake and coming, the plate up.
  await page.evaluate(() => Object.assign(window.__game.hero, { x: 6, y: 9.4, fy: -1 }));
  await page.waitForTimeout(1600);
  await page.evaluate(() => { const h = window.__game.hero; h.hp = h.maxHp; });
  await page.screenshot({ path: `${out}/boss-barn-phone.png` });
  console.log('barn:', await state());

  // 2. Locked Doors: the pair side by side, the hero in front, the shove's striped lane held part way.
  await page.evaluate(() => {
    const g = window.__game, r = g.room, h = g.hero, [latch, hasp] = ['LATCH', 'HASP'].map((n) => r.enemies.find((e) => e.name === n));
    Object.assign(h, { x: 6, y: 8.2, hp: h.maxHp });
    for (const [e, x] of [[latch, 5], [hasp, 7]]) Object.assign(e, { x, y: 5, fx: 0, fy: 1, attack: null, act: 'chase', actT: 0, kvx: 0, kvy: 0, cooldown: 0 });
    Object.assign(latch.boss, { job: 'wall', openUntil: -9, backUntil: -9 }), Object.assign(hasp.boss, { job: 'move', openUntil: -9, backUntil: -9 });
    r.bosses.lockCool = -9, r.bosses.lockBy = -1;
  });
  await page.waitForFunction(() => window.__game.room.enemies.some((e) => e.attack && e.attack.boss === 'lock'), null, { timeout: 8000 });
  await page.evaluate(() => {
    const r = window.__game.room, m = r.enemies.find((e) => e.attack && e.attack.boss === 'lock'), p = r.enemies.find((e) => e.boss && e !== m);
    const at = [[m, m.x, m.y], [p, p.x, p.y]];
    clearInterval(window.__hold);
    window.__hold = setInterval(() => {
      for (const [e, x, y] of at) Object.assign(e, { x, y, kvx: 0, kvy: 0 });
      if (m.attack) m.attack.t = 1.0;
      window.__game.hero.hp = window.__game.hero.maxHp;
    }, 10);
  });
  await page.waitForTimeout(400);
  await page.screenshot({ path: `${out}/boss-lock-phone.png` });
  console.log('lock:', await state());
  await page.evaluate(() => clearInterval(window.__hold));

  // 3. The kill, and the sure chest opened.
  await page.evaluate(() => {
    const g = window.__game, r = g.room;
    for (const e of r.enemies) Object.assign(e, { hp: 0, act: 'dead', actT: 0, attack: null, death: 'fall' });
    Object.assign(g.hero, { x: 6, y: 2.35, fx: 0, fy: -1, hp: g.hero.maxHp });
  });
  await page.waitForTimeout(300);
  await page.keyboard.press('f');
  await page.waitForTimeout(1600);
  // Stood back a step, so the open chest and what came out of it show.
  await page.evaluate(() => Object.assign(window.__game.hero, { x: 4.6, y: 3.9, fx: 1, fy: -0.6 }));
  await page.waitForTimeout(400);
  await page.screenshot({ path: `${out}/boss-chest-phone.png` });
  console.log('chest:', await page.evaluate(() => JSON.stringify(window.__game.room.chests.map((c) => ({ state: c.state, rolls: Object.values(c.rolls).map((l) => l.map((i) => i.quality)), relics: Object.keys(c.relics || {}) })))), 'drops', await page.evaluate(() => window.__game.room.drops.length));
  console.log(errors.length ? errors.slice(0, 5) : 'no errors');
  await browser.close();
})();
