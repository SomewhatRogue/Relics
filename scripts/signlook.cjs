// Each class's own button and its step in the wood (sim/woodsign.ts), on a phone: the Rogue's card and
// SHADOW STEP, the Ranger's card and MARK (flat and 2.5D), the Healer's Hew struck, card and MEND, and
// BUTTONS. One browser, one server. Usage: node scripts/signlook.cjs [url] [outdir]  (prints page errors)
const { chromium } = require('playwright');
const url = process.argv[2] || 'http://localhost:4408/';
const out = process.argv[3] || 'shots';
const phone = { viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true };

/** A fresh hero of `cls` at the clearing's lesson, done: its own step comes out. */
async function toStep(page, cls) {
  await page.evaluate((cls) => {
    window.__game.create(cls, 'STRAY');
    document.getElementById('title').hidden = true;
    window.__title.open = false;
  }, cls);
  await page.waitForTimeout(300);
  await page.evaluate(() => {
    const g = window.__game, w = g.wood, h = g.hero;
    Object.assign(w, { wake: -1, said: 99, hold: null, from: null, stage: 2, entered: false });
    g.room.enemies = g.room.enemies.filter((e) => e.act === 'dead');
    for (let i = 0; i < 2; i++) g.room.map.blocks = g.room.map.blocks.filter((b) => !(b.kind === 'fence' && b.x < 30));
    Object.assign(h, { act: 'idle', actT: 0, actDur: 0, lying: false, x: 29, y: 20, fx: 1, fy: 0 });
  });
  await page.waitForTimeout(200);
  await page.evaluate(() => {
    const g = window.__game, w = g.wood;
    w.hold = null;
    for (const e of g.room.enemies) if (w.ids.includes(e.id)) Object.assign(e, { hp: 0, act: 'dead' });
    w.count = 9;
    w.praised = 99;
  });
  await page.waitForTimeout(300);
}

/** Tap the card away (a first tap finishes Hew's line). */
async function goOn(page) {
  for (let i = 0; i < 4; i++) {
    const held = await page.evaluate(() => { const g = window.__game; if (g.wood.hold) g.continueHold(); return !!g.wood.hold; });
    if (!held) return;
    await page.waitForTimeout(120);
  }
}

(async () => {
  const browser = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const shot = async (page, name) => page.screenshot({ path: `${out}/${name}.png` });
  for (const [cls, look] of [['ROGUE', 'flat'], ['RANGER', 'flat'], ['RANGER', '3d'], ['HEALER', 'flat']]) {
    const ctx = await browser.newContext(phone);
    const page = await ctx.newPage();
    const errors = [];
    page.on('pageerror', (e) => errors.push(String(e)));
    page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
    await page.goto(url + (look === '3d' ? '?look=3d' : ''));
    await page.waitForFunction(() => window.__game);
    await toStep(page, cls);
    const tag = `${cls.toLowerCase()}${look === '3d' ? '-3d' : ''}`;
    if (cls === 'ROGUE') {
      await page.waitForTimeout(1500);
      await shot(page, `${tag}-1-card`);
      await goOn(page);
      await page.waitForTimeout(700);
      await shot(page, `${tag}-2-button`);
      // Face the nearer of the two and tap SHADOW STEP.
      await page.evaluate(() => {
        const g = window.__game, h = g.hero, t = g.room.enemies.filter((e) => g.wood.ids.includes(e.id))[0];
        Object.assign(h, { x: t.x - t.fx * 4.5, y: t.y - t.fy * 4.5 });
        const d = Math.hypot(t.x - h.x, t.y - h.y);
        Object.assign(h, { fx: (t.x - h.x) / d, fy: (t.y - h.y) / d });
      });
      await page.waitForTimeout(300);
      await shot(page, `${tag}-3-before`);
      await page.tap('.tb.sign');
      await page.waitForTimeout(350);
      await shot(page, `${tag}-4-step`);
      await page.tap('.tb.attack');
      await page.waitForTimeout(400);
      await shot(page, `${tag}-5-stab`);
    }
    if (cls === 'RANGER') {
      if (look === 'flat') await page.waitForTimeout(1500), await shot(page, `${tag}-1-card`);
      await page.evaluate(() => {
        const g = window.__game, h = g.hero, t = g.room.enemies.filter((e) => g.wood.ids.includes(e.id))[0];
        Object.assign(h, { x: t.x - 5, y: t.y + 1, fx: 1, fy: -0.2 });
      });
      await goOn(page);
      await page.waitForTimeout(700);
      await page.tap('.tb.sign');
      await page.waitForTimeout(500);
      await shot(page, `${tag}-2-mark`);
      await page.waitForTimeout(1200);
      await shot(page, `${tag}-3-marked`);
    }
    if (cls === 'HEALER') {
      await page.evaluate(() => Object.assign(window.__game.hero, { x: 30, y: 19 }));
      await page.waitForFunction(() => window.__game.wood.sign && window.__game.wood.sign.phase === 'fight', null, { timeout: 8000 }).catch(() => {});
      await page.waitForTimeout(250);
      await shot(page, `${tag}-1-hewhit`);
      await page.waitForTimeout(1200);
      await shot(page, `${tag}-2-fight`);
      await page.evaluate(() => {
        const g = window.__game;
        for (const e of g.room.enemies) if (g.wood.ids.includes(e.id)) Object.assign(e, { hp: 0, act: 'dead' });
        const n = g.room.map.npcs.find((x) => x.talk === 'hew');
        Object.assign(g.hero, { x: n.x + 3, y: n.y - 1.5, hp: Math.round(g.hero.maxHp * 0.7) });
      });
      await page.waitForTimeout(1500);
      await shot(page, `${tag}-3-card`);
      await goOn(page);
      await page.waitForTimeout(300);
      await page.tap('.tb.sign');
      await page.waitForTimeout(220);
      await shot(page, `${tag}-4-mend`);
      await page.waitForTimeout(1200);
      await shot(page, `${tag}-5-after`);
      await page.evaluate(() => document.querySelector('#legendbtn').click());
      await page.waitForTimeout(600);
      await shot(page, `${tag}-6-buttons`);
    }
    console.log(tag, errors.length ? 'ERRORS ' + JSON.stringify(errors) : 'no errors');
    await ctx.close();
  }
  await browser.close();
})();
