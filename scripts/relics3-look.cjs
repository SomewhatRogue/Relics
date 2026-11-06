// Relics made sure, with few uses (2026-11-05), on a phone: the RELIC button's pips mid-fight as the
// javelin skewers a line of goblins, and a relic's card faded down to its last use.
// Usage: node scripts/relics3-look.cjs [url] [outdir]
const { chromium } = require('playwright');
const url = process.argv[2] || 'http://localhost:4425/';
const out = process.argv[3] || 'shots';

(async () => {
  const browser = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  await page.goto(url + '?look=flat');
  await page.waitForFunction(() => window.__game);
  await page.evaluate(() => { window.__game.create('WARRIOR', 'BRANNOCK'); document.getElementById('title').hidden = true; window.__title.open = false; });
  await page.waitForTimeout(300);
  await page.evaluate(() => window.__game.mode === 'wood' && window.__game.skipWood());
  // The javelin carried, one use already gone (3 of 4 pips lit before the throw).
  await page.evaluate(() => { const p = window.__game.profile; p.relics[0].charge = 3; p.relic = p.relics[0].id; p.tally = false; window.__game.relicsChanged(); });
  const job = await page.evaluateHandle(() => window.__villageJob(7));
  await page.evaluate((j) => window.__game.startJob(j), job);
  await page.waitForTimeout(900);
  // A line of goblins straight up from the hero, waiting.
  await page.evaluate(() => {
    const g = window.__game, r = g.room, h = g.hero;
    Object.assign(h, { fx: 0, fy: -1 });
    const live = r.enemies.filter((e) => e.act !== 'dead');
    live.forEach((e, i) => Object.assign(e, i < 3 ? { x: h.x + (i - 1) * 0.15, y: h.y - 1.6 - i * 1.2, cooldown: 99, alert: true, attack: null, act: 'idle', hp: 300, maxHp: 300 } : { x: h.x + 12, y: h.y + 12, cooldown: 99, alert: false }));
  });
  await page.tap('.tb.relic2');
  // Freeze the moment the shaft has taken at least two of them.
  await page.waitForFunction(() => { const j = window.__game.room.javelins[0]; return j && (j.held || []).length >= 2; }, null, { polling: 'raf', timeout: 4000 }).catch((e) => console.log('wait', String(e).slice(0, 80)));
  await page.evaluate(() => { window.__game.step = () => []; });
  await page.waitForTimeout(250);
  await page.screenshot({ path: `${out}/phone-relic-skewer.png` });
  console.log('fight', JSON.stringify(await page.evaluate(() => { const g = window.__game, h = g.hero, j = g.room.javelins[0]; return { item: h.found.find((r) => r.id === h.relicItem), held: j && j.held, state: j && j.state }; })));
  // The pack, the relic slot chosen, the javelin down to its last use.
  await page.evaluate(() => { const g = window.__game, h = g.hero, it = h.found.find((r) => r.id === h.relicItem); it.charge = 1; g.profile.relics[0].charge = 1; window.__pack.toggle(true); });
  await page.waitForTimeout(250);
  await page.click('#pack [data-src="relic"]').catch((e) => console.log('pack click', String(e).slice(0, 80)));
  await page.waitForTimeout(250);
  await page.screenshot({ path: `${out}/phone-relic-card-faded.png` });
  console.log('errors', JSON.stringify(errors));
  await browser.close();
})();
