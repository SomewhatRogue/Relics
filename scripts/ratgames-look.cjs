// The Drowned Rat's table and knife board and Halvard's anvil, to look at on a phone (390x844 at 3x,
// touch) and a laptop (Space for the button): the Rat inside, the panels, each game mid-play and its
// card. The view with friends parked at them is taken by scripts/town-online.cjs (it needs the relay).
// Usage: node scripts/ratgames-look.cjs <url> <outdir>
const fs = require('fs');
const { chromium } = require('playwright');
const [url = 'http://localhost:4491/', out = 'shots/ratgames'] = process.argv.slice(2);
const go = (q) => url + (url.includes('?') ? '&' : '?') + q;
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

async function start(browser, opts, cls, errors) {
  const ctx = await browser.newContext(opts);
  const page = await ctx.newPage();
  page.on('pageerror', (e) => errors.push(String(e)));
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  await page.goto(go(`hero=${cls}&day=0.85`));
  await page.waitForFunction(() => typeof window.render_game_to_text === 'function' && window.__game?.hero);
  await page.evaluate(() => { if (window.__game.mode === 'wood') window.__game.skipWood(); document.getElementById('title').hidden = true; window.__title.open = false; Object.assign(window.__game.profile, { gold: 400, steel: 60 }); });
  await wait(400);
  return page;
}
const into = (page, door) => page.evaluate((door) => { const g = window.__game; if (g.outside) g.leave(); g.enter(g.room.map.blocks.find((b) => b.door === door)); return g.room.map.name; }, door);

/** Hold under the band, let go over it, for `ms` (the arm-wrestler a careful player would be). */
async function wrestle(page, ms, key) {
  const t0 = Date.now();
  let down = false;
  while (Date.now() - t0 < ms) {
    const s = await page.evaluate(() => window.__arm && !window.__arm.s.over ? { g: window.__arm.s.grip, z: window.__arm.zone } : null);
    if (!s) break;
    const want = s.g < s.z;
    if (want !== down) {
      if (key) want ? await page.keyboard.down(' ') : await page.keyboard.up(' ');
      else want ? await page.mouse.down() : await page.mouse.up();
      down = want;
    }
    await wait(30);
  }
  if (down) key ? await page.keyboard.up(' ') : await page.mouse.up();
}
/** Throw when the point comes near the middle. */
async function throwKnives(page, n, key, shotAt, shot) {
  for (let i = 0; i < 400 && n > 0; i++) {
    const near = await page.evaluate(() => { const k = window.__knives, s = k.s; return !s.over && s.t >= s.readyAt && s.thrown < 9 && Math.hypot(...k.aim) < 6; });
    if (near) {
      key ? await page.keyboard.press(' ') : await page.mouse.click(195, 500);
      n--;
      if (n === shotAt && shot) await wait(120), await shot();
      await wait(300);
    }
    await wait(16);
  }
}
/** Strike as each glow peaks. */
async function strike(page, key, shot) {
  for (let i = 0; i < 600; i++) {
    const r = await page.evaluate(() => { const a = window.__anvil, s = a.s; if (s.over) return 'over'; const used = s.struck.map((x) => x.peak); return s.peaks.some((p) => !used.includes(p) && Math.abs(p - s.t) < 0.03) ? 'hit' : ''; });
    if (r === 'over') break;
    if (r === 'hit') {
      key ? await page.keyboard.press(' ') : await page.mouse.click(195, 500);
      const n = await page.evaluate(() => window.__anvil.s.struck.length);
      if (n === 1 && shot) await wait(30), await shot();
      await wait(120);
    }
    await wait(8);
  }
}

(async () => {
  fs.mkdirSync(out, { recursive: true });
  const browser = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const errors = [], report = {};
  const page = await start(browser, { viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true }, 'ROGUE', errors);
  report.rat = await into(page, 'tavern');
  await page.evaluate(() => Object.assign(window.__game.hero, { x: 15.4, y: 5.4 }));
  await wait(800);
  await page.screenshot({ path: `${out}/rat-inside-phone.png` });
  await page.evaluate(() => window.__openSpot('arm'));
  await wait(2500);
  await page.screenshot({ path: `${out}/arm-table-phone.png` });
  await page.evaluate(() => window.__panel.hide());
  // A bout against the watchman for 10.
  await page.evaluate(() => window.__pastime.arm('watch', 10));
  await wait(400);
  await wrestle(page, 3500);
  await page.screenshot({ path: `${out}/arm-bout-phone.png` });
  await wrestle(page, 40000);
  await wait(900);
  report.arm = await page.evaluate(() => ({ won: window.__arm.s.won, t: window.__arm.s.t, gold: window.__game.profile.gold, rec: window.__game.profile.arm, mode: window.__game.mode, pastime: window.__game.pastime }));
  await page.screenshot({ path: `${out}/arm-card-phone.png` });
  await page.evaluate(() => window.__arm.close());
  // The knife board for 25.
  await page.evaluate(() => window.__openSpot('knives'));
  await wait(2500);
  await page.screenshot({ path: `${out}/knife-board-phone.png` });
  await page.evaluate(() => window.__panel.hide());
  await page.evaluate(() => window.__pastime.knives(25));
  await wait(300);
  await throwKnives(page, 9, false, 4, () => page.screenshot({ path: `${out}/knives-round-phone.png` }));
  await wait(1200);
  report.knives = await page.evaluate(() => ({ score: window.__knives.s.score, house: window.__knives.house, gold: window.__game.profile.gold, rec: window.__game.profile.knives, mode: window.__game.mode }));
  await page.screenshot({ path: `${out}/knives-card-phone.png` });
  await page.evaluate(() => window.__knives.close());
  // The forge: Halvard's choice on a piece, then the anvil.
  report.forge = await into(page, 'forge');
  await page.evaluate(() => Object.assign(window.__game.hero, { x: 5, y: 4.6 }));
  await page.evaluate(() => window.__openSpot('smith'));
  await wait(2000);
  await page.evaluate(() => document.querySelector('#panel [data-src^="worn"]')?.click());
  await wait(700);
  await page.screenshot({ path: `${out}/forge-choice-phone.png` });
  await page.evaluate(() => window.__panel.hide());
  await page.evaluate(() => window.__pastime.anvil());
  await wait(300);
  await strike(page, false, () => page.screenshot({ path: `${out}/anvil-strike-phone.png` }));
  await wait(1200);
  report.anvil = await page.evaluate(() => ({ marks: window.__anvil.s.struck.map((x) => x.mark), armor: window.__game.profile.armor, strikes: window.__game.profile.strikes, mode: window.__game.mode }));
  await page.screenshot({ path: `${out}/anvil-card-phone.png` });
  await page.evaluate(() => window.__anvil.close());
  report.after = await page.evaluate(() => ({ mode: window.__game.mode, pastime: window.__game.pastime }));

  // A laptop, Space for the button, each game mid-play.
  const lap = await start(browser, { viewport: { width: 1280, height: 800 } }, 'WARRIOR', errors);
  await into(lap, 'tavern');
  await lap.evaluate(() => window.__pastime.arm('gannet', 0));
  await wait(300);
  await wrestle(lap, 3000, true);
  await lap.screenshot({ path: `${out}/arm-bout-laptop.png` });
  report.armLaptop = await lap.evaluate(() => ({ lean: window.__arm.s.lean, held: window.__arm.s.held }));
  await lap.evaluate(() => (window.__arm.quit(), window.__arm.close()));
  await lap.evaluate(() => window.__pastime.knives(0));
  await wait(300);
  await throwKnives(lap, 5, true, 1, () => lap.screenshot({ path: `${out}/knives-round-laptop.png` }));
  report.knivesLaptop = await lap.evaluate(() => ({ thrown: window.__knives.s.thrown, score: window.__knives.s.score }));
  await lap.evaluate(() => (window.__knives.quit(), window.__knives.close()));
  await into(lap, 'forge');
  await lap.evaluate(() => window.__pastime.anvil());
  await wait(300);
  await strike(lap, true, () => lap.screenshot({ path: `${out}/anvil-strike-laptop.png` }));
  report.anvilLaptop = await lap.evaluate(() => window.__anvil.s.struck.map((x) => x.mark));
  console.log(JSON.stringify({ report, errors }, null, 1));
  await browser.close();
})();
