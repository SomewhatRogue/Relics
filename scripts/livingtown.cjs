// The living town: the square on a phone and a laptop, the tavern, the dice, the Roll, the works.
const { chromium } = require('playwright');
const url = process.argv[2] || 'http://localhost:4173/?hero=ROGUE';
(async () => {
  const browser = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const errors = [];
  for (const [tag, opts] of [['phone', { viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true }], ['laptop', { viewport: { width: 1280, height: 800 }, deviceScaleFactor: 2 }]]) {
    const page = await (await browser.newContext(opts)).newPage();
    page.on('pageerror', (e) => errors.push(String(e)));
    await page.goto(url);
    await page.waitForFunction(() => window.__game);
    await page.waitForTimeout(800);
    await page.screenshot({ path: `shots/square-${tag}.png` });
    const at = async (name, fn) => {
      await page.evaluate(fn);
      await page.waitForTimeout(600);
      await page.screenshot({ path: `shots/${name}-${tag}.png` });
    };
    await at('tavern', () => { const g = window.__game; g.enter(g.room.map.blocks.find((b) => b.door === 'tavern')); });
    if (tag === 'phone') {
      await at('dice', () => { const g = window.__game; g.profile.gold = 80; window.__openSpot('dice'); });
      await page.click('#panel button[data-i="1"]');
      await page.waitForTimeout(300);
      await page.screenshot({ path: `shots/dice-roll-${tag}.png` });
      await page.evaluate(() => window.__panel.hide());
    }
    await at('east', () => { const g = window.__game; g.leave(); Object.assign(g.hero, { x: 49, y: 18 }); });
    await at('roll', () => window.__openSpot('roll'));
    await at('works', () => window.__openSpot('works'));
  }
  console.log('errors', JSON.stringify(errors));
  await browser.close();
})();
