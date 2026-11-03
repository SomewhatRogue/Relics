// A house set alight from outside, flat and 2.5D, phone and laptop: the kindling glinting as you come
// up, crouched lighting it (the ring), the house burning with its goblins coming out on fire, the burnt
// shell after, and SOMEONE'S INSIDE at a house with someone caged. Usage: node scripts/houseburn.cjs [url] [outdir].
const { chromium } = require('playwright');
const url = process.argv[2] || 'http://localhost:4209/';
const out = process.argv[3] || 'shots';

(async () => {
  const browser = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  for (const [dev, opts] of [['phone', { viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true }], ['laptop', { viewport: { width: 1280, height: 800 }, deviceScaleFactor: 2 }]]) {
    for (const look of ['flat', '3d']) {
      const ctx = await browser.newContext(opts);
      const page = await ctx.newPage();
      const errors = [];
      page.on('pageerror', (e) => errors.push(String(e)));
      page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
      await page.goto(url + '?look=' + look + '&day=0.85');
      await page.waitForFunction(() => window.__game);
      await page.evaluate(() => { window.__game.create('MAGE', 'BRANNOCK'); document.getElementById('title').hidden = true; window.__title.open = false; });
      await page.waitForTimeout(300);
      await page.evaluate(() => window.__game.mode === 'wood' && window.__game.skipWood());
      await page.waitForTimeout(300);
      await page.evaluate(async () => {
        const g = window.__game;
        g.startJob(await window.__villageJob(7));
        g.room.enemies.length = 0;
      });
      await page.waitForTimeout(300);
      // The house with the most goblins in it (and one with someone caged, for the cry).
      const pick = await page.evaluate(() => {
        const g = window.__game, r = g.room, m = r.map;
        let best = -1, most = -1, cry = -1;
        m.blocks.forEach((b, i) => {
          if (!b.door || b.look === undefined || !b.maxHp || b.fate === 'burning' || b.fate === 'blocked') return;
          const n = g.indoors.contents(i).foes.length;
          if (b.cry && cry < 0) cry = i;
          if (n > most) (most = n), (best = i);
        });
        window.__pick = best;
        return { best, most, cry };
      });
      const k = await page.evaluate((i) => window.__kindling(i), pick.best);
      const kc = pick.cry >= 0 ? await page.evaluate((i) => window.__kindling(i), pick.cry) : null;
      const hold = () => page.evaluate(() => (window.__keep = setInterval(() => { const h = window.__game.hero; h.hp = h.maxHp; }, 16)));
      await hold();
      if (kc) {
        await page.evaluate((k) => Object.assign(window.__game.hero, { x: k.x + k.side * 3, y: k.y, fx: -k.side, fy: 0 }), kc);
        await page.waitForTimeout(400);
        await page.evaluate((k) => Object.assign(window.__game.hero, { x: k.x + k.side * 0.5, y: k.y }), kc);
        await page.waitForTimeout(250);
        await page.screenshot({ path: `${out}/${dev}-${look}-0-cry.png` });
      }
      // 1. Coming up: the glint.
      await page.evaluate((k) => Object.assign(window.__game.hero, { x: k.x + k.side * 1.8, y: k.y + 0.4, fx: -k.side, fy: 0 }), k);
      await page.waitForTimeout(700);
      await page.screenshot({ path: `${out}/${dev}-${look}-1-glint.png` });
      // 2. At it: BURN, crouched, the ring filling (held there for the picture).
      await page.evaluate((k) => Object.assign(window.__game.hero, { x: k.x + k.side * 0.45, y: k.y, fx: -k.side, fy: 0 }), k);
      await page.waitForTimeout(300);
      const label = dev === 'phone' ? await page.evaluate(() => document.querySelector('.tb.grab')?.textContent) : await page.evaluate(() => document.getElementById('prompt')?.textContent);
      if (dev === 'phone') await page.tap('.tb.grab'); else await page.keyboard.press('g');
      const b = pick.best;
      await page.waitForFunction((i) => (window.__game.room.map.blocks[i].lightT ?? 0) > 0.6 || window.__game.room.map.blocks[i].burning >= 0, b);
      await page.evaluate((i) => (window.__pin = setInterval(() => { const q = window.__game.room.map.blocks[i]; if (q.lighter) q.lightT = 0.9; }, 5)), b);
      await page.waitForTimeout(300);
      await page.screenshot({ path: `${out}/${dev}-${look}-2-lighting.png` });
      await page.evaluate(() => clearInterval(window.__pin));
      await page.waitForFunction((i) => window.__game.room.map.blocks[i].burning >= 0, b, { timeout: 10000 });
      // 3. Burning, its goblins coming out on fire: step back to see it.
      await page.evaluate((k) => Object.assign(window.__game.hero, { x: k.x + k.side * 2.5, y: k.y + 3.5, fx: 0, fy: -1 }), k);
      await page.waitForFunction(() => window.__game.room.enemies.some((e) => e.act !== 'dead' && e.burnUntil > window.__game.room.time), null, { timeout: 25000 }).catch(() => {});
      await page.waitForTimeout(250);
      await page.screenshot({ path: `${out}/${dev}-${look}-3-burning.png` });
      const st = await page.evaluate((i) => { const r = window.__game.room, f = r.houseFires[0]; return { t: r.time, from: f?.from, fall: f?.fall, out: r.enemies.length, burning: r.enemies.filter((e) => e.burnUntil > r.time).length, hp: r.map.blocks[i].hp }; }, b);
      // 4. The burnt shell: the roof brought forward.
      await page.evaluate(() => { const r = window.__game.room; for (const f of r.houseFires) f.fall = Math.min(f.fall, r.time + 0.5); for (const e of r.enemies) Object.assign(e, { hp: 0, act: 'dead', actT: 9, actDur: 99 }); });
      await page.waitForFunction((i) => window.__game.room.map.blocks[i].ruined, b);
      await page.waitForTimeout(600);
      await page.screenshot({ path: `${out}/${dev}-${look}-4-shell.png` });
      console.log(dev, look, 'pick', JSON.stringify(pick), 'button', JSON.stringify(label), JSON.stringify(st), errors.length ? 'ERRORS ' + JSON.stringify(errors) : '');
      await ctx.close();
    }
  }
  await browser.close();
})();
