// A pack rush and the ironhide, staged by a Warrior on a job, flat and 2.5D, phone and laptop: the rush
// winding up in front of him (the link and the three telegraphs), the parry landing on all of them, an
// ironhide whole and one with its guard broken. Usage: node scripts/rush-look.cjs [url] [outdir]
const { chromium } = require('playwright');
const url = process.argv[2] || 'http://localhost:4402/';
const out = process.argv[3] || 'shots';
const PLACE = { name: 'Lowfurrow Fields', kind: 'field', region: 'Barrowfields', ruin: 2 };

async function setUp(page) {
  await page.waitForFunction(() => window.__game);
  await page.evaluate(() => { window.__game.create('WARRIOR', 'BRANNOCK'); document.getElementById('title').hidden = true; window.__title.open = false; });
  await page.waitForTimeout(300);
  await page.evaluate(() => window.__game.mode === 'wood' && window.__game.skipWood());
  await page.waitForTimeout(300);
}

/** A fresh job room with only these goblins (`[variant, dx, dy]` from the hero), held facing up. */
async function stage(page, foes) {
  await page.evaluate((p) => { const g = window.__game, j = g.jobs()[1]; g.startJob({ ...j, place: p, objective: 'rescue', rooms: 1, seed: 5, layout: 3 }); }, PLACE);
  await page.waitForTimeout(400);
  await page.evaluate((foes) => {
    clearInterval(window.__hold);
    const g = window.__game, r = g.room, h = g.hero, base = JSON.parse(JSON.stringify(r.enemies.find((e) => e.kind === 'scrapper') || r.enemies[0]));
    for (const e of r.enemies) Object.assign(e, { x: 1.2, y: 1.2, act: 'dead', actT: 99, escaped: true });
    const at = { x: Math.round(r.map.w / 2), y: r.map.hero.y - 5 };
    Object.assign(h, { ...at, fx: 0, fy: -1, safeT: 0 });
    let id = Math.max(...r.enemies.map((e) => e.id)) + 1;
    window.__foes = foes.map(([variant, dx, dy]) => {
      const hp = variant === 'ironhide' ? 90 : 36;
      const e = { ...JSON.parse(JSON.stringify(base)), id: id++, kind: 'scrapper', variant, x: h.x + dx, y: h.y + dy, home: { x: h.x + dx, y: h.y + dy }, hp, maxHp: hp, radius: 0.34, weight: 0.6, act: 'chase', attack: null, alert: true, respawns: false, escaped: false, name: undefined, bow: false, z: 0, feeding: false, pack: 1, cooldown: 99, rushTo: null, cracked: false, crackUntil: -9 };
      const l = Math.hypot(h.x - e.x, h.y - e.y) || 1;
      Object.assign(e, { fx: (h.x - e.x) / l, fy: (h.y - e.y) / l });
      r.enemies.push(e);
      return e;
    });
    r.rushes.live = [];
    r.rushes.due.clear();
    r.rushes.fought.clear();
    window.__hold = setInterval(() => (Object.assign(h, { ...at, fx: 0, fy: -1, hp: h.maxHp }), window.__foes.forEach((e) => (e.cooldown = 99))), 10);
  }, foes);
}

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
      await setUp(page);
      // The room holds still while a shot is taken (a 2.5D frame on SwiftShader can take longer than a wind-up).
      const shot = async (name) => {
        await page.evaluate(() => (window.__pause = true));
        await page.screenshot({ path: `${out}/${name}-${dev}-${look}.png` });
        await page.evaluate(() => (window.__pause = false));
      };

      // The rush: three of a pack a few tiles off; the pack calls it now.
      await stage(page, [[undefined, -1.6, -3.2], [undefined, 0.2, -3.6], [undefined, 1.8, -3]]);
      // The guard pressed just before the blows land (as the red flashes white), in the room's own tick.
      await page.evaluate(() => {
        const g = window.__game, r = g.room, step = r.step.bind(r);
        r.step = () => { if (window.__pause) return; const a = r.enemies.find((e) => e.attack?.rush)?.attack; if (a && a.land - r.time < 0.14 && a.land > r.time) g.hero.parryOpenAt = r.time; step(); };
        r.rushes.due.set(1, 0);
      });
      await page.waitForFunction(() => window.__game.room.enemies.some((e) => e.attack?.rush && e.attack.t > 0.6), null, { timeout: 15000 });
      await shot('rush-windup');
      // The parry landing on all of them.
      await page.waitForFunction(() => window.__game.room.enemies.filter((e) => e.act === 'stunned').length >= 2, null, { timeout: 10000 });
      await page.waitForTimeout(160);
      await shot('rush-parried');
      const st = await page.evaluate(() => window.__game.room.enemies.filter((e) => !e.escaped).map((e) => e.act + ':' + e.actDur.toFixed(1)).join(' '));

      // The ironhide, whole, then with its guard broken (ARMOR BROKEN, the plates askew, the crack).
      await stage(page, [['ironhide', 0, -2.6]]);
      await page.evaluate(() => { const e = window.__foes[0], r = window.__game.room; window.__pin = setInterval(() => Object.assign(e, { x: e.home.x, y: e.home.y, act: 'chase', attack: null }), 10); void r; });
      await page.waitForTimeout(500);
      await shot('ironhide-whole');
      await page.evaluate(() => {
        const r = window.__game.room, e = window.__foes[0], step = r.step.bind(r);
        Object.assign(e, { crackUntil: r.time + 999, crackAt: r.time, cracked: true });
        let once = true;
        r.step = () => { if (window.__pause) return; step(); if (once) (once = false), r.events.push({ k: 'cracked', x: e.x, y: e.y }); };
      });
      await page.waitForTimeout(650);
      await shot('ironhide-broken');
      await page.evaluate(() => clearInterval(window.__pin));
      console.log(dev, look, st, errors.length ? errors.slice(0, 3) : 'no errors');
      await ctx.close();
    }
  }
  await browser.close();
})();
