// The UI chat's phone shots of the pack (docs/design/ui-look.md): a fuller hero (three pieces in the bag,
// armor, a ring, a second relic on the shelf), the pack, a piece's card, and KNACKS.
// node scripts/iron-pack.cjs [tag]
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
    const g = window.__game, p = g.profile, h = p; // town gear lives on the profile
    h.bag = [
      { slot: 'weapon', kit: 'spear', quality: 'fine', traits: [], mods: [{ id: 'reach', v: 0.1 }], level: 1 },
      { slot: 'armor', armor: 'medium', quality: 'forged', traits: [], mods: [{ id: 'tough', v: 0.1 }] },
      { slot: 'ring', quality: 'tolmouth', traits: [], mods: [{ id: 'health', v: 20 }], unique: 'cartlink' },
    ];
    h.armor = { slot: 'armor', armor: 'light', quality: 'plain', traits: [] };
    h.rings = [{ slot: 'ring', quality: 'fine', traits: [], mods: [{ id: 'crit', v: 0.05 }] }];
    if (p.relics?.length) p.relics.push({ ...p.relics[0], id: p.relics[0].id + 'b' });
    p.picks = 1;
    try { localStorage.setItem('relic.packHint', '1'); } catch {}
    g.relicsChanged?.();
    for (const x of [g.hero, ...g.room.heroes]) Object.assign(x, { bag: [...p.bag], armor: p.armor, rings: [...p.rings] });
  });
  await page.waitForTimeout(300);
  await page.evaluate(() => document.getElementById('packbtn').click());
  await page.waitForTimeout(800);
  await page.screenshot({ path: `shots/ui-${tag}-pack.png` });
  const t = await page.$('#pack .bag .tile[data-src]');
  if (t) { await t.click(); await page.waitForTimeout(500); await page.screenshot({ path: `shots/ui-${tag}-pack-card.png` }); }
  const k = await page.$('#pack [data-tree]');
  if (k) { await k.click(); await page.waitForTimeout(600); await page.screenshot({ path: `shots/ui-${tag}-pack-knacks.png` }); }
  console.log('errors', JSON.stringify(errors)); await browser.close();
})();
