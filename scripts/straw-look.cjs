// The training yard's straw men on a phone, flat and 2.5D: the rack with straw men waiting and the watch,
// the board, a practice fight with one put down (a heap of straw) and a drill's line.
// Usage: node scripts/straw-look.cjs [url] [outdir]
// (build first; `npx vite preview --port 4418`). Prints the drill line and any page errors.
const { chromium } = require('playwright');
const url = process.argv[2] || 'http://localhost:4418/';
const out = process.argv[3] || 'shots';
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
(async () => {
  const browser = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  for (const look of ['flat', '3d']) {
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true });
    const page = await ctx.newPage();
    const errors = [];
    page.on('pageerror', (e) => errors.push(String(e)));
    page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
    await page.goto(url + (look === '3d' ? '?look=3d' : ''));
    await page.waitForFunction(() => window.__game);
    await page.evaluate(() => {
      const g = window.__game;
      g.create('WARRIOR', 'KYLE');
      if (g.mode === 'wood') g.skipWood();
      // Met on jobs already: every sort, so the whole board shows.
      g.profile.met = ['archer', 'shield', 'hexer', 'drummer', 'netter', 'ironhide', 'blind', 'spider', 'butcher'];
      g.profile.runs = 3;
      document.getElementById('title').hidden = true;
      window.__title.open = false;
      g.enterYard();
      Object.assign(g.hero, { x: 4.6, y: 3.2, fx: -0.5, fy: -0.8 });
    });
    await wait(look === '3d' ? 4000 : 1500);
    await page.screenshot({ path: `${out}/straw-${look}-pen.png` });
    await page.evaluate(() => window.__openSpot('practice'));
    // (A tap finishes the line typing in, another shows the rest.)
    for (let i = 0; i < 3; i++) await page.click('#panel h2').catch(() => {}), await wait(400);
    await page.screenshot({ path: `${out}/straw-${look}-board.png` });
    await page.evaluate(() => { const c = document.querySelector('#panel .card'), b = document.querySelector('#panel .body'); for (const el of [c, b]) if (el) el.scrollTop = el.scrollHeight; });
    await wait(300);
    await page.screenshot({ path: `${out}/straw-${look}-board2.png` });
    await page.evaluate(() => document.querySelector('#panel [data-pk="pack:five"]').click());
    await page.evaluate(() => Object.assign(window.__game.hero, { x: 4.2, y: 5.4, fx: -0.5, fy: -0.8 }));
    // Swing a while, then one of them put down: a heap of straw where a body would be.
    for (let i = 0; i < 8; i++) await page.keyboard.press(' ').catch(() => {}), await wait(200);
    await page.evaluate(() => { const g = window.__game, d = g.drill, h = g.hero, e = g.room.enemies.filter((x) => d.ids.includes(x.id) && x.act !== 'dead').sort((a, b) => Math.hypot(b.x - h.x, b.y - h.y) - Math.hypot(a.x - h.x, a.y - h.y))[0]; if (e) Object.assign(e, { act: 'dead', actT: 9, hp: 0, attack: null }); g.hero.safeT = 99; });
    await wait(1200);
    await page.screenshot({ path: `${out}/straw-${look}-fight.png` });
    await page.evaluate(() => (window.__openSpot('practice'), document.querySelector('#panel [data-pk="drill:parry"]').click()));
    await page.evaluate(() => { const g = window.__game; Object.assign(g.hero, { x: 9, y: 8.2, fx: 0, fy: -1 }); g.hero.safeT = 99; });
    await wait(3500);
    await page.screenshot({ path: `${out}/straw-${look}-drill.png` });
    console.log(look, await page.evaluate(() => window.__game.drill?.line), await page.evaluate(() => window.render_game_to_text()));
    console.log(look, 'errors', JSON.stringify(errors.slice(0, 5)));
    await ctx.close();
  }
  await browser.close();
})();
