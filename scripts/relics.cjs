// Relics as things you own, at phone and laptop sizes: the church's relic panel (recharge, leave, two
// for one), the forge mid-way and done, a relic's card in the pack, and relics in a fight (the RELIC
// button's charge, a wind-up bow, a bell and a knuckle wound up, a bomb in the air) in FLAT and 2.5D.
// Usage: node scripts/relics.cjs [url] [outdir]
const { chromium } = require('playwright');
const url = process.argv[2] || 'http://localhost:4210/';
const out = process.argv[3] || 'shots';

(async () => {
  const browser = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  for (const [dev, opts] of [['phone', { viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true }], ['laptop', { viewport: { width: 1280, height: 800 }, deviceScaleFactor: 2 }]]) {
    const ctx = await browser.newContext(opts);
    const page = await ctx.newPage();
    const errors = [];
    page.on('pageerror', (e) => errors.push(String(e)));
    page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
    const shot = (n) => page.screenshot({ path: `${out}/${dev}-${n}.png` });
    const skip = async () => { for (let i = 0; i < 5; i++) await page.evaluate(() => document.querySelector('#panel .body')?.click()), await page.waitForTimeout(70); };
    await page.goto(url + '?look=flat');
    await page.waitForFunction(() => window.__game);
    await page.evaluate(() => { window.__game.create('WARRIOR', 'BRANNOCK'); document.getElementById('title').hidden = true; window.__title.open = false; });
    await page.waitForTimeout(300);
    await page.evaluate(() => window.__game.mode === 'wood' && window.__game.skipWood());
    // A hero with a few relics: one fading, one dark, two elemental.
    await page.evaluate(() => {
      const g = window.__game, p = g.profile, jav = p.relics[0];
      jav.charge = 9;
      const mk = (id, kind, tier, el, charge) => ({ id, kind, tier, el, charge });
      p.relics.push(mk('rbell', 'bell', 1, '', 24), mk('rbomb', 'bomb', 2, 'frost', 30), mk('rsent', 'sentry', 3, 'storm', 40), mk('rknk', 'knuckle', 1, '', 0), mk('rlode', 'lodestone', 1, '', 18));
      p.relic = 'rsent';
      p.gold = 260;
      p.tally = false;
      g.relicsChanged();
    });
    await page.evaluate(() => window.__openSpot('church'));
    await skip();
    await page.evaluate(() => [...document.querySelectorAll('#panel button')].find((b) => b.textContent === 'RELICS')?.click());
    await skip();
    await shot('church-relics');
    // Recharge the javelin, leave the dark knuckle.
    await page.evaluate(() => document.querySelector('#panel [data-rop="recharge"]')?.click());
    await skip();
    await page.evaluate(() => document.querySelector('#panel [data-rop="leave"][data-rid="rlode"]')?.click());
    await skip();
    await shot('church-left');
    // Two for one: the bell and the frost bomb.
    await page.evaluate(() => document.querySelector('#panel [data-rpick="rbell"]')?.click());
    await page.evaluate(() => document.querySelector('#panel [data-rpick="rbomb"]')?.click());
    await skip();
    await page.evaluate(() => document.querySelector('#panel .rsec')?.scrollIntoView());
    await shot('church-two-for-one');
    await page.evaluate(() => document.querySelector('#panel [data-rop="give"]')?.click());
    await page.waitForTimeout(dev === 'phone' ? 600 : 1250);
    await shot('forge-mid');
    await page.waitForTimeout(450);
    await shot('forge-flash');
    await page.waitForTimeout(1300);
    await skip();
    await shot('forge-done');
    console.log(dev, 'after the forge', JSON.stringify(await page.evaluate(() => ({ relics: window.__game.profile.relics.map((r) => `${r.kind}:${r.tier}:${r.el}:${r.charge}`), lit: window.__game.profile.lit, forges: window.__game.profile.forges, gold: window.__game.profile.gold }))));
    await page.evaluate(() => window.__panel.hide());
    // The pack, the relic slot chosen.
    await page.evaluate(() => { const p = window.__game.profile; p.relic = 'rsent'; window.__game.relicsChanged(); window.__pack.toggle(true); });
    await page.waitForTimeout(200);
    await page.click('#pack [data-src="relic"]').catch((e) => console.log('pack click', String(e).slice(0, 80)));
    await page.waitForTimeout(200);
    await shot('pack-relic-card');
    await page.evaluate(() => window.__pack.toggle(false));
    // A fight: a village job, goblins held near, the wind-up bow set down by a real press.
    const job = await page.evaluateHandle(() => window.__villageJob(7));
    await page.evaluate((j) => window.__game.startJob(j), job);
    await page.waitForTimeout(900);
    await page.evaluate(() => {
      const g = window.__game, r = g.room, h = g.hero;
      Object.assign(h, { fx: 0, fy: -1 });
      const live = r.enemies.filter((e) => e.act !== 'dead').slice(0, 4);
      live.forEach((e, i) => Object.assign(e, { x: h.x - 2.5 + i * 1.6, y: h.y - 3.5 - (i % 2), cooldown: 99, alert: true, attack: null }));
    });
    if (dev === 'phone') await page.tap('.tb.relic2');
    else await page.keyboard.press('r');
    await page.waitForTimeout(1600);
    await shot('fight-sentry-flat');
    console.log(dev, 'in the fight', JSON.stringify(await page.evaluate(() => { const h = window.__game.hero; return { relic: h.relic, item: h.found.find((r) => r.id === h.relicItem), zones: window.__game.room.zones.map((z) => z.kind), lit: h.lit }; })));
    // The rest wound up for the picture: a bell's ring and a knuckle's line, a bomb in the air, and a friend spared.
    const stage = () => page.evaluate(() => {
      const g = window.__game, r = g.room, h = g.hero, t = r.time;
      // Held still for the picture (as skills3d.cjs does).
      g.step = () => [];
      r.enemies.filter((e) => e.act !== 'dead').slice(0, 3).forEach((e, i) => Object.assign(e, { x: h.x - 1 + i * 1.2, y: h.y - 4.2, attack: null, act: 'idle' }));
      Object.assign(h, { relic: 'knuckle', act: 'throw', actT: 0.15, actDur: 1, fx: 0, fy: -1 });
      r.zones = r.zones.filter((z) => z.kind !== 'sentry');
      r.zones.push({ kind: 'sentry', x: h.x + 2.5, y: h.y - 0.5, r: 5.5, at: t, next: t + 0.2, until: t + 6, owner: h.id, el: 'storm', ax: -0.6, ay: -0.8 });
      r.bolts = r.bolts.filter((b) => b.id !== 999);
      r.bolts.push({ id: 999, owner: h.id, kind: 'bomb', x: h.x - 2, y: h.y - 1.5, dx: 0, dy: -1, speed: 0, range: 0, travelled: 0, dmg: 16, knock: 15, pierce: false, burst: 2.2, el: '', hit: [], stun: 1, traits: [], sx: h.x, sy: h.y, tx: h.x - 3.5, ty: h.y - 3, t: 0.28, flight: 0.55, state: 'fly', life: 0, relic: true });
      r.pickups = r.pickups.filter((p) => p.id !== 998);
      r.pickups.push({ id: 998, x: h.x + 1.2, y: h.y + 1.5, life: 60, relic: { id: 'rx', kind: 'bell', tier: 2, el: 'fire', charge: 36 } });
    });
    await stage();
    await page.waitForTimeout(300);
    await shot('fight-telegraphs-flat');
    await page.evaluate(() => window.__views.switch.set('3d'));
    await page.waitForFunction(() => window.__views.is3d, null, { timeout: 20000 });
    await page.waitForTimeout(1200);
    await stage();
    await page.waitForTimeout(600);
    await shot('fight-telegraphs-3d');
    console.log(dev, 'errors', JSON.stringify(errors));
    await ctx.close();
  }
  await browser.close();
})();
