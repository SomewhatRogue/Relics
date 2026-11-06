// The Night Watch, looked at: up Brisk's stair at midnight, on a phone (390x844, touch) and a laptop.
// Phone: the wall at the start; mid-run with a helmet flying and an arrow in a shield; fog and the moon
// behind cloud; the card at the end. Laptop: mid-run with the mouse drawing. Shots into shots/watch-*.png.
// Run against `npx vite preview --port 4419` (the port is the first argument's, or 4419).
const { chromium } = require('playwright');
const base = process.argv[2] || 'http://localhost:4419';
const url = `${base}/?hero=WARRIOR&day=0`;
const wait = (p, ms) => p.waitForTimeout(ms);

async function onWall(page) {
  await page.goto(url);
  await page.waitForFunction(() => typeof window.render_game_to_text === 'function' && window.__game && window.__openSpot);
  await page.evaluate(() => window.__openSpot('watch', 13));
  await page.click('#panel button.primary');
  await page.waitForFunction(() => window.__watch && window.__watch.s.t > 0.5);
}

(async () => {
  const browser = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const errors = [];
  {
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true });
    const page = await ctx.newPage();
    page.on('pageerror', (e) => errors.push('phone: ' + e));
    page.on('console', (m) => m.type() === 'error' && errors.push('phone: ' + m.text()));
    await page.goto(url);
    await page.waitForFunction(() => typeof window.__openSpot === 'function');
    await page.evaluate(() => window.__openSpot('watch', 13));
    await wait(page, 2500);
    await page.screenshot({ path: 'shots/watch-phone-brisk.png' });
    await onWall(page);
    await page.evaluate(() => { const w = window.__watch; w.input.ax = 140; w.input.ay = 118; });
    console.log('phone view', await page.evaluate(() => { const v = window.__watch.view; return JSON.stringify({ field: v.field, k: v.k, lw: v.lw, lh: v.lh, cssPerPx: v.k / devicePixelRatio, headCss: (v.k / devicePixelRatio) * 7 }); }));
    await wait(page, 2600);
    await page.screenshot({ path: 'shots/watch-phone-1-start.png' });
    // Mid-run: a helmet knocked off and spinning, a shield with an arrow in it, a torch-bearer, an archer.
    await page.evaluate(() => {
      const w = window.__watch, s = w.s;
      s.t = 104; s.nextSpawn = 999; s.gobs = []; s.score = 340; s.streak = 7; s.shots = 22; s.hits = 17; s.kills = 9;
      const h = w.put('helmet', 150), sh = w.put('shield', 128); w.put('torch', 110); w.put('plain', 166); w.put('archer', 95);
      w.shootAt(sh, 'shield'); w.shootAt(h, 'head');
      w.input.ax = 170; w.input.ay = 142; w.input.held = true;
    });
    await wait(page, 180);
    await page.screenshot({ path: 'shots/watch-phone-2-mid.png' });
    // Fog and the moon behind cloud.
    await page.evaluate(() => {
      const w = window.__watch, s = w.s;
      w.input.held = false;
      s.t = 140; s.clouds = [{ at: 132, len: 20 }];
      s.fogs = [{ at: 100, x0: 50, v: 1, w: 90 }];
      s.gobs = []; w.put('plain', 122); w.put('torch', 142); w.put('runner', 100); w.put('helmet', 162);
    });
    await wait(page, 500);
    await page.screenshot({ path: 'shots/watch-phone-3-fog.png' });
    await page.evaluate(() => {
      const s = window.__watch.s;
      Object.assign(s, { kills: 31, heads: 12, bestStreak: 14, shots: 58, hits: 44, score: 1260, lost: 3 });
      window.__watch.end();
    });
    await wait(page, 2500);
    await page.screenshot({ path: 'shots/watch-phone-4-card.png' });
    console.log('phone', await page.evaluate(() => JSON.stringify({ mode: window.__game.mode, gold: window.__game.profile.gold, watch: window.__game.profile.watch })));
    await page.click('#panel button:last-child');
    await wait(page, 300);
    console.log('phone after', await page.evaluate(() => JSON.stringify({ mode: window.__game.mode, inside: window.__GAME_STATE__().inside, overlay: !!document.getElementById('watch') })));
    await ctx.close();
  }
  {
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 }, deviceScaleFactor: 2 });
    const page = await ctx.newPage();
    page.on('pageerror', (e) => errors.push('laptop: ' + e));
    page.on('console', (m) => m.type() === 'error' && errors.push('laptop: ' + m.text()));
    await onWall(page);
    await page.evaluate(() => {
      const w = window.__watch, s = w.s;
      s.t = 75; s.nextSpawn = 999; s.gobs = []; s.score = 210; s.streak = 4; s.shots = 12; s.hits = 9;
      w.put('helmet', 64); w.put('runner', 110); const sh = w.put('shield', 140); w.shootAt(sh, 'shield'); w.put('plain', 30);
    });
    const box = await page.evaluate(() => { const v = window.__watch.view; return { k: v.k / devicePixelRatio, ox: v.ox, oy: v.oy }; });
    await page.mouse.move((box.ox + 66) * box.k, (box.oy + 118) * box.k);
    await page.mouse.down();
    await wait(page, 400);
    await page.screenshot({ path: 'shots/watch-laptop.png' });
    await page.mouse.up();
    await wait(page, 600);
    console.log('laptop', await page.evaluate(() => { const s = window.__watch.s; return JSON.stringify({ t: s.t.toFixed(1), shots: s.shots, hits: s.hits, streak: s.streak, gobs: s.gobs.map((g) => g.kind + ':' + g.state) }); }));
    await ctx.close();
  }
  console.log('errors', JSON.stringify(errors));
  await browser.close();
})();
