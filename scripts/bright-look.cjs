// FLAT and 2.5D at the same moment: each scene is set up, the room is held still, the flat view is
// shot, then 2.5D is switched on and shot. Prints where the hero stands on screen in each (CSS px)
// so scripts/bright-stats.py can measure the hero as well as the whole scene.
// Usage: node scripts/bright-look.cjs [url] [outdir] [tag] [only,these]
const { chromium } = require('playwright');
const fs = require('fs');
const url = process.argv[2] || 'http://localhost:4203/';
const out = process.argv[3] || 'shots';
const tag = process.argv[4] || 'new';
const only = process.argv[5] ? process.argv[5].split(',') : null;
const NOON = 2400000 * 700 + 1200000, MIDNIGHT = 2400000 * 700 + 60000;

const clock = (page, ms) => page.evaluate((ms) => { Date.now = () => ms; }, ms);
const at = (page, x, y, fx = 0, fy = 1) => page.evaluate(([x, y, fx, fy]) => Object.assign(window.__game.hero, { x, y, fx, fy }), [x, y, fx, fy]);

const SCENES = {
  async 'town-night'(page) { await clock(page, MIDNIGHT); await at(page, 31, 21); await page.waitForTimeout(900); },
  async 'town-day'(page) { await clock(page, NOON); await at(page, 31, 21); await page.waitForTimeout(900); },
  async 'street-night'(page) {
    await page.evaluate(() => {
      const g = window.__game, j = g.jobs()[1];
      g.startJob({ ...j, twist: 'night', time: 'night', place: { name: 'Barrowby', kind: 'village', region: 'Barrowfields', ruin: 1 }, objective: 'rescue', boss: 'SKARN', rooms: 1, seed: 7 });
      const h = g.room.map.blocks.find((b) => b.kind === 'house');
      g.room.enemies.forEach((e) => (e.cooldown = 99));
      if (h) Object.assign(g.hero, { x: h.x + h.w / 2, y: h.y + h.h + 2.5 });
    });
    await page.waitForTimeout(900);
  },
  async den(page) {
    await clock(page, MIDNIGHT);
    await page.evaluate(async () => {
      const g = window.__game, wait = (ms) => new Promise((r) => setTimeout(r, ms));
      for (const seed of [7, 11, 13, 17]) for (const kind of ['village', 'farm']) {
        const j = g.jobs()[1];
        g.startJob({ ...j, twist: 'night', time: 'night', place: { name: 'Barrowby', kind, region: 'Barrowfields', ruin: 3 }, objective: 'larder', boss: 'SKARN', rooms: 1, seed });
        await wait(50);
        for (const d of g.room.map.blocks.filter((b) => b.door && !b.locked && b.fate !== 'blocked')) {
          g.enter(d);
          await wait(50);
          const grim = g.room.map.grim ?? [];
          if (grim.some((q) => q.kind === 'hung')) {
            const q = grim.find((q) => q.kind === 'pot') ?? grim.find((q) => q.kind === 'hung');
            g.room.enemies.forEach((e) => { e.cooldown = 99; });
            Object.assign(g.hero, { x: q.x + 0.6, y: Math.min(g.room.map.h - 1, q.y + 2.2), fx: 0, fy: -1 });
            return;
          }
          g.leave();
          await wait(30);
        }
      }
    });
    await page.waitForTimeout(900);
  },
  async butcher(page) {
    await page.evaluate(() => window.__game.enterYard());
    await page.evaluate(() => { const r = window.__room; r.heroes[0].y = 7.8; r.heroes[0].x = 9.3; });
    await page.waitForFunction(() => { const a = window.__room.enemies[0]?.attack; return a && a.t > a.windup * 0.6; }, null, { timeout: 20000 }).catch(() => {});
  },
  // The prologue wood: waking, Hew's first card, a drill's freeze-frame, the cutscene, the Stoker.
  async 'wood-wake'(page) { await page.waitForFunction(() => window.__game.wood?.hold, null, { timeout: 15000 }).catch(() => {}); },
  async 'wood-lesson'(page) {
    await page.evaluate(() => { const g = window.__game, w = g.wood, h = g.hero; Object.assign(w, { wake: -1, said: 99, hold: null }); Object.assign(h, { act: 'idle', actT: 0, actDur: 0, lying: false, x: 8, y: 34 }); w.from = { x: 8, y: 34 }; h.x = 11; h.y = 33; });
    await page.waitForFunction(() => window.__game.wood?.hold?.kind === 'card', null, { timeout: 15000 }).catch(() => {});
  },
  async 'wood-drill'(page) {
    await page.evaluate(() => { const g = window.__game, w = g.wood, h = g.hero; Object.assign(w, { wake: -1, said: 99, hold: null, stage: 1, entered: false, ids: [] }); g.room.enemies = g.room.enemies.filter((e) => e.act === 'dead'); g.room.map.blocks = g.room.map.blocks.filter((b) => b.kind !== 'fence'); Object.assign(h, { act: 'idle', actT: 0, actDur: 0, lying: false, x: 26, y: 33, fx: 1, fy: 0 }); const n = g.room.map.npcs.find((n) => n.talk === 'hew'); Object.assign(n, { x: 25, y: 37 }); });
    await page.waitForFunction(() => window.__game.wood?.hold?.kind === 'card', null, { timeout: 15000 }).catch(() => {});
    await page.evaluate(() => { window.__game.wood.hold = null; });
    await page.waitForFunction(() => window.__game.wood?.hold?.kind === 'act', null, { timeout: 30000 }).catch(() => {});
  },
  async 'wood-cut'(page) {
    await page.evaluate(() => { const g = window.__game, w = g.wood, h = g.hero; Object.assign(w, { wake: -1, said: 99, hold: null, stage: 4, entered: false, ids: [] }); g.room.enemies = g.room.enemies.filter((e) => e.act === 'dead'); g.room.map.blocks = g.room.map.blocks.filter((b) => b.kind !== 'fence'); Object.assign(h, { act: 'idle', actT: 0, actDur: 0, lying: false, x: 52, y: 11, fx: 1, fy: -0.3 }); const n = g.room.map.npcs.find((n) => n.talk === 'hew'); Object.assign(n, { x: 52, y: 10 }); });
    await page.waitForFunction(() => (window.__game.wood?.cut ?? -1) > 5.6, null, { timeout: 30000 }).catch(() => {});
  },
  async 'wood-stoker'(page) {
    await SCENES['wood-cut'](page);
    await page.waitForFunction(() => window.__game.wood?.cut < 0, null, { timeout: 30000 }).catch(() => {});
    await page.waitForFunction(() => { const r = window.__room, s = r.enemies.find((e) => e.id === window.__game.wood.stoker); return s?.attack && s.attack.t > s.attack.windup * 0.5; }, null, { timeout: 30000 }).catch(() => {});
  },
};

(async () => {
  fs.mkdirSync(out, { recursive: true });
  const meta = {};
  const browser = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  for (const [dev, opts] of [['phone', { viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true }], ['laptop', { viewport: { width: 1280, height: 800 }, deviceScaleFactor: 2 }]].filter(([d]) => !process.env.DEV || process.env.DEV === d)) {
    for (const [name, go] of Object.entries(SCENES)) {
      if (only && !only.includes(name)) continue;
      const ctx = await browser.newContext(opts);
      const page = await ctx.newPage();
      const errors = [];
      page.on('pageerror', (e) => errors.push(String(e)));
      await page.goto(url + (url.includes('?') ? '&' : '?') + 'look=flat&perf=1');
      await page.waitForFunction(() => window.__game);
      await page.evaluate(() => { window.__game.create('WARRIOR', 'BRANNOCK'); document.getElementById('title').hidden = true; window.__title.open = false; });
      await page.waitForTimeout(300);
      if (!name.startsWith('wood')) await page.evaluate(() => window.__game.mode === 'wood' && window.__game.skipWood());
      await page.waitForTimeout(300);
      await go(page);
      // Hold the room still: only drawing goes on.
      await page.evaluate(() => { window.__game.step = () => []; });
      await page.waitForTimeout(200);
      const hf = await page.evaluate(() => window.__views.heroScreen());
      await page.screenshot({ path: `${out}/${dev}-${name}-flat.png` });
      if (process.env.ZOOM3) await page.evaluate((z) => { window.__zoom3 = z; }, +process.env.ZOOM3);
      await page.evaluate(() => window.__views.switch.set('3d'));
      await page.waitForFunction(() => window.__views.is3d, null, { timeout: 20000 });
      await page.waitForTimeout(1500);
      const h3 = await page.evaluate(() => window.__views.heroScreen());
      await page.screenshot({ path: `${out}/${dev}-${name}-${tag}.png` });
      const st = await page.evaluate(() => window.__views.stats);
      meta[`${dev}-${name}`] = { flat: hf, d3: h3, dpr: opts.deviceScaleFactor };
      console.log(dev, name, st ? `draw ${st.draw?.toFixed?.(1)} frame ${st.frame?.toFixed?.(1)} ${st.W}x${st.H} x${st.S}` : '', errors.length ? 'ERRORS ' + JSON.stringify(errors) : '');
      await ctx.close();
    }
  }
  fs.writeFileSync(`${out}/meta-${tag}.json`, JSON.stringify(meta));
  await browser.close();
})();
