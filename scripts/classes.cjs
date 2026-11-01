// The class kits on screen. Laptop: a Mage's lodestone pulling scrappers, then a Ranger at full draw.
// Phone: a Healer blessing the hurt squire and calling down a smite.
const { chromium } = require('playwright');
const url = process.argv[2] || 'http://localhost:4173/';
(async () => {
  const browser = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const errors = [];
  const open = async (opts) => {
    const ctx = await browser.newContext(opts);
    const page = await ctx.newPage();
    page.on('pageerror', (e) => errors.push(String(e)));
    await page.goto(url);
    await page.waitForFunction(() => typeof window.render_game_to_text === 'function');
    return { ctx, page };
  };
  const place = () => {
    const r = window.__room, [b, , , s1, s2] = r.enemies;
    Object.assign(s1, { x: 7, y: 5, cooldown: 99 });
    Object.assign(s2, { x: 11, y: 5, cooldown: 99 });
    Object.assign(b, { x: 9, y: 3, cooldown: 99 });
    Object.assign(r.heroes[0], { x: 9, y: 9 });
  };
  {
    const { ctx, page } = await open({ viewport: { width: 1280, height: 800 }, deviceScaleFactor: 2 });
    for (let i = 0; i < 3; i++) await page.keyboard.press('c'), await page.waitForTimeout(60);
    await page.keyboard.press('t');
    await page.evaluate(place);
    await page.mouse.move(640, 260);
    await page.keyboard.press('e');
    await page.waitForTimeout(1300);
    await page.screenshot({ path: 'shots/class-mage.png' });
    for (let i = 0; i < 3; i++) await page.keyboard.press('c'), await page.waitForTimeout(150);
    await page.evaluate(place);
    await page.mouse.down();
    await page.waitForTimeout(1500);
    await page.screenshot({ path: 'shots/class-ranger.png' });
    await page.mouse.up();
    console.log('laptop', await page.evaluate(() => window.__room.heroes[0].weapon));
    await ctx.close();
  }
  {
    const { ctx, page } = await open({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true });
    const tap = async (sel) => { const b = await page.locator(sel).boundingBox(); await page.touchscreen.tap(b.x + b.width / 2, b.y + b.height / 2); await page.waitForTimeout(120); };
    for (let i = 0; i < 4; i++) await tap('.swap-class');
    await page.evaluate(() => { const r = window.__room, q = r.heroes.find((h) => h.id === 'squire'); q.hp = 35; Object.assign(r.heroes[0], { x: 11, y: 10 }); });
    await tap('.tb.relic');
    await page.waitForTimeout(500);
    await page.screenshot({ path: 'shots/class-healer-bless.png' });
    await page.evaluate(place);
    const b = await page.locator('.attack').boundingBox();
    const cdp = await ctx.newCDPSession(page);
    const pt = { x: b.x + b.width / 2, y: b.y + b.height / 2 };
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [pt] });
    await page.waitForTimeout(1350);
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    await page.waitForTimeout(480);
    await page.screenshot({ path: 'shots/class-healer-smite.png' });
    console.log('phone', await page.evaluate(() => { const r = window.__room, q = r.heroes.find((h) => h.id === 'squire'); return r.heroes[0].weapon + ' squire hp ' + q.hp + ' blessed ' + (q.blessedUntil > r.time); }));
    await ctx.close();
  }
  console.log('errors', JSON.stringify(errors));
  await browser.close();
})();
