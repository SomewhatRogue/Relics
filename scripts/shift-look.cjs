// A shift at Halvard's forge, to look at on a phone (390x844 at 3x, touch): the forge's panel with WORK A
// SHIFT, Halvard's offer and the board, the shift mid-play (a bot in the page striking on the peaks), and
// the card at the bell. Prints the shift's numbers and any page errors.
// Usage: node scripts/shift-look.cjs <url> <outdir>
const fs = require('fs');
const { chromium } = require('playwright');
const [url = 'http://localhost:4651/', out = 'shots/shift'] = process.argv.slice(2);
const go = (q) => url + (url.includes('?') ? '&' : '?') + q;
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

(async () => {
  fs.mkdirSync(out, { recursive: true });
  const browser = await chromium.launch();
  const errors = [], report = {};
  try {
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true });
    const page = await ctx.newPage();
    page.on('pageerror', (e) => errors.push(String(e)));
    page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
    await page.goto(go('hero=WARRIOR&day=0.85'));
    await page.waitForFunction(() => typeof window.render_game_to_text === 'function' && window.__game?.hero);
    await page.evaluate(() => { if (window.__game.mode === 'wood') window.__game.skipWood(); document.getElementById('title').hidden = true; window.__title.open = false; window.__game.profile.gold = 120; });
    await wait(300);
    report.place = await page.evaluate(() => { const g = window.__game; if (g.outside) g.leave(); g.enter(g.room.map.blocks.find((b) => b.door === 'forge')); return g.room.map.name; });
    await wait(400);
    // The forge's panel, then the shift's.
    await page.evaluate(() => window.__openSpot('smith'));
    await wait(300);
    await page.screenshot({ path: `${out}/shift-forge-phone.png` });
    await page.evaluate(() => [...document.querySelectorAll('#panel button')].find((b) => b.textContent === 'WORK A SHIFT')?.click());
    await wait(300);
    await page.screenshot({ path: `${out}/shift-desk-phone.png` });
    await page.evaluate(() => [...document.querySelectorAll('#panel button')].find((b) => b.textContent === 'WORK A SHIFT')?.click());
    await wait(200);
    report.mode = await page.evaluate(() => [window.__game.mode, window.__game.pastime]);
    // A smith in the page: a press just before each peak (it lands on the next step).
    await page.evaluate(() => {
      let last = -1;
      const bot = () => {
        const a = window.__shift;
        if (!a || a.s.over) return;
        const s = a.s, p = s.piece, t = s.frame / 60;
        if (p) {
          const i = p.peaks.findIndex((q, k) => !p.used[k] && !p.passed[k]);
          if (i >= 0 && t >= p.peaks[i] - 0.03 && t - last > 0.25) (last = t), document.getElementById('pastime').dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
        }
        requestAnimationFrame(bot);
      };
      bot();
    });
    await wait(30000);
    // Mid-play, as a strike lands.
    await page.waitForFunction(() => window.__shift.s.events.some((e) => e.k === 'strike') || window.__shift.s.piece?.marks.length, null, { timeout: 5000 }).catch(() => {});
    await wait(60);
    await page.screenshot({ path: `${out}/shift-play-phone.png` });
    report.mid = await page.evaluate(() => { const s = window.__shift.s; return { t: Math.round(s.t), score: s.score, made: s.made, streak: s.streak, piece: s.piece?.kind }; });
    await page.waitForFunction(() => window.__shift.s.over, null, { timeout: 60000 });
    await wait(1800);
    await page.screenshot({ path: `${out}/shift-card-phone.png` });
    report.end = await page.evaluate(() => { const s = window.__shift.s, g = window.__game; return { score: s.score, made: s.made, spoiled: s.spoiled, clean: s.clean, fair: s.fair, cold: s.cold, gold: g.profile.gold, rec: g.profile.shift, board: g.world.shift, card: document.querySelector('#panel')?.innerText.slice(0, 400) }; });
    await page.evaluate(() => [...document.querySelectorAll('#panel button')].find((b) => b.textContent === 'BACK TO THE FORGE')?.click());
    await wait(200);
    report.after = await page.evaluate(() => [window.__game.mode, window.__game.pastime]);
  } catch (e) {
    errors.push(String(e));
  }
  await browser.close();
  console.log(JSON.stringify({ ...report, errors }, null, 1));
})();
