// The town's pastimes, to look at on a phone (390x844 at 3x, touch): fishing at the millpond (cast,
// the bite, mid-reel) and a round at the archery butts (arrows in, targets sliding and swinging), plus
// Pennock's and Abel's panels and the cards at the end. The town view with friends parked at both is
// taken by scripts/town-online.cjs (it needs the relay).
// Usage: node scripts/pastime-look.cjs <url> <outdir>
const fs = require('fs');
const { chromium } = require('playwright');
const [url = 'http://localhost:4461/', out = 'shots'] = process.argv.slice(2);
const go = (q) => url + (url.includes('?') ? '&' : '?') + q;
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

(async () => {
  fs.mkdirSync(out, { recursive: true });
  const browser = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const errors = [], report = {};
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true });
  const page = await ctx.newPage();
  page.on('pageerror', (e) => errors.push(String(e)));
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  await page.goto(go('hero=RANGER&day=0.42'));
  await page.waitForFunction(() => typeof window.render_game_to_text === 'function' && window.__game?.hero);
  await page.evaluate(() => { if (window.__game.mode === 'wood') window.__game.skipWood(); document.getElementById('title').hidden = true; window.__title.open = false; });
  await wait(500);
  // Pennock's panel, walked up to.
  await page.evaluate(() => { Object.assign(window.__game.hero, { x: 48.3, y: 31.4 }); });
  await wait(400);
  await page.screenshot({ path: `${out}/pond-town-phone.png` });
  await page.evaluate(() => window.__openSpot('fish'));
  await wait(2500);
  await page.screenshot({ path: `${out}/pond-pennock-phone.png` });
  await page.evaluate(() => window.__panel.hide());
  // Fishing: hold to swing the cast, let go, wait for the bite, strike, and reel.
  await page.evaluate(() => window.__pastime.fish());
  await wait(600);
  await page.mouse.move(195, 500);
  await page.mouse.down();
  await wait(500);
  await page.screenshot({ path: `${out}/fish-aim-phone.png` });
  await page.mouse.up();
  await wait(1500);
  await page.screenshot({ path: `${out}/fish-wait-phone.png` });
  await page.waitForFunction(() => window.__fish.s.phase === 'bite', null, { timeout: 20000 });
  await page.screenshot({ path: `${out}/fish-bite-phone.png` });
  await page.mouse.down();
  await wait(1100);
  await page.screenshot({ path: `${out}/fish-reel-phone.png` });
  report.reel = await page.evaluate(() => ({ phase: window.__fish.s.phase, tension: window.__fish.s.tension, fish: window.__fish.s.fish }));
  // Reel like a careful player: hold in the rests, let go when it runs.
  for (let i = 0; i < 400; i++) {
    const s = await page.evaluate(() => ({ phase: window.__fish.s.phase, run: window.__fish.s.running, k: window.__fish.s.tension }));
    if (s.phase !== 'reel') break;
    if (i === 40) await page.screenshot({ path: `${out}/fish-reel2-phone.png` });
    if (s.run || s.k > 0.75) await page.mouse.up();
    else await page.mouse.down();
    await wait(50);
  }
  await page.mouse.up();
  await wait(1200);
  report.fish = await page.evaluate(() => ({ phase: window.__fish.s.phase, why: window.__fish.s.why, fish: window.__fish.s.fish, record: window.__game.profile.fishing }));
  await page.screenshot({ path: `${out}/fish-card-phone.png` });
  await page.evaluate(() => window.__fish.close());
  // Abel's panel, then a round at the butts.
  await page.evaluate(() => window.__openSpot('range'));
  await wait(2500);
  await page.screenshot({ path: `${out}/butts-corin-phone.png` });
  await page.evaluate(() => window.__panel.hide());
  await page.evaluate(() => window.__pastime.range());
  await wait(400);
  for (let i = 0; i < 26; i++) {
    const p = await page.evaluate(() => {
      const r = window.__range, s = r.s, up = s.targets.filter((g) => g.end > s.t && s.t > g.t0 + 0.4).sort((a, b) => b.lane - a.lane)[0];
      if (!up) return null;
      return r.screen.toCss(...r.where(up, s.t + 0.3));
    });
    if (p) {
      await page.mouse.move(p[0], p[1]);
      await page.mouse.down();
      await wait(30);
      await page.mouse.up();
    }
    await wait(420);
    if (i === 18) await page.screenshot({ path: `${out}/range-round-phone.png` });
  }
  report.range = await page.evaluate(() => ({ t: window.__range.s.t, score: window.__range.s.score, shots: window.__range.s.shots, hits: window.__range.s.hits }));
  await page.evaluate(() => window.__range.end());
  await wait(800);
  await page.screenshot({ path: `${out}/range-card-phone.png` });
  report.mode = await page.evaluate(() => window.__game.mode);
  await page.evaluate(() => window.__range && window.__range.close());
  report.after = await page.evaluate(() => ({ mode: window.__game.mode, range: window.__game.profile.range, board: window.__game.world.range }));
  console.log(JSON.stringify({ report, errors }, null, 1));
  await browser.close();
})();
