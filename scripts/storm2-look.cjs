// The storm wand, seen on a phone, FLAT and 2.5D: the self-running stream at one step and at three, the
// lightning strike's gold mark while it's coming, and the strike as it lands. Each is fired for real
// through the room (the game's own step held, the room stepped with a Mage's intent), then held still.
// Usage: node scripts/storm2-look.cjs [url] [outdir]
const { chromium } = require('playwright');
const url = process.argv[2] || 'http://localhost:4406/';
const out = process.argv[3] || 'shots';
const PHONE = { viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true };

/** Into the yard as a Mage with a storm wand, goblins held at `spots`, the game's own step stopped. */
async function setup(page, spots) {
  await page.goto(url + '?hero=MAGE');
  await page.waitForFunction(() => window.__game && window.__views);
  await page.evaluate(() => { const g = window.__game; document.getElementById('title').hidden = true; if (window.__title) window.__title.open = false; if (g.mode === 'wood') g.skipWood(); });
  await page.waitForTimeout(300);
  await page.evaluate(() => window.__game.enterYard());
  await page.waitForTimeout(800);
  await page.evaluate((spots) => {
    const g = window.__game, r = window.__room, h = g.hero;
    Object.assign(h, { weapon: 'wand', x: 9, y: 9.5, fx: 0, fy: -1, magic: 100, primed: false });
    h.augments.channel = 'storm';
    r.enemies.forEach((e, i) => { const s = spots[i]; if (s) Object.assign(e, { x: s[0], y: s[1], cooldown: 99, attack: null, hp: 999, maxHp: 999, respawns: false }); else Object.assign(e, { x: 2, y: 2, cooldown: 99 }); });
    g.step = () => [];
    let seq = 900;
    /** Step the room `s` seconds with this intent, goblins held. */
    window.__drive = (s, i) => {
      const base = r.intents.get(h.id) || {};
      for (let k = 0; k < Math.round(s * 30); k++) {
        r.setIntent(h.id, { ...base, mx: 0, my: 0, ax: 0, ay: -3, attack: false, attackSeq: seq, ...i });
        r.step();
        for (const ev of r.events) if (ev.k === 'spell' || ev.k === 'skystrike' || ev.k === 'hit' || ev.k === 'fizzle' || ev.k === 'nomagic') (window.__evs ??= []).push(ev.k + (ev.n ? ev.n : ''));
        r.enemies.forEach((e, j) => { const p = spots[j]; if (p) Object.assign(e, { x: p[0], y: p[1], kvx: 0, kvy: 0, cooldown: 99 }); });
      }
    };
    window.__tap = (after) => (seq++, window.__drive(after, {}));
    window.__hold = (secs) => (seq++, window.__drive(secs, { attack: true }));
  }, spots);
}

async function shoot(page, name, errors, go) {
  for (const v of ['flat', '3d']) {
    await page.evaluate((v) => window.__views.switch.set(v === '3d' ? '3d' : 'pixel'), v);
    if (v === '3d') await page.waitForFunction(() => window.__views.is3d, null, { timeout: 20000 });
    await page.waitForTimeout(v === '3d' ? 1500 : 500);
    const state = await page.evaluate(go);
    await page.waitForTimeout(250);
    await page.screenshot({ path: `${out}/${name}-${v}.png` });
    console.log(name, v, JSON.stringify(state), errors.length ? 'ERRORS ' + JSON.stringify(errors.slice(0, 3)) : 'ok');
  }
}

(async () => {
  const browser = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const ctx = await browser.newContext(PHONE), page = await ctx.newPage(), errors = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  await setup(page, [[9, 6.2], [10.2, 6.5], [7.8, 6.6]]);
  const status = () => { const h = window.__game.hero, r = window.__room, z = r.zones.find((o) => o.kind === 'skystrike'); return { step: h.stream?.step, on: h.stream ? +(h.stream.until - r.time).toFixed(2) : 0, strike: z ? { x: z.x, y: z.y, r: z.r, in: +((z.at ?? 0) - r.time).toFixed(2) } : null, hp: r.enemies.slice(0, 3).map((e) => e.maxHp - e.hp), act: h.act, magic: Math.round(h.magic), ev: (window.__evs ?? []).splice(0).filter((k) => !k.startsWith('hit') || k.length > 4).slice(-8) }; };
  // The stream after one tap, and after three. (Each view fires it afresh, so neither runs out.)
  await page.evaluate((s) => (window.__status = s), status.toString());
  await shoot(page, 'stream-step1', errors, () => { window.__game.hero.stream = undefined; window.__tap(0.4); return (0, eval)('(' + window.__status + ')()'); });
  await shoot(page, 'stream-step3', errors, () => { window.__game.hero.stream = undefined; window.__tap(0.3); window.__tap(0.3); window.__tap(0.4); return (0, eval)('(' + window.__status + ')()'); });
  // The strike: held to the flash's far side (not a perfect), let go, the gold mark half way; then landing.
  await shoot(page, 'strike-mark', errors, () => { const h = window.__game.hero; h.stream = undefined; h.magic = 100; window.__room.zones.length = 0; window.__hold(1.1); window.__drive(0.06 + 0.17, {}); return (0, eval)('(' + window.__status + ')()'); });
  await shoot(page, 'strike-land', errors, () => { const h = window.__game.hero; h.stream = undefined; h.magic = 100; window.__room.zones.length = 0; window.__hold(1.1); window.__drive(0.06 + 0.3 + 0.12, {}); return (0, eval)('(' + window.__status + ')()'); });
  await browser.close();
})();
