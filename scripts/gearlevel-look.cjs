// The Gear chat's phone shots (docs/design/gear-levels.md): the pack with levelled pieces, and a card
// showing LV 7 +2, the renamed modifiers and their lines. node scripts/gearlevel-look.cjs [tag]
const { chromium } = require('playwright');
const tag = process.argv[2] || 'now';
(async () => {
  const browser = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true });
  const page = await ctx.newPage(); const errors = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  await page.goto(process.env.URL || 'http://localhost:4173/?hero=WARRIOR');
  await page.waitForFunction(() => typeof window.__openSpot === 'function' && window.__game);
  await page.waitForTimeout(800);
  await page.evaluate(() => {
    const g = window.__game, p = g.profile;
    p.bag = [
      { slot: 'weapon', kit: 'greatsword', quality: 'tolmouth', traits: ['crushing'], mods: [{ id: 'draw', v: 0.161 }, { id: 'arc', v: 0.27 }], level: 2, ilvl: 7 },
      { slot: 'ring', quality: 'touched', traits: [], mods: [{ id: 'damage', v: 0.13 }, { id: 'crit', v: 0.11 }, { id: 'health', v: 30 }], cost: { id: 'slow', v: 0.09 }, level: 0, ilvl: 9 },
      { slot: 'armor', armor: 'heavy', quality: 'forged', traits: [], mods: [{ id: 'guard', v: 0.14 }, { id: 'tough', v: 0.08 }], level: 1 },
    ];
    p.armor = { slot: 'armor', armor: 'heavy', quality: 'fine', traits: [], mods: [{ id: 'health', v: 22 }], ilvl: 3 };
    p.rings = [{ slot: 'ring', quality: 'fine', traits: [], mods: [{ id: 'focus', v: 0.16 }], ilvl: 2 }];
    try { localStorage.setItem('relic.packHint', '1'); } catch {}
    for (const x of [g.hero, ...g.room.heroes]) Object.assign(x, { bag: [...p.bag], armor: p.armor, rings: [...p.rings] });
  });
  await page.waitForTimeout(300);
  await page.evaluate(() => document.getElementById('packbtn').click());
  await page.waitForTimeout(800);
  await page.screenshot({ path: `shots/gear-${tag}-pack.png` });
  for (let i = 0; i < 2; i++) {
    // The pack draws itself again on a tap, so each tile is found afresh.
    const t = (await page.$$('#pack .bag .tile[data-src]'))[i];
    if (!t) break;
    await t.click(); await page.waitForTimeout(500);
    await page.screenshot({ path: `shots/gear-${tag}-card${i}.png` });
  }
  console.log('errors', JSON.stringify(errors)); await browser.close();
})();
