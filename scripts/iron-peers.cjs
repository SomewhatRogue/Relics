// The UI chat's phone shots of step 4 (docs/design/ui-look.md): the Deep's roll card (asking, then opened
// with a tap on the piece) and the Deep's checkpoint at floor 1's end, solo. node scripts/iron-peers.cjs [tag]
const { chromium } = require('playwright');
const tag = process.argv[2] || 'now';
const base = process.env.URL || 'http://localhost:4173/';
(async () => {
  const browser = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true });
  const page = await ctx.newPage(); const errors = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  await page.goto(base + '?hero=WARRIOR');
  await page.waitForFunction(() => typeof window.__openSpot === 'function' && window.__game);
  await page.waitForTimeout(800);
  // 1. The roll card: a unique on the ground, asking.
  await page.evaluate(() => {
    const r = window.__game.room, h = r.heroes[0];
    r.rolls = [{ id: 901, x: h.x + 1, y: h.y, until: r.time + 30, picks: {},
      item: { slot: 'weapon', quality: 'tolmouth', traits: ['crushing'], mods: [{ id: 'damage', v: 0.18 }, { id: 'knock', v: 0.25 }, { id: 'reach', v: 0.12 }], level: 0, unique: 'haulpick', kit: 'greatsword' } }];
  });
  await page.waitForTimeout(700);
  await page.screenshot({ path: `shots/ui-${tag}-roll.png` });
  await page.evaluate(() => document.querySelector('#roll .rhead')?.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true })));
  await page.waitForTimeout(400);
  await page.screenshot({ path: `shots/ui-${tag}-roll-open.png` });
  await page.evaluate(() => { window.__game.room.rolls = []; });
  // 2. The checkpoint: down into the Deep, then to floor 1's end.
  await page.evaluate(() => { const g = window.__game; g.startJob(g.deepJob()); });
  await page.waitForFunction(() => window.__game.mode === 'run' && window.__game.run?.job.floor === 1, null, { timeout: 15000 });
  await page.waitForTimeout(800);
  await page.evaluate(() => {
    const g = window.__game, x = g.room.map.exit;
    g.run.gold = 40; g.openForTest();
    for (const h of g.room.heroes) Object.assign(h, { x: x.x + x.w / 2, y: x.y + x.h / 2, act: 'idle', kvx: 0, kvy: 0 });
  });
  await page.waitForFunction(() => /floor 1/i.test(document.querySelector('#panel h2')?.textContent ?? ''), null, { timeout: 10000 }).catch(() => errors.push('no checkpoint'));
  await page.waitForTimeout(600);
  await page.screenshot({ path: `shots/ui-${tag}-checkpoint.png` });
  console.log('errors', JSON.stringify(errors)); await browser.close();
})();
