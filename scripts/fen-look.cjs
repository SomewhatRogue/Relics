// Fenmere on a phone, FLAT and 2.5D (shared/fen.ts): the causeway shut with shields and the skimmer pouring
// on its edge, a reed-bed ambush standing up out of the water, a ford crossing with the gaffer's hook coming,
// the mist over the reeds with a red and a striped telegraph in it (sampled with the mist on and off, so you
// can see it never covers them), and the board with Fenmere posted.
// Usage: node scripts/fen-look.cjs [url] [outdir]
const { chromium } = require('playwright');
const url = process.argv[2] || 'http://localhost:4511/?hero=WARRIOR';
const out = process.argv[3] || 'shots';
const NOON = 2400000 * 700 + 1200000;
const PHONE = { viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true };

async function into(page, look) {
  await page.goto(`${url}${look === '3d' ? '&look=3d' : ''}`);
  await page.waitForFunction(() => window.__game && window.__fx, null, { timeout: 60000 });
  await page.evaluate((ms) => { Date.now = () => ms; const g = window.__game; g.startJob({ ...g.jobs().find((j) => j.exped === 'fen'), time: 'day', twist: 'none' }); }, NOON);
  await page.waitForFunction(() => window.__game.room && window.__game.room.exped, null, { timeout: 60000 });
  await page.waitForTimeout(400);
}

/** A scene set up in the room, played a moment, then held still. */
async function scene(page, what) {
  return page.evaluate(async (what) => {
    const g = window.__game, r = g.room, fx = window.__fx, h = g.hero, wait = (ms) => new Promise((d) => setTimeout(d, ms));
    const step = (n) => { for (let i = 0; i < n; i++) { r.step(); for (const ev of r.events) fx.on(ev); } };
    Object.assign(h, { hp: 9999, maxHp: 9999, safeT: 0 });
    const clear = (keep) => { for (const e of r.enemies) if (!keep(e) && !e.name) Object.assign(e, { x: 1, y: 1, hp: 0, act: 'dead', respawns: false, death: 'burst' }); };
    const info = {};
    if (what === 'causeway') {
      clear((e) => Math.hypot(e.x - 39, e.y - 42) < 6);
      Object.assign(h, { x: 33, y: 43.2, fx: 1, fy: 0 });
      const sk = r.enemies.find((e) => e.variant === 'skimmer');
      step(50);
      if (sk) Object.assign(sk, { alert: true, cooldown: 0, pourAt: -99 });
      step(32);
      info.skimmer = sk && sk.attack && sk.attack.kind, (info.slicks = (r.slicks || []).length);
    } else if (what === 'ambush') {
      const lk = r.enemies.filter((e) => e.task && e.task.k === 'lurk'), first = lk[0];
      clear((e) => e.task && e.task.k === 'lurk' && e.pack === first.pack);
      Object.assign(h, { x: first.x + 2.3, y: first.y + 0.4, fx: -1, fy: 0 });
      step(7);
      info.up = first.task.up, (info.t = r.time);
    } else if (what === 'ford') {
      clear((e) => Math.hypot(e.x - 47, e.y - 31) < 4.5);
      Object.assign(h, { x: 47.4, y: 34.2, fx: 0, fy: -1 });
      for (const e of r.enemies) e.alert = true;
      const gf = r.enemies.find((e) => e.variant === 'gaffer');
      for (let i = 0; i < 90 && !(gf && gf.attack); i++) step(1);
      step(6);
      info.hook = gf && gf.attack && gf.attack.kind;
    } else if (what === 'mist') {
      // The thickest bank over the reeds at its thickest, two goblins winding up blows in it, you at its edge.
      const b = r.map.fen.mist[0], T = Math.PI * 2;
      const t = ((((Math.PI / 2 - b.ph * 6 - b.b) % T) + T) % T) / T * b.pb, u = (t / b.pa) * T + b.a;
      const bx = b.x + Math.cos(u) * 3.2, by = b.y + Math.sin(u * 2) * 3.2 * 0.4;
      clear(() => false);
      r.time = t;
      Object.assign(h, { x: bx - 2.6, y: by + 1.6, fx: 1, fy: 0 });
      const live = r.enemies.filter((e) => e.kind === 'scrapper').slice(0, 2);
      live.forEach((e, i) => {
        Object.assign(e, { x: bx + (i ? 1.6 : -0.6), y: by + (i ? -0.8 : 0.6), hp: 30, act: 'attack', actT: 0, death: '', task: undefined, alert: true, dozing: false, fx: -1, fy: 0 });
        e.attack = { kind: 'slam', t: 0.55, windup: 1.0, active: 0.1, recover: 0.6, dmg: 10, knock: 3, unblockable: i === 1, dx: -1, dy: 0, ox: e.x, oy: e.y, range: 0, arc: 0, cx: e.x - 0.8, cy: e.y, radius: 1.1, done: false };
      });
      info.at = [bx, by], (info.t = t), (info.tele = live.map((e) => [e.attack.cx, e.attack.cy]));
    }
    g.step = () => [];
    for (const q of r.heroes) r.prev.set('h:' + q.id, [q.x, q.y]);
    for (const e of r.enemies) r.prev.set('e:' + e.id, [e.x, e.y]);
    await wait(10);
    return info;
  }, what);
}

(async () => {
  const browser = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const errors = [];
  for (const look of ['flat', '3d']) {
    const ctx = await browser.newContext(PHONE), page = await ctx.newPage();
    page.on('pageerror', (e) => errors.push(`${look} ${e}`));
    page.on('console', (m) => m.type() === 'error' && errors.push(`${look} ${m.text()}`));
    for (const what of ['causeway', 'ambush', 'ford', 'mist']) {
      await into(page, look);
      const info = await scene(page, what);
      await page.waitForTimeout(2500);
      await page.screenshot({ path: `${out}/fen-${what}-${look}.png` });
      console.log(what, look, JSON.stringify(info), await page.evaluate(() => window.__game.goalText && window.__game.goalText()));
      if (what === 'mist') {
        // The same frame with the mist taken off: the telegraphs' pixels should be the same in both.
        await page.evaluate(() => { window.__game.room.map.fen.mist.forEach((b) => (b.pb = 1e9, b.b = -Math.PI / 2, b.ph = 0)); });
        await page.waitForTimeout(800);
        await page.screenshot({ path: `${out}/fen-mist-thin-${look}.png` });
      }
    }
    // The board: Fenmere in the list, and its card.
    await page.goto(`${url}${look === '3d' ? '&look=3d' : ''}`);
    await page.waitForFunction(() => window.__game && window.__openSpot, null, { timeout: 60000 });
    await page.evaluate(() => window.__openSpot('board'));
    await page.waitForTimeout(1200);
    await page.evaluate(() => { const l = document.querySelector('#panel .jlist'); if (l) l.lastElementChild.scrollIntoView(); });
    await page.waitForTimeout(400);
    await page.screenshot({ path: `${out}/fen-board-${look}.png` });
    const i = await page.evaluate(() => window.__game.jobs().findIndex((j) => j.exped === 'fen'));
    await page.click(`#panel [data-open="${i}"]`);
    await page.waitForTimeout(800);
    await page.screenshot({ path: `${out}/fen-card-${look}.png` });
    console.log('board', look, await page.evaluate(() => document.querySelector('#panel')?.innerText.slice(0, 400)));
    await ctx.close();
  }
  await browser.close();
  console.log(errors.length ? 'ERRORS\n' + errors.join('\n') : 'no page errors');
})();
