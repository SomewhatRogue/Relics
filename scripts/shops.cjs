// The shops on a phone (Kyle, 2026-11-05): Tobin's stall with his stock and the timer, two class vendors,
// a long item card with the new modifiers and its COMPARE, selling, and the forge's two choices, each
// with its bar of actions at the foot. node scripts/shops.cjs [url] [outdir]
const { chromium } = require('playwright');
const url = process.argv[2] || 'http://localhost:4173/';
const out = process.argv[3] || 'shots';
const LONG = { slot: 'weapon', kit: 'sword', quality: 'turning', traits: ['riposte'], level: 1,
  mods: [{ id: 'arc', v: 0.31 }, { id: 'finisher', v: 0.42 }, { id: 'guard', v: 0.27 }], cost: { id: 'taken', v: 0.14 } };
const PLATE = { slot: 'armor', armor: 'heavy', quality: 'touched', traits: [], level: 0,
  mods: [{ id: 'guard', v: 0.22 }, { id: 'tough', v: 0.15 }, { id: 'health', v: 24 }], cost: { id: 'winded', v: 0.16 } };
(async () => {
  const browser = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  const shot = (n) => page.screenshot({ path: `${out}/phone-${n}.png` });
  const skip = async () => { for (let i = 0; i < 5; i++) await page.evaluate(() => document.querySelector('#panel .body')?.click()), await page.waitForTimeout(60); };
  const open = async (id, arg = 0) => { await page.evaluate(([i, a]) => { window.__panel.hide(); window.__openSpot(i, a); }, [id, arg]); await skip(); };
  const tap = async (sel) => { await page.click(sel); await page.waitForTimeout(150); };

  await page.goto(`${url}?hero=WARRIOR`);
  await page.waitForFunction(() => typeof window.render_game_to_text === 'function', null, { timeout: 180000 }).catch((e) => { console.log('errors', JSON.stringify(errors)); throw e; });
  await page.waitForTimeout(600);
  await page.evaluate(([a, b]) => {
    const g = window.__game;
    g.profile.gold = 2500;
    g.profile.steel = 12;
    g.profile.bag.push(a, b);
    g.hero.bag = [...g.profile.bag];
    try { localStorage.removeItem('relic.compare'); } catch {}
  }, [LONG, PLATE]);

  // Tobin: his stock, the bigger pack, the timer; then a card off his table.
  await open('merchant');
  await shot('pawn');
  await page.evaluate(() => document.querySelector('#panel .card').scrollTo(0, 9999));
  await page.waitForTimeout(100);
  await shot('pawn-sell-grid');
  await tap('#panel [data-src="bag:0"]');
  await shot('pawn-sell-card');
  await page.click('#panel .spop [data-shut]');
  await page.evaluate(() => document.querySelector('#panel .card').scrollTo(0, 0));
  await tap('#panel [data-good="0"]');
  await shot('pawn-good-card');

  // Two class vendors: the Warrior's quartermaster and the Mage's cupboard (as a Warrior: weapons not for you).
  await open('vendor', 0);
  await shot('vendor-warrior');
  await tap('#panel [data-good="0"]');
  await shot('vendor-warrior-card');
  await open('vendor', 3);
  await shot('vendor-mage');
  await tap('#panel [data-good="0"]');
  await shot('vendor-mage-card');
  await open('vendor', 2);
  await shot('vendor-rogue');

  // The long card: a TURNING sword with the new modifiers and its cost, COMPARE off, then on.
  await open('merchant');
  const at = await page.evaluate(() => window.__game.profile.bag.findIndex((i) => i.quality === 'turning'));
  await page.evaluate(() => document.querySelector('#panel .card').scrollTo(0, 9999));
  await tap(`#panel [data-src="bag:${at}"]`);
  await shot('item-card');
  await tap('#panel .spop [data-cmp]');
  await shot('item-card-compare');
  await tap('#panel .spop [data-cmp]');

  // The forge: melt from the pack (only MELT DOWN), and upgrade what you wear (only UPGRADE).
  await open('smith');
  await shot('forge');
  const plate = await page.evaluate(() => window.__game.profile.bag.findIndex((i) => i.quality === 'touched'));
  await tap(`#panel [data-src="bag:${plate}"]`);
  await shot('forge-melt-card');
  await page.click('#panel .spop [data-shut]');
  await tap('#panel [data-src="worn:0"]');
  await shot('forge-upgrade-card');

  // The vault: one action on the card.
  await open('bank');
  await tap('#panel [data-src="bag:0"]');
  await shot('vault-card');

  console.log('errors', JSON.stringify(errors));
  await browser.close();
})();
