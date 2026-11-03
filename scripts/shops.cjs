// The shops and the level-up flash at phone and laptop sizes: the Drowned Rat, a good's card, Tobin's
// stall, and a level up for a Rogue and a Warrior. node scripts/shops.cjs [url] [outdir]
const { chromium } = require('playwright');
const url = process.argv[2] || 'http://localhost:4173/';
const out = process.argv[3] || 'shots';
(async () => {
  const browser = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  for (const [name, opts] of [['phone', { viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true }], ['laptop', { viewport: { width: 1280, height: 800 }, deviceScaleFactor: 2 }]]) {
    for (const cls of ['WARRIOR', 'ROGUE']) {
      const ctx = await browser.newContext(opts);
      const page = await ctx.newPage();
      const errors = [];
      page.on('pageerror', (e) => errors.push(String(e)));
      page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
      await page.goto(`${url}?hero=${cls}`);
      await page.waitForFunction(() => typeof window.render_game_to_text === 'function');
      await page.waitForTimeout(500);
      // Level up where you stand: the room fills your health and lights you up.
      await page.evaluate(() => { const g = window.__game; Object.assign(g.hero, { x: 27, y: 19, hp: 20 }); });
      await page.waitForTimeout(400);
      await page.evaluate(() => window.__game.levelSeq++);
      await page.waitForTimeout(220);
      await page.screenshot({ path: `${out}/${name}-levelup-${cls.toLowerCase()}.png` });
      console.log(name, cls, 'hp after level up', await page.evaluate(() => `${window.__game.hero.hp}/${window.__game.hero.maxHp}`));
      if (cls === 'WARRIOR') {
        const skip = async () => { for (let i = 0; i < 4; i++) await page.evaluate(() => document.querySelector('#panel .body')?.click()), await page.waitForTimeout(80); };
        await page.evaluate(() => { const g = window.__game; g.profile.gold = 180; g.buy('fine'); g.buy('fine', undefined, 'armor', 'medium'); g.profile.gold = 120; window.__openSpot('tavern'); });
        await skip();
        await page.screenshot({ path: `${out}/${name}-drowned-rat.png` });
        await page.click('#panel [data-good="0"]');
        await page.waitForTimeout(150);
        await page.screenshot({ path: `${out}/${name}-brandy-card.png` });
        await page.click('#panel .spop [data-shut]');
        await page.evaluate(() => window.__openSpot('merchant'));
        await skip();
        await page.click('#panel [data-src="bag:0"]');
        await page.click('#panel [data-act="sell"]');
        await skip();
        await page.screenshot({ path: `${out}/${name}-pawn.png` });
        await page.click('#panel [data-good="0"]');
        await page.waitForTimeout(150);
        await page.screenshot({ path: `${out}/${name}-pawn-card.png` });
        await page.evaluate(() => { window.__panel.hide(); window.__openSpot('smith'); });
        await skip();
        await page.screenshot({ path: `${out}/${name}-forge.png` });
      }
      console.log(name, cls, 'errors', JSON.stringify(errors));
      await ctx.close();
    }
  }
  await browser.close();
})();
