// Hempen in the boss format on a phone (docs/plans/bosses.md rollout item 5): its ground in Hangman's Wood
// with the boss plate up, a telegraphed noose lane held part way wound up, and the stagger after a BRACED
// block fills its POISE. Usage: node scripts/hempen-look.cjs [url] [outdir] [look: flat | 3d]
const { chromium } = require('playwright');
const url = process.argv[2] || 'http://localhost:4501/';
const out = process.argv[3] || 'shots';
const look = process.argv[4] || 'flat';

(async () => {
  const browser = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  await page.goto(`${url}?hero=WARRIOR&wood=1&look=${look}`);
  await page.waitForFunction(() => window.__game && window.__game.room && window.__game.room.map.name === "HANGMAN'S WOOD", null, { timeout: 30000 });
  await page.waitForTimeout(800);
  const state = () => page.evaluate(() => {
    const r = window.__game.room, e = r.enemies.find((x) => x.boss), b = e.boss, a = e.attack;
    const plate = document.getElementById('boss');
    return `HEMPEN ${e.act}${a ? ' ' + a.boss + ' t ' + a.t.toFixed(2) + '/' + a.windup.toFixed(2) + ' range ' + a.range : ''} hp ${Math.round(e.hp)}/${e.maxHp} poise ${b.poise}/${b.poiseMax} phase ${b.phase} stag ${b.stagUntil > r.time} ropes ${(b.ropes || []).length} || plate ${!plate.hidden} "${plate.textContent}"`;
  });
  // Hempen's ground, the rest of the wood's goblins gone (for a clean look), the hero south of it.
  const HM = { x: 62, y: 9 };
  const setUp = (dy) => page.evaluate(([hm, dy]) => {
    const g = window.__game, r = g.room, e = r.enemies.find((x) => x.boss);
    r.enemies = r.enemies.filter((x) => x.boss);
    Object.assign(e, { x: hm.x, y: hm.y, fx: 0, fy: 1, kvx: 0, kvy: 0, attack: null, act: 'chase', actT: 0, alert: true });
    Object.assign(g.hero, { x: hm.x, y: hm.y + dy, fx: 0, fy: -1, hp: g.hero.maxHp, kvx: 0, kvy: 0, act: 'idle', actT: 0 });
  }, [HM, dy]);

  // 1. The fight on its ground, the plate up (HEMPEN, its two phase pips, the POISE bar).
  await setUp(2.4);
  await page.waitForTimeout(1500);
  await page.evaluate(() => { const h = window.__game.hero; h.hp = h.maxHp; });
  await page.screenshot({ path: `${out}/hempen-plate-phone.png` });
  console.log('plate:', await state());

  // 2. The noose: the hero 4.2 off, the noose due; its thin red lane held part way wound up.
  await setUp(4.2);
  await page.evaluate(() => { const e = window.__game.room.enemies.find((x) => x.boss); e.snareAt = -99; e.cooldown = 0; });
  await page.waitForFunction(() => window.__game.room.enemies.some((e) => e.attack && e.attack.boss === 'noose'), null, { timeout: 8000 });
  await page.evaluate(() => {
    const g = window.__game, e = g.room.enemies.find((x) => x.boss), at = [e.x, e.y], h = g.hero, hat = [h.x, h.y];
    clearInterval(window.__hold);
    window.__hold = setInterval(() => {
      Object.assign(e, { x: at[0], y: at[1], kvx: 0, kvy: 0 });
      Object.assign(h, { x: hat[0], y: hat[1], hp: h.maxHp });
      if (e.attack) e.attack.t = 0.75;
    }, 10);
  });
  await page.waitForTimeout(400);
  await page.screenshot({ path: `${out}/hempen-noose-phone.png` });
  console.log('noose:', await state());
  await page.evaluate(() => clearInterval(window.__hold));

  // 3. The stagger: POISE nearly full, the Warrior holds a block in its face; a BRACED cleave fills it.
  await setUp(1.9);
  await page.evaluate(() => {
    const e = window.__game.room.enemies.find((x) => x.boss);
    Object.assign(e.boss, { poise: e.boss.poiseMax - 5, rot: 0, rotAt: window.__game.room.time });
    e.cooldown = 0;
    window.__keep = setInterval(() => { const h = window.__game.hero; h.hp = h.maxHp; h.stamina = 100; }, 50);
  });
  await page.keyboard.down('k');
  await page.waitForFunction(() => { const r = window.__game.room, e = r.enemies.find((x) => x.boss); return e.boss.stagUntil > r.time; }, null, { timeout: 15000 }).catch(() => console.log('no stagger in time'));
  await page.waitForTimeout(350);
  await page.screenshot({ path: `${out}/hempen-stagger-phone.png` });
  console.log('stagger:', await state());
  await page.keyboard.up('k');
  await page.evaluate(() => clearInterval(window.__keep));
  console.log(errors.length ? errors.slice(0, 5) : 'no errors');
  await browser.close();
})();
