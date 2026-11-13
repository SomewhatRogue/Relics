// The UI chat's phone shots of uncover.ts: in the great barn, (1) the loot roll card up over the fight, the
// camera making room under it; (2) a Doorkeeper walked up under the top panels, which go faint with a notch.
// node scripts/iron-uncover.cjs [tag]
const { chromium } = require('playwright');
const tag = process.argv[2] || 'now';
(async () => {
  const browser = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true });
  const page = await ctx.newPage(); const errors = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  await page.goto((process.env.URL || 'http://localhost:4173/') + '?hero=WARRIOR&barn=arena');
  await page.waitForFunction(() => window.__game && window.__game.room && window.__game.room.map.name === 'THE GREAT BARN', null, { timeout: 20000 });
  await page.evaluate(() => Object.assign(window.__game.hero, { x: 6, y: 9.4, fy: -1 }));
  await page.waitForTimeout(1500);
  const state = () => page.evaluate(() => ({
    faint: [...document.querySelectorAll('.uncovered')].map((e) => e.id || e.className),
    notches: [...document.querySelectorAll('.unotch:not([hidden])')].length,
    hero: window.__views?.heroScreen?.() ?? null,
  }));
  await page.screenshot({ path: `shots/ui-${tag}-uncover-plain.png` });
  console.log('plain', JSON.stringify(await state()));
  // 1. A roll card over the fight.
  await page.evaluate(() => {
    const r = window.__game.room, h = window.__game.hero;
    r.rolls = [{ id: 902, x: h.x + 1, y: h.y, until: r.time + 60, picks: {}, item: { slot: 'ring', quality: 'tolmouth', traits: [], mods: [{ id: 'health', v: 20 }], level: 0, unique: 'cartlink' } }];
  });
  await page.waitForTimeout(1500);
  await page.screenshot({ path: `shots/ui-${tag}-uncover-roll.png` });
  console.log('roll', JSON.stringify(await state()));
  await page.evaluate(() => { window.__game.room.rolls = []; });
  await page.waitForTimeout(800);
  // 2. A Doorkeeper up under the top panels (held there, its attacks off).
  for (let i = 0; i < 6; i++) {
    await page.evaluate(() => { const e = window.__game.room.enemies.find((x) => x.name === 'HASP'); Object.assign(e, { x: 5, y: 1.2, attack: null, act: 'idle', kvx: 0, kvy: 0, cooldown: 9 }); });
    await page.waitForTimeout(80);
  }
  await page.screenshot({ path: `shots/ui-${tag}-uncover-under.png` });
  console.log('under', JSON.stringify(await state()), 'errors', JSON.stringify(errors));
  await browser.close();
})();
