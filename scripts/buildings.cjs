// The start screen, going into Wickhold's buildings and talking, and buildings on a job: a cottage's
// inside, goblin dens burning and burned down. Phone first, then laptop.
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
    return { ctx, page };
  };
  const tap = async (page, sel) => {
    const b = await page.locator(sel).first().boundingBox();
    await page.touchscreen.tap(b.x + b.width / 2, b.y + b.height / 2);
    await page.waitForTimeout(250);
  };
  {
    const { ctx, page } = await open({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true });
    await page.waitForTimeout(500);
    await page.screenshot({ path: 'shots/title-new.png' });
    await page.click('[data-cls="HEALER"]');
    await page.waitForTimeout(150);
    await page.screenshot({ path: 'shots/title-healer.png' });
    await page.click('[data-begin]');
    await page.waitForTimeout(400);
    // To the forge door.
    await page.evaluate(() => { const g = window.__game, b = g.room.map.blocks.find((x) => x.door === 'forge'); Object.assign(g.hero, { x: b.x + b.w / 2, y: b.y + b.h + 0.5 }); });
    await page.waitForTimeout(400);
    await page.screenshot({ path: 'shots/door-phone.png' });
    await tap(page, '.tb.use');
    await page.waitForTimeout(500);
    await page.screenshot({ path: 'shots/forge-phone.png' });
    await page.evaluate(() => { const g = window.__game, n = g.room.map.npcs[1]; Object.assign(g.hero, { x: n.x, y: n.y + 0.9 }); });
    await page.waitForTimeout(300);
    await tap(page, '.tb.use');
    await page.screenshot({ path: 'shots/wright-phone.png' });
    console.log('phone', JSON.stringify(await page.evaluate(() => window.__GAME_STATE__().inside)));
    await ctx.close();
  }
  {
    const { ctx, page } = await open({ viewport: { width: 1280, height: 800 }, deviceScaleFactor: 2 });
    await page.evaluate(() => { window.__game.create('WARRIOR', 'BRANNOCK'); window.__game.create('MAGE', 'ASHE'); window.__title.show(); });
    await page.waitForTimeout(300);
    await page.screenshot({ path: 'shots/title-heroes.png' });
    await page.click('[data-play="0"]');
    for (const door of ['church', 'infirmary', 'home:0', 'townhall']) {
      await page.evaluate((door) => {
        const g = window.__game;
        if (g.outside) g.leave();
        g.world.rescued = 6;
        g.enterTown();
        const b = g.room.map.blocks.find((x) => x.door === door);
        g.enter(b);
      }, door);
      await page.waitForTimeout(500);
      await page.screenshot({ path: `shots/inside-${door.replace(':', '')}.png` });
    }
    // A village job: into a cottage.
    await page.evaluate(() => {
      const g = window.__game, j = g.jobs()[1];
      g.startJob({ ...j, place: { name: 'Barrowby', kind: 'village', region: 'Barrowfields', ruin: 1 }, objective: 'rescue', rooms: 2, seed: 7 });
      g.enter(g.room.map.blocks.find((b) => b.door === 'cottage'));
    });
    await page.waitForTimeout(600);
    await page.screenshot({ path: 'shots/cottage.png' });
    // Burn out the dens: one burning, one charred and burning, one gone.
    await page.evaluate(() => {
      const g = window.__game, j = g.jobs()[1];
      g.startJob({ ...j, place: { name: 'The Charcoal Camps', kind: 'forest', region: 'Greyhollow', ruin: 2 }, objective: 'burn', rooms: 1, seed: 7, twist: 'night' });
      const r = g.room, dens = r.map.blocks.filter((b) => b.kind === 'den');
      dens[0].burning = r.time;
      if (dens[1]) Object.assign(dens[1], { burning: r.time, hp: 30 });
      if (dens[2]) Object.assign(dens[2], { ruined: true, hp: 0 });
      Object.assign(g.hero, { x: dens[0].x + 1.3, y: dens[0].y + 3.2 });
    });
    await page.waitForTimeout(700);
    await page.screenshot({ path: 'shots/dens-burning.png' });
    console.log(await page.evaluate(() => window.render_game_to_text()));
    console.log(await page.evaluate(() => document.getElementById('banner').textContent));
    await ctx.close();
  }
  console.log('errors', JSON.stringify(errors));
  await browser.close();
})();
