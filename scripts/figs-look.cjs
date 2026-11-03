// The figures in both views, posed and held still: a Mage casting and a Warrior beside a butcher and a
// brute; four spear lungers at wind-up, stab, recover and after; goblins by a torch at night; the
// square in town; the Stoker in the wood. Usage: node scripts/figs-look.cjs [url] [outdir] [3d|flat]
// [only,these]. Shots land as <outdir>/<device>-<scene>-<look>.png; prints errors and frame times.
const { chromium } = require('playwright');
const url = process.argv[2] || 'http://localhost:4206/';
const out = process.argv[3] || 'shots';
const look = process.argv[4] || '3d';
const only = process.argv[5] ? process.argv[5].split(',') : null;
const NOON = 2400000 * 700 + 1200000, MIDNIGHT = 2400000 * 700 + 60000;

const clock = (page, ms) => page.evaluate((ms) => { Date.now = () => ms; }, ms);

// In the page: stop the room (nothing moves but what's drawn from the wall clock) and make goblins.
const HELPERS = () => {
  window.__hold = () => { const r = window.__room; r.advance = () => []; r.prev.clear(); return r; };
  window.__foe = (id, kind, x, y, more = {}) => Object.assign({
    id, kind, x, y, kvx: 0, kvy: 0, fx: 0, fy: 1, hp: 30, maxHp: 30, radius: kind === 'butcher' ? 0.7 : 0.4, weight: 1,
    act: 'chase', actT: 0, actDur: 0, attack: null, cooldown: 99, hitstop: 0, hitAt: -9, moving: false, home: { x, y }, corpse: '',
    burnUntil: 0, burnNext: 0, chillUntil: 0, frozenUntil: 0, snareUntil: 0, lastBy: '', death: '', respawns: false, z: 0, alert: true,
  }, more);
  window.__hit = (e, kind, t, spec) => Object.assign(e, { act: 'attack', attack: Object.assign({ kind, t, dx: e.fx, dy: e.fy, ox: e.x, oy: e.y, cx: e.x + e.fx * 1.2, cy: e.y + e.fy * 1.2, unblockable: false, dmg: 1, knock: 1, arc: 60, range: 2 }, spec) });
};

const SCENES = {
  async fight(page) {
    await clock(page, NOON);
    await page.evaluate(() => {
      const g = window.__game, j = g.jobs()[1];
      g.startJob({ ...j, place: { name: 'Barrowby', kind: 'village', region: 'Barrowfields', ruin: 1 }, objective: 'rescue', boss: 'SKARN', rooms: 1, seed: 7 });
    });
    await page.waitForTimeout(400);
    await page.evaluate(() => {
      const r = window.__hold(), me = r.heroes[0], h = r.map.blocks.find((b) => b.kind === 'house');
      const x = h ? h.x + h.w / 2 : 10, y = h ? h.y + h.h + 3 : 10;
      Object.assign(me, { x, y, fx: 0.3, fy: -0.95, act: 'charge', actT: 0.7, primed: true, moving: false });
      const w = { ...me, id: 'ally', tag: 'ALDA', weapon: 'sword', look: 0, x: x + 1.5, y: y + 0.3, act: 'idle', actT: 0, primed: false, fx: 0.6, fy: -0.8, blocking: true };
      r.heroes.push(w);
      const b = window.__foe(901, 'butcher', x + 2.2, y - 2.2, { fx: -0.5, fy: 0.85, hp: 300, maxHp: 300 });
      window.__hit(b, 'cleave', 0.75, { windup: 1, active: 0.1, recover: 0.9, arc: 70, range: 2.6 });
      const br = window.__foe(902, 'scrapper', x - 1.6, y - 1.6, { variant: 'heavy', fx: 0.6, fy: 0.8, hp: 110, maxHp: 110 });
      window.__hit(br, 'swing', 0.85, { windup: 1, active: 0.1, recover: 0.9, arc: 100, range: 1.9 });
      r.enemies = [b, br];
    });
    await page.waitForTimeout(700);
  },
  async lunge(page) {
    await clock(page, NOON);
    await page.waitForTimeout(300);
    await page.evaluate(() => {
      const r = window.__hold(), me = r.heroes[0], x = 35, y = 22.5;
      Object.assign(me, { x: x + 1.2, y: y + 0.4, fx: -1, fy: 0, act: 'idle', moving: false });
      // Wind-up, the stab, the recover, and after it (each its own lunger, top to bottom).
      r.enemies = [0.6, 0.86, 1.08, 1.4].map((t, i) => {
        const e = window.__foe(910 + i, 'scrapper', x - 2.6, y - 2 + i * 1.3, { variant: 'lunger', fx: 1, fy: 0 });
        return window.__hit(e, 'stab', t, { windup: 0.8, active: 0.1, recover: 0.8, arc: 24, range: 3, unblockable: true });
      });
    });
    await page.waitForTimeout(700);
  },
  async night(page) {
    await clock(page, MIDNIGHT);
    await page.waitForTimeout(300);
    await page.evaluate(() => {
      const r = window.__hold(), me = r.heroes[0], t = [...r.map.torches].filter((q) => q.y > 8 && q.y < r.map.h - 8 && q.x > 6 && q.x < r.map.w - 6).sort((a, b) => Math.hypot(a.x - 31, a.y - 21) - Math.hypot(b.x - 31, b.y - 21))[0] ?? { x: 31, y: 20 };
      Object.assign(me, { x: t.x, y: t.y + 3.2, fx: 0, fy: -1, act: 'idle', moving: false });
      const F = window.__foe;
      r.enemies = [
        F(920, 'scrapper', t.x - 1.4, t.y + 1.2, { fx: 0.7, fy: 0.7 }),
        F(921, 'scrapper', t.x + 1.5, t.y + 1.0, { fx: -0.7, fy: 0.7, variant: 'shield' }),
        F(922, 'scrapper', t.x - 0.3, t.y + 1.6, { fx: 0, fy: 1, bow: true }),
        F(923, 'scrapper', t.x + 2.6, t.y + 2.2, { fx: -1, fy: 0.2, variant: 'hexer' }),
        F(924, 'scrapper', t.x - 2.6, t.y + 2.4, { fx: 1, fy: 0, variant: 'drummer' }),
      ];
    });
    await page.waitForTimeout(700);
  },
  async square(page) {
    await clock(page, NOON);
    await page.evaluate(() => Object.assign(window.__game.hero, { x: 31, y: 21, fx: 0, fy: 1 }));
    await page.waitForTimeout(1200);
  },
  async behind(page) {
    await clock(page, MIDNIGHT);
    await page.waitForTimeout(300);
    await page.evaluate(() => {
      const r = window.__hold(), me = r.heroes[0], b = r.map.blocks.filter((b) => b.kind === 'house' && b.y > 6).sort((p, q) => Math.hypot(p.x - 31, p.y - 21) - Math.hypot(q.x - 31, q.y - 21))[0];
      Object.assign(me, { x: b.x + b.w / 2, y: b.y + 0.6, fx: 0, fy: 1, act: 'idle', moving: false });
    });
    await page.waitForTimeout(700);
  },
  async stoker(page) {
    await page.evaluate(() => window.__game.mode !== 'wood' && window.__game.startWood());
    await page.waitForTimeout(500);
    await page.evaluate(() => {
      const r = window.__hold(), me = r.heroes[0], hew = (r.map.npcs ?? []).find((n) => /HEW/i.test(n.name));
      const x = hew ? hew.x + 1.2 : 10, y = hew ? hew.y + 1.5 : 10;
      Object.assign(me, { x, y, fx: 0, fy: -1, act: 'idle', moving: false });
      const s = window.__foe(930, 'butcher', x + 1.5, y - 2.4, { variant: 'stoker', name: 'THE STOKER', fx: -0.4, fy: 0.9, hp: 520, maxHp: 520 });
      window.__hit(s, 'charge', 0.5, { windup: 1.2, active: 0.6, recover: 1, range: 6, radius: 0.8 });
      r.enemies = [...r.enemies.filter((e) => e.act !== 'dead' && Math.hypot(e.x - x, e.y - y) < 9).slice(0, 2), s];
    });
    await page.waitForTimeout(700);
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
      await page.goto(url + (url.includes('?') ? '&' : '?') + 'look=' + (look === 'flat' ? 'flat' : '3d') + '&perf=1');
      await page.waitForFunction(() => window.__game);
      await page.evaluate(HELPERS);
      const cls = name === 'fight' ? 'MAGE' : 'WARRIOR';
      await page.evaluate((cls) => { window.__game.create(cls, 'BRANNOCK'); document.getElementById('title').hidden = true; window.__title.open = false; }, cls);
      await page.waitForTimeout(300);
      if (name !== 'stoker') await page.evaluate(() => window.__game.mode === 'wood' && window.__game.skipWood());
      await page.waitForTimeout(300);
      await go(page);
      await page.screenshot({ path: `${out}/${dev}-${name}-${look}.png` });
      const st = await page.evaluate(() => window.__views && window.__views.stats);
      console.log(dev, name, look, st ? `draw ${st.draw?.toFixed?.(1)} frame ${st.frame?.toFixed?.(1)} figs ${st.figs?.toFixed?.(2) ?? '-'} ${st.W}x${st.H} x${st.S} calls ${st.calls}` : '', errors.length ? 'ERRORS ' + JSON.stringify(errors) : '');
      await ctx.close();
    }
  }
  await browser.close();
})();
