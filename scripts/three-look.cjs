// The 2.5D view everywhere, on a phone and a laptop: Wickhold by night and by day, a hall inside, the
// gallows and the gravedigger, a den with its leavings, the wood with Hew, a Rogue's kits, the gear
// box. Usage: node scripts/three-look.cjs [url] [outdir] [only,these]. Prints errors and frame times.
const { chromium } = require('playwright');
const url = process.argv[2] || 'http://localhost:4202/';
const out = process.argv[3] || 'shots';
const only = process.argv[4] ? process.argv[4].split(',') : null;
const NOON = 2400000 * 700 + 1200000, MIDNIGHT = 2400000 * 700 + 60000;

const clock = (page, ms) => page.evaluate((ms) => { Date.now = () => ms; }, ms);
const at = (page, x, y, fx = 0, fy = 1) => page.evaluate(([x, y, fx, fy]) => Object.assign(window.__game.hero, { x, y, fx, fy }), [x, y, fx, fy]);

const SCENES = {
  async 'town-night'(page) { await clock(page, MIDNIGHT); await at(page, 31, 21); await page.waitForTimeout(900); },
  async 'town-day'(page) { await clock(page, NOON); await at(page, 31, 21); await page.waitForTimeout(900); },
  async gallows(page) {
    await clock(page, MIDNIGHT);
    await page.evaluate(() => { const g = window.__game; g.world.siege = g.world.siege ?? true; });
    await at(page, 34, 26, 0, -1);
    await page.waitForTimeout(900);
  },
  async gravedigger(page) { await clock(page, NOON); await at(page, 9, 11, 0, -1); await page.waitForTimeout(900); },
  async 'hall-tower'(page) {
    await page.evaluate(() => { const g = window.__game, b = g.room.map.blocks.find((b) => b.kind === 'tower' && b.door) ?? g.room.map.blocks.find((b) => b.door && b.kind === 'hall'); g.enter(b); });
    await page.waitForTimeout(1000);
  },
  async den(page) {
    await clock(page, MIDNIGHT);
    // A job's houses one by one until one has someone hung in it (and the pot if it can).
    const found = await page.evaluate(async () => {
      const g = window.__game, wait = (ms) => new Promise((r) => setTimeout(r, ms));
      for (const seed of [7, 11, 13, 17, 19, 23, 29, 31]) for (const kind of ['village', 'farm']) {
        const j = g.jobs()[1];
        g.startJob({ ...j, place: { name: 'Barrowby', kind, region: 'Barrowfields', ruin: 3 }, objective: 'larder', boss: 'SKARN', rooms: 1, seed });
        await wait(50);
        const doors = g.room.map.blocks.filter((b) => b.door && !b.locked && b.fate !== 'blocked');
        for (const d of doors) {
          g.enter(d);
          await wait(50);
          const grim = g.room.map.grim ?? [];
          if (grim.some((q) => q.kind === 'hung')) {
            const q = grim.find((q) => q.kind === 'pot') ?? grim.find((q) => q.kind === 'hung');
            g.room.enemies.forEach((e) => { e.cooldown = 99; e.x = 1; e.y = 1; });
            Object.assign(g.hero, { x: q.x + 0.6, y: Math.min(g.room.map.h - 1, q.y + 2.2), fx: 0, fy: -1 });
            return q.kind;
          }
          g.leave();
          await wait(30);
        }
      }
      return null;
    });
    console.log('den found', found);
    await page.waitForTimeout(900);
  },
  async wood(page) {
    await page.evaluate(() => window.__game.mode !== 'wood' && window.__game.startWood());
    await page.waitForTimeout(400);
    await page.evaluate(() => { const r = window.__room, hew = (r.map.npcs ?? []).find((n) => /HEW/i.test(n.name)); if (hew) Object.assign(window.__game.hero, { x: hew.x, y: hew.y + 2.5 }); });
    await page.waitForTimeout(1200);
  },
  async 'rogue-handbow'(page) {
    await page.evaluate(() => { window.__game.hero.weapon = 'handbow'; });
    await at(page, 31, 21, 1, 0.3);
    await page.waitForTimeout(800);
  },
  async 'rogue-daggers'(page) {
    await page.evaluate(() => { window.__game.hero.weapon = 'daggers'; });
    await at(page, 31, 21, 1, 0.3);
    await page.waitForTimeout(800);
  },
  async gear(page) {
    await page.evaluate(() => document.getElementById('opts').click());
    await page.waitForTimeout(400);
  },
};

(async () => {
  const browser = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  for (const [dev, opts] of [['phone', { viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true }], ['laptop', { viewport: { width: 1280, height: 800 }, deviceScaleFactor: 2 }]]) {
    for (const [name, go] of Object.entries(SCENES)) {
      if (only && !only.includes(name)) continue;
      const ctx = await browser.newContext(opts);
      const page = await ctx.newPage();
      const errors = [];
      page.on('pageerror', (e) => errors.push(String(e)));
      page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
      await page.goto(url + (url.includes('?') ? '&' : '?') + 'look=3d&perf=1');
      await page.waitForFunction(() => window.__game);
      const cls = name.startsWith('rogue') ? 'ROGUE' : 'WARRIOR';
      await page.evaluate((cls) => { window.__game.create(cls, 'BRANNOCK'); document.getElementById('title').hidden = true; window.__title.open = false; }, cls);
      await page.waitForTimeout(300);
      if (name !== 'wood') await page.evaluate(() => window.__game.mode === 'wood' && window.__game.skipWood());
      await page.waitForTimeout(300);
      await go(page);
      await page.screenshot({ path: `${out}/${dev}-${name}.png` });
      const st = await page.evaluate(() => window.__views && window.__views.stats);
      console.log(dev, name, 'on3d', await page.evaluate(() => window.__views.is3d), st ? `draw ${st.draw?.toFixed?.(1)} frame ${st.frame?.toFixed?.(1)} ${st.W}x${st.H} x${st.S} calls ${st.calls}` : '', errors.length ? 'ERRORS ' + JSON.stringify(errors) : '');
      await ctx.close();
    }
  }
  await browser.close();
})();
