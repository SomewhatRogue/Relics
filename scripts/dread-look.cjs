// Out of bounds, on screen, phone and laptop, flat and 2.5D: on a wild job (Hangman's Wood) the
// warning, the late stage and the hand coming down, the crush; on a settled one (Barrowby) the late
// stage's eyes and the hungry pouring in; in town, the flicker as you're set back. The hero is put out
// of bounds by marking where they stand forbidden (every real way out is shut).
// Usage: node scripts/dread-look.cjs [url] [outdir]
const { chromium } = require('playwright');
const url = process.argv[2] || 'http://localhost:4330/';
const out = process.argv[3] || 'shots';

const state = (page) => page.evaluate(() => { const h = window.__game.hero; return { mode: window.__game.mode, dread: +(h.dread ?? 0).toFixed(2), by: h.dreadBy, takenT: h.takenT, act: h.act, x: +h.x.toFixed(1), y: +h.y.toFixed(1) }; });
const outHere = (page) => page.evaluate(() => { const g = window.__game, h = g.hero; g.room.dread.forbid = [{ x: h.x - 2, y: h.y - 2, w: 4, h: 4 }]; });
const setDread = (page, d) => page.evaluate((d) => (window.__game.hero.dread = d), d);

(async () => {
  const browser = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  for (const [dev, opts] of [['phone', { viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true }], ['laptop', { viewport: { width: 1280, height: 800 }, deviceScaleFactor: 2 }]]) {
    for (const look of ['flat', '3d']) {
      const ctx = await browser.newContext(opts);
      const page = await ctx.newPage();
      const errors = [];
      page.on('pageerror', (e) => errors.push(String(e)));
      page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
      await page.goto(url + '?look=' + look);
      await page.waitForFunction(() => window.__game);
      await page.evaluate(() => { window.__game.create('WARRIOR', 'BRANNOCK'); document.getElementById('title').hidden = true; window.__title.open = false; });
      await page.waitForTimeout(300);
      await page.evaluate(() => window.__game.mode === 'wood' && window.__game.skipWood());
      await page.waitForTimeout(300);
      const shot = async (name) => (await page.screenshot({ path: `${out}/${dev}-${look}-${name}.png` }), console.log(dev, look, name, JSON.stringify(await state(page))));
      for (const [place, tag] of [[{ name: "Hangman's Wood", kind: 'forest', region: 'Greyhollow', ruin: 2 }, 'wild'], [null, 'settled']]) {
        await page.evaluate(async (place) => {
          const g = window.__game, job = await window.__villageJob(11);
          if (place) job.place = place;
          if (g.mode === 'run') g.leaveJob(), (g.result = null);
          g.startJob(job);
          g.room.enemies.length = 0;
          window.__keep = setInterval(() => { const h = window.__game.hero; if (h.act !== 'down' && (h.takenT ?? -1) < 0) h.hp = h.maxHp; window.__game.room.enemies.length = 0; }, 16);
        }, place);
        await page.waitForTimeout(800);
        await outHere(page);
        await page.waitForFunction(() => (window.__game.hero.dread ?? 0) > 1.4, null, { timeout: 15000 });
        await shot(`${tag}-1-warning`);
        // (Held at each stage for the picture: the room keeps running, the dread is pinned.)
        await page.evaluate(() => (window.__pin = setInterval(() => (window.__game.hero.dread = 5.4), 5)));
        await page.waitForTimeout(2600);
        await shot(`${tag}-2-late`);
        await page.evaluate(() => (clearInterval(window.__pin), (window.__game.hero.dread = 7.97)));
        await page.waitForFunction(() => (window.__game.hero.takenT ?? -1) >= 0, null, { timeout: 15000, polling: 'raf' });
        await page.evaluate(() => (window.__pin = setInterval(() => { const h = window.__game.hero; if (h.takenT > 0.3) h.takenT = 0.3; }, 5)));
        await page.waitForTimeout(950);
        await shot(`${tag}-3-taken`);
        await page.evaluate(() => clearInterval(window.__pin));
        await page.waitForFunction(() => window.__game.hero.act === 'down', null, { timeout: 15000, polling: 'raf' });
        await page.waitForTimeout(60);
        await shot(`${tag}-4-crushed`);
        await page.evaluate(() => clearInterval(window.__keep));
      }
      // Town: a moment out, a flicker, set back.
      await page.evaluate(() => { const g = window.__game; g.leaveJob(); g.result = null; });
      await page.waitForFunction(() => window.__game.mode === 'town', null, { timeout: 20000 }).catch(() => page.evaluate(() => window.__game.enterTown()));
      await page.waitForTimeout(800);
      await outHere(page);
      await page.waitForFunction(() => (window.__game.hero.dread ?? 0) > 1.0, null, { timeout: 15000 });
      await shot('town-1-out');
      await page.waitForFunction(() => (window.__game.hero.dread ?? 0) === 0, null, { timeout: 15000, polling: 'raf' });
      await shot('town-2-setback');
      console.log(dev, look, errors.length ? 'ERRORS ' + JSON.stringify(errors.slice(0, 5)) : 'no errors');
      await ctx.close();
    }
  }
  await browser.close();
})();
