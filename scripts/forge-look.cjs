// Halvard's forge on a phone (Kyle, 2026-11-06): a worn weapon at +3 with NOW and AFTER, its pips and
// the price on the one button (STRIKE IT TO +4); a ring and armor the same; a piece at +5; and an item
// card at +3 off the pack. node scripts/forge-look.cjs [url] [outdir]
const { chromium } = require('playwright');
const url = process.argv[2] || 'http://localhost:4173/';
const out = process.argv[3] || 'shots/forge';
(async () => {
  require('fs').mkdirSync(out, { recursive: true });
  const browser = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  const shot = (n) => page.screenshot({ path: `${out}/phone-${n}.png` });
  const skip = async () => { for (let i = 0; i < 5; i++) await page.evaluate(() => document.querySelector('#panel .body')?.click()), await page.waitForTimeout(60); };
  const open = async (id, arg = 0) => { await page.evaluate(([i, a]) => { window.__panel.hide(); window.__openSpot(i, a); }, [id, arg]); await skip(); };
  const tap = async (sel) => { await page.click(sel); await page.waitForTimeout(200); };
  const scroll = async () => { await page.evaluate(() => document.querySelector('#panel .spop .pa')?.scrollTo(0, 9999)); await page.waitForTimeout(100); };

  await page.goto(`${url}?hero=WARRIOR`);
  await page.waitForFunction(() => typeof window.render_game_to_text === 'function', null, { timeout: 180000 });
  await page.waitForTimeout(600);
  await page.evaluate(() => {
    const g = window.__game, p = g.profile, k = p.weapon;
    const w = { slot: 'weapon', kit: k, quality: 'forged', traits: [], mods: [{ id: 'quick', v: 0.08 }, { id: 'reach', v: 0.07 }], level: 3 };
    const r = { slot: 'ring', quality: 'fine', traits: [], mods: [{ id: 'crit', v: 0.05 }], level: 3 };
    const a = { slot: 'armor', armor: 'heavy', quality: 'forged', traits: [], mods: [{ id: 'guard', v: 0.12 }, { id: 'health', v: 10 }], level: 1 };
    Object.assign(p, { gold: 1400, steel: 40 });
    p.arms[k] = w; g.hero.arms[k] = w;
    p.armor = a; g.hero.armor = a;
    p.rings = [r]; g.hero.rings = [r];
    p.bag.push({ ...w, kit: 'spear', mods: [{ id: 'quick', v: 0.08 }, { id: 'knock', v: 0.1 }] });
    g.hero.bag = [...p.bag];
  });

  await open('smith');
  await shot('forge');
  await tap('#panel [data-src="worn:0"]');
  await shot('forge-weapon-plus3');
  await scroll();
  await shot('forge-weapon-plus3-foot');
  await page.click('#panel .spop [data-shut]');
  await tap('#panel [data-src="worn:1"]');
  await shot('forge-armor-plus1');
  await page.click('#panel .spop [data-shut]');
  await tap('#panel [data-src="worn:2"]');
  await shot('forge-ring-plus3');
  await page.click('#panel .spop [data-shut]');
  // At +5: the numbers alone, no button.
  await page.evaluate(() => { const g = window.__game, k = g.profile.weapon, w = { ...g.profile.arms[k], level: 5 }; g.profile.arms[k] = w; g.hero.arms[k] = w; });
  await open('smith');
  await tap('#panel [data-src="worn:0"]');
  await shot('forge-weapon-plus5');
  await page.click('#panel .spop [data-shut]');

  // An item card at +3, off the pack at Tobin's.
  await open('merchant');
  const at = await page.evaluate(() => window.__game.profile.bag.findIndex((i) => i.kit === 'spear' && i.level === 3));
  await page.evaluate(() => document.querySelector('#panel .card').scrollTo(0, 9999));
  await tap(`#panel [data-src="bag:${at}"]`);
  await shot('item-card-plus3');

  console.log('errors', JSON.stringify(errors));
  await browser.close();
})();
