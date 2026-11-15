// The new look's characters (docs/decisions/new-look-characters.md): the knight and two knife goblins in Wickhold's test
// street at night, one goblin walking at you and one stabbing, the knight walking then swinging, for each way of
// making them (sheet, parts, and old for comparison). Usage: node scripts/chars-look.cjs [url] [outdir] [modes] [dev].
// Writes <dev>-<mode>-<scene>-<n>.png, four frames a scene.
const { chromium } = require('playwright');
const url = process.argv[2] || 'http://localhost:4173/';
const out = process.argv[3] || 'shots';
const modes = (process.argv[4] || 'sheet,parts,old').split(',');
const devs = (process.argv[5] || 'laptop').split(',');
const MIDNIGHT = 2400000 * 700 + 60000;
const DEV = { laptop: { viewport: { width: 1280, height: 800 }, deviceScaleFactor: 1 }, phone: { viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true } };

// Each scene holds everyone where it says, every 16 ms (the room would move them).
const SCENES = {
  // The knight walking away up the street toward two goblins coming at him.
  walk: { hero: { x: 31, y: 21, fx: 0, fy: -1, moving: true, act: 'idle' }, gobs: [{ x: 30, y: 18.6, fx: 0.2, fy: 0.98, moving: true }, { x: 32.2, y: 18.9, fx: -0.3, fy: 0.95, moving: true }] },
  // Side-on: the knight swinging east at a goblin stabbing west, another coming.
  fight: { hero: { x: 30.4, y: 21, fx: 1, fy: 0, moving: false, act: 'attack' }, gobs: [{ x: 31.9, y: 21.05, fx: -1, fy: 0, moving: false, stab: true }, { x: 32.6, y: 19.6, fx: -0.6, fy: 0.8, moving: true }] },
};

(async () => {
  const browser = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  for (const dev of devs) for (const mode of modes) for (const [name, sc] of Object.entries(SCENES)) {
    const ctx = await browser.newContext(DEV[dev]);
    const page = await ctx.newPage();
    const errors = [];
    page.on('pageerror', (e) => errors.push(String(e)));
    page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
    await page.goto(url + '?look=3d&hd&street&chars=' + mode);
    await page.waitForFunction(() => window.__game);
    // No runner's arrival scene (its camera cut would leave the knight): the errand told as the hero is made.
    await page.evaluate(() => { const g = window.__game; g.create('WARRIOR', 'BRANNOCK'); if (g.profile.errands) g.profile.errands.told = true; document.getElementById('title').hidden = true; window.__title.open = false; });
    await page.waitForTimeout(300);
    await page.evaluate(() => { const g = window.__game; if (g.mode === 'wood') g.skipWood(); if (g.profile.errands) g.profile.errands.told = true; });
    await page.evaluate((ms) => { Date.now = () => ms; }, MIDNIGHT);
    await page.evaluate((sc) => {
      const g = window.__game, room = window.__room;
      const gob = (id, o) => ({ id, kind: 'scrapper', x: o.x, y: o.y, kvx: 0, kvy: 0, fx: o.fx, fy: o.fy, hp: 30, maxHp: 30, radius: 0.4, weight: 1, act: 'chase', actT: 0, actDur: 0, attack: null, cooldown: 99, hitstop: 0, hitAt: -9, moving: o.moving, home: { x: o.x, y: o.y }, corpse: '', burnUntil: 0, burnNext: 0, chillUntil: 0, frozenUntil: 0, snareUntil: 0, lastBy: '', death: '', respawns: false, z: 0 });
      const gobs = sc.gobs.map((o, i) => gob(9001 + i, o));
      // The room held still: nothing moves anyone but this (an attack's lunge, snapped back, read as walking to and
      // fro, would swing the chase camera).
      g.step = () => [];
      setInterval(() => {
        const s = (performance.now() / 1000) % 1.1, r = window.__room;
        Object.assign(g.hero, { x: sc.hero.x, y: sc.hero.y, fx: sc.hero.fx, fy: sc.hero.fy, moving: sc.hero.moving, hp: 999, act: sc.hero.act, actT: sc.hero.act === 'attack' ? s * 0.55 : 0, heavy: false, combo: 0 });
        r.prev?.set('h:' + g.hero.id, [sc.hero.x, sc.hero.y]);
        gobs.forEach((e, i) => {
          const o = sc.gobs[i];
          Object.assign(e, { x: o.x, y: o.y, fx: o.fx, fy: o.fy, moving: o.moving, act: o.stab ? 'attack' : 'chase', hp: 30 });
          e.attack = o.stab ? { kind: 'stab', t: s * 0.9, windup: 0.5, active: 0.12, recover: 0.4, dmg: 0, knock: 0, unblockable: false, dx: o.fx, dy: o.fy, ox: o.x, oy: o.y, range: 1.2, arc: 1 } : null;
          r.prev?.set('e:' + e.id, [o.x, o.y]);
          if (!r.enemies.includes(e)) r.enemies.push(e);
        });
      }, 16);
    }, sc);
    await page.waitForTimeout(5000);
    for (let n = 0; n < 4; n++) {
      await page.screenshot({ path: `${out}/${dev}-${mode}-${name}-${n}.png` });
      if (process.env.DEBUG) console.log(await page.evaluate(() => { const g = window.__game, r = window.__room, h = r.heroes[0]; return JSON.stringify({ gh: [g.hero.x, g.hero.y], rh: [h.x, h.y, h.act, h === g.hero], mode: g.mode, map: r.map.name, n: r.enemies.length, doz: window.__town().dozing }); }));
      await page.waitForTimeout(170);
    }
    console.log(dev, mode, name, errors.length ? 'ERRORS ' + JSON.stringify(errors.slice(0, 3)) : 'ok');
    await ctx.close();
  }
  await browser.close();
})();
