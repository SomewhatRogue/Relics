// Grab, throw and deaths on a phone: grab a stunned scrapper, hold it overhead, throw it into the
// other one; then a sword takes a head and a mace bursts a body.
const { chromium } = require('playwright');
const url = process.argv[2] || 'http://localhost:4173/?hero=WARRIOR';
(async () => {
  const browser = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const errors = [];
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true });
  const page = await ctx.newPage();
  page.on('pageerror', (e) => errors.push(String(e)));
  await page.goto(url);
  await page.waitForFunction(() => typeof window.render_game_to_text === 'function');
  const tap = async (sel) => { const b = await page.locator(sel).boundingBox(); await page.touchscreen.tap(b.x + b.width / 2, b.y + b.height / 2); await page.waitForTimeout(80); };
  await page.evaluate(() => {
    const r = window.__room, [b, , , s1, s2] = r.enemies, h = r.heroes[0];
    Object.assign(b, { x: 2, y: 14, cooldown: 99, act: 'stunned', actDur: 99 });
    Object.assign(s1, { x: 9, y: 8.2, act: 'stunned', actDur: 99, cooldown: 99 });
    Object.assign(s2, { x: 9, y: 4, act: 'stunned', actDur: 99, cooldown: 99 });
    Object.assign(h, { x: 9, y: 9, fx: 0, fy: -1 });
  });
  await page.waitForTimeout(300);
  await page.screenshot({ path: 'shots/brutal-grab-ready.png' });
  await tap('.tb.grab');
  await page.waitForTimeout(400);
  await page.screenshot({ path: 'shots/brutal-held.png' });
  await tap('.tb.grab');
  await page.waitForTimeout(260);
  await page.screenshot({ path: 'shots/brutal-throw.png' });
  await page.waitForTimeout(600);
  // A sword takes a head.
  await page.evaluate(() => {
    const r = window.__room, [, , , s1, s2] = r.enemies, h = r.heroes[0];
    Object.assign(s1, { x: 9, y: 8, hp: 3, act: 'stunned', actDur: 99, fx: 0, fy: 1 });
    Object.assign(s2, { x: 11, y: 7, hp: 3, act: 'stunned', actDur: 99 });
    Object.assign(h, { x: 9, y: 9, fx: 0, fy: -1, act: 'idle' });
  });
  await tap('.tb.attack');
  await page.waitForTimeout(350);
  await page.screenshot({ path: 'shots/brutal-behead.png' });
  console.log(await page.evaluate(() => window.__room.enemies.map((e) => e.kind + ':' + e.act + ':' + e.death).join(' ')));
  console.log('errors', JSON.stringify(errors));
  await browser.close();
})();
