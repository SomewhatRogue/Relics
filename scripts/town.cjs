// The loop on screen: Wickhold on a phone and laptop, the job board, then run rooms in a village,
// a forest and a mine (laptop), and the results back in town.
const { chromium } = require('playwright');
const url = process.argv[2] || 'http://localhost:4173/';
(async () => {
  const browser = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const errors = [];
  const open = async (opts) => {
    const ctx = await browser.newContext(opts);
    const page = await ctx.newPage();
    page.on('pageerror', (e) => errors.push(String(e)));
    page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
    await page.goto(url);
    await page.waitForFunction(() => window.__game);
    // Past the start screen with a hero.
    await page.evaluate(() => { window.__game.create('WARRIOR', 'BRANNOCK'); document.getElementById('title').hidden = true; window.__title.open = false; });
    return { ctx, page };
  };
  {
    const { ctx, page } = await open({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true });
    await page.waitForTimeout(600);
    await page.screenshot({ path: 'shots/town-phone.png' });
    await page.evaluate(() => Object.assign(window.__game.hero, { x: 14.6, y: 15 }));
    await page.waitForTimeout(300);
    await page.screenshot({ path: 'shots/town-phone-spot.png' });
    const b = await page.locator('.tb.use').boundingBox();
    await page.touchscreen.tap(b.x + b.width / 2, b.y + b.height / 2);
    await page.waitForTimeout(300);
    await page.screenshot({ path: 'shots/town-phone-board.png' });
    await ctx.close();
  }
  {
    const { ctx, page } = await open({ viewport: { width: 1280, height: 800 }, deviceScaleFactor: 2 });
    await page.waitForTimeout(500);
    await page.screenshot({ path: 'shots/town-laptop.png' });
    const kinds = [['Barrowby', 'village', 'Barrowfields', 1, 'rescue'], ["Hangman's Wood", 'forest', 'Greyhollow', 2, 'hunt'], ['The Copperdeep Shafts', 'mine', 'Copperdeep', 2, 'larder']];
    for (const [name, kind, region, ruin, objective] of kinds) {
      await page.evaluate(([name, kind, region, ruin, objective]) => {
        const g = window.__game, j = g.jobs()[1];
        g.startJob({ ...j, place: { name, kind, region, ruin }, objective, boss: 'SKARN', rooms: 1, seed: 7 });
      }, [name, kind, region, ruin, objective]);
      await page.waitForTimeout(800);
      await page.screenshot({ path: `shots/run-${kind}.png` });
    }
    await page.evaluate(() => { const g = window.__game; Object.assign(g.hero, { x: 9, y: 10 }); });
    console.log(await page.evaluate(() => window.render_game_to_text()));
    await ctx.close();
  }
  console.log('errors', JSON.stringify(errors));
  await browser.close();
})();
