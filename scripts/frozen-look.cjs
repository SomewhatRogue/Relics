// A frozen goblin sent skidding by a greatsword and its crash into another, on a phone, FLAT and 2.5D.
// Fired for real through the room (the game's own step held, the room stepped here at 30 a second with a
// Warrior's intent, its events handed to the effects), then caught mid-slide and just after the crash.
// Usage: node scripts/frozen-look.cjs [url] [outdir]
const { chromium } = require('playwright');
const url = process.argv[2] || 'http://localhost:4411/';
const out = process.argv[3] || 'shots';
const PHONE = { viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true };

async function setup(page) {
  await page.goto(url + '?hero=WARRIOR');
  await page.waitForFunction(() => window.__game && window.__views && window.__fx);
  await page.evaluate(() => { const g = window.__game; document.getElementById('title').hidden = true; if (window.__title) window.__title.open = false; if (g.mode === 'wood') g.skipWood(); });
  await page.waitForTimeout(300);
  await page.evaluate(() => window.__game.enterYard());
  await page.waitForTimeout(800);
  await page.evaluate(() => {
    const g = window.__game, r = window.__room;
    g.step = () => [];
    r.props.length = 0;
    let seq = 500;
    /** Fresh: the hero below a frozen goblin, two more up the lane past it; then swing and step until `until()`. */
    window.__go = (until) => new Promise((done) => {
      const h = g.hero;
      Object.assign(h, { weapon: 'greatsword', x: 9, y: 10.6, fx: 0, fy: -1, act: 'idle', actT: 0, hp: h.maxHp });
      const spots = [[9, 9.3], [9.15, 4.6], [10.6, 4.4]];
      // The slider and the one it hits are scrappers (small); a butcher stands beside.
      const sc = r.enemies.filter((e) => e.kind === 'scrapper'), cast = [sc[0], sc[1], r.enemies.find((e) => e.kind === 'butcher')];
      r.heroes.forEach((o) => o !== h && Object.assign(o, { x: 16, y: 14 }));
      r.enemies.forEach((e) => {
        const s = spots[cast.indexOf(e)];
        Object.assign(e, s ? { x: s[0], y: s[1], act: 'chase', hp: 60, maxHp: 60, attack: null, cooldown: 99, kvx: 0, kvy: 0, respawns: false, sled: null, frozenUntil: 0, chillUntil: 0, death: '', fx: 0, fy: 1 } : { x: 16.5, y: 14.5, cooldown: 99 });
      });
      const ice = cast[0];
      ice.frozenUntil = r.time + 6;
      seq++;
      let k = 0, crashed = -1;
      const t = setInterval(() => {
        r.setIntent(h.id, { ...(r.intents.get(h.id) || {}), mx: 0, my: 0, ax: 0, ay: -3, attack: false, attackSeq: seq });
        r.step();
        for (const ev of r.events) window.__fx.on(ev), ev.k === 'icecrash' && (crashed = k);
        // The two up the lane wait where they are till something hits them.
        if (crashed < 0) cast.slice(1).forEach((e, i) => Object.assign(e, { x: spots[i + 1][0], y: spots[i + 1][1], kvx: 0, kvy: 0, cooldown: 99 }));
        k++;
        const st = until(ice, crashed, k);
        if (st || k > 150) clearInterval(t), done({ k, y: +ice.y.toFixed(2), sled: !!ice.sled, dead: ice.act === 'dead', death: ice.death, hp: cast.slice(1).map((e) => [e.hp, e.act]), err: !st });
      }, 33);
    });
  });
}

async function shoot(page, name, errors, until) {
  for (const v of ['flat', '3d']) {
    await page.evaluate((v) => window.__views.switch.set(v === '3d' ? '3d' : 'pixel'), v);
    if (v === '3d') await page.waitForFunction(() => window.__views.is3d, null, { timeout: 20000 });
    await page.waitForTimeout(v === '3d' ? 1500 : 500);
    const state = await page.evaluate((u) => window.__go((0, eval)('(' + u + ')')), until);
    await page.screenshot({ path: `${out}/${name}-${v}.png` });
    console.log(name, v, JSON.stringify(state), errors.length ? 'ERRORS ' + JSON.stringify(errors.slice(0, 3)) : 'ok');
  }
}

(async () => {
  const browser = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const ctx = await browser.newContext(PHONE), page = await ctx.newPage(), errors = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  await setup(page);
  // Mid-slide: a couple of tiles up the lane, the trail behind it.
  await shoot(page, 'frozen-flying', errors, '(e) => !!e.sled && e.y < 7.4');
  // Just after the crash: the shards, the ring, the SHATTER, the one it hit knocked down.
  await shoot(page, 'frozen-crash', errors, '(e, c, k) => c >= 0 && k >= c + 3');
  await browser.close();
})();
