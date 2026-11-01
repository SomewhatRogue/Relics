// Props on a phone: the room's furniture, a Warrior lifting a barrel and throwing it into two scrappers, the oil barrel going up.
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
    Object.assign(b, { x: 15, y: 4, cooldown: 99, act: 'stunned', actDur: 99 });
    Object.assign(s1, { x: 2.6, y: 3.2, cooldown: 99, act: 'stunned', actDur: 99 });
    Object.assign(s2, { x: 1.6, y: 3.6, cooldown: 99, act: 'stunned', actDur: 99 });
    Object.assign(h, { x: 2.2, y: 8.3, fx: 0, fy: -1 });
  });
  await page.waitForTimeout(300);
  await page.screenshot({ path: 'shots/props-room.png' });
  await tap('.tb.grab');
  await page.waitForTimeout(300);
  await page.screenshot({ path: 'shots/props-lifted.png' });
  await tap('.tb.grab');
  await page.waitForTimeout(250);
  await page.screenshot({ path: 'shots/props-throw.png' });
  await page.evaluate(() => {
    const r = window.__room, oil = r.props.find((p) => p.kind === 'oil'), [, , , s1] = r.enemies;
    Object.assign(s1, { x: oil.x - 0.9, y: oil.y + 0.2, act: 'stunned', actDur: 99, hp: 36 });
    oil.hp = 1;
    oil.lastBy = 'me';
    oil.kvx = 0.1;
    r.props.find((p) => p.kind === 'crate' && p.x > 15).kvy = -9;
  });
  await page.waitForTimeout(250);
  console.log(await page.evaluate(() => window.__room.props.map((p) => p.kind + (p.broken ? ':broken' : '')).join(' ')));
  console.log('errors', JSON.stringify(errors));
  await browser.close();
})();
