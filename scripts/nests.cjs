// A nest burned out up close, flat and 2.5D, phone and laptop: a Rogue crouched lighting it (the
// ring), the nest alight with spiders catching, the ash after. Usage: node scripts/nests.cjs [url] [outdir].
const { chromium } = require('playwright');
const url = process.argv[2] || 'http://localhost:4208/';
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
      await page.goto(url + '?look=' + look);
      await page.waitForFunction(() => window.__game);
      await page.evaluate(() => { window.__game.create('ROGUE', 'BRANNOCK'); document.getElementById('title').hidden = true; window.__title.open = false; });
      await page.waitForTimeout(300);
      await page.evaluate(() => window.__game.mode === 'wood' && window.__game.skipWood());
      await page.waitForTimeout(300);
      // A forest job; the goblins sent off to a corner and held there; a nest and its spiders put by the hero.
      await page.evaluate(() => {
        const g = window.__game, j = g.jobs()[1];
        g.profile.weapon = 'daggers'; g.profile.arms = {};
        g.startJob({ ...j, place: { name: 'Thornwick', kind: 'forest', region: 'Greyhollow', ruin: 2 }, objective: 'hunt', boss: 'SKARN', rooms: 1, seed: 7 });
      });
      await page.waitForTimeout(300);
      await page.evaluate(() => {
        const g = window.__game, r = g.room, h = g.hero, base = r.enemies[0];
        h.weapon = 'daggers'; h.arms = {};
        const x = Math.round(r.map.w / 2), y = r.map.hero.y - 4;
        const id = () => Math.max(...r.enemies.map((e) => e.id)) + 1;
        const nest = { ...JSON.parse(JSON.stringify(base)), id: id(), kind: 'nest', x, y, home: { x, y }, hp: 55, maxHp: 55, radius: 0.65, weight: Infinity, act: 'idle', attack: null, nextWave: 999, had: 0, lighter: '', lightT: 0, ashAt: 0, name: undefined, bow: false, variant: undefined, alert: true, respawns: false, burnUntil: 0, chillUntil: 0, frozenUntil: 0 };
        r.enemies.push(nest);
        window.__nest = nest;
        window.__spiders = [];
        for (const [dx, dy] of [[1.1, 0.2], [-1.0, 0.4], [0.3, -0.9]]) {
          const s = { ...JSON.parse(JSON.stringify(base)), id: id(), kind: 'spider', x: x + dx, y: y + dy, hp: 14, maxHp: 14, radius: 0.24, weight: 0.35, act: 'chase', attack: null, nest: nest.id, name: undefined, bow: false, variant: undefined, alert: true, respawns: false, burnUntil: 0, chillUntil: 0, frozenUntil: 0 };
          r.enemies.push(s);
          window.__spiders.push([s, x + dx, y + dy]);
        }
        const hold = () => {
          for (const e of r.enemies) if (e.kind !== 'nest' && e.kind !== 'spider') Object.assign(e, { x: 1.5, y: 1.5, cooldown: 99, attack: null });
          for (const [s, sx, sy] of window.__spiders) if (s.act !== 'dead') Object.assign(s, { x: sx, y: sy, cooldown: 99, attack: null, act: 'chase' });
          h.hp = h.maxHp;
        };
        setInterval(hold, 16);
        Object.assign(h, { x: x + 0.2, y: y + 1.25, fx: 0, fy: -1 });
      });
      await page.waitForTimeout(500);
      // GRAB (BURN on the button, G on a laptop).
      const label = dev === 'phone' ? await page.evaluate(() => document.querySelector('.tb.grab')?.textContent) : await page.evaluate(() => document.getElementById('prompt')?.textContent);
      if (dev === 'phone') await page.tap('.tb.grab'); else await page.keyboard.press('g');
      await page.waitForFunction(() => window.__nest.lightT > 0.6 || window.__nest.ashAt);
      // Held there for the picture (2.5D in software GL is slow enough to miss it otherwise).
      await page.evaluate(() => (window.__pin = setInterval(() => window.__nest.lighter && (window.__nest.lightT = 0.75), 5)));
      await page.waitForTimeout(300);
      await page.screenshot({ path: `${out}/${dev}-${look}-1-lighting.png` });
      await page.evaluate(() => clearInterval(window.__pin));
      const lit1 = await page.evaluate(() => ({ lighter: window.__nest.lighter, lightT: window.__nest.lightT }));
      await page.waitForFunction(() => window.__nest.ashAt && window.__room.time > window.__nest.ashAt - 2.4);
      await page.screenshot({ path: `${out}/${dev}-${look}-2-burning.png` });
      const lit2 = await page.evaluate(() => ({ ashAt: window.__nest.ashAt, t: window.__room.time, spiders: window.__spiders.map(([s]) => s.burnUntil > window.__room.time || s.act === 'dead') }));
      await page.waitForFunction(() => window.__nest.act === 'dead' && window.__nest.actT > 0.8);
      await page.screenshot({ path: `${out}/${dev}-${look}-3-ash.png` });
      const lit3 = await page.evaluate(() => ({ act: window.__nest.act, death: window.__nest.death }));
      console.log(dev, look, 'button', JSON.stringify(label), JSON.stringify(lit1), JSON.stringify(lit2), JSON.stringify(lit3), errors.length ? 'ERRORS ' + JSON.stringify(errors) : '');
      await ctx.close();
    }
  }
  await browser.close();
})();
