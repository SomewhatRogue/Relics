// Magic and class kits on screen: laptop casts fire sparks as a Mage; phone shows the chips and a Ranger.
const { chromium } = require('playwright');
const url = process.argv[2] || 'http://localhost:4173/';
const statuses = () => {
  const r = window.__room, t = r.time, [b, , , s1, s2] = r.enemies;
  Object.assign(s1, { x: 7, y: 6, cooldown: 99, burnUntil: t + 30, burnNext: t + 0.5 });
  Object.assign(s2, { x: 11, y: 6, cooldown: 99, frozenUntil: t + 30 });
  Object.assign(b, { x: 9, y: 4, cooldown: 99, chillUntil: t + 30 });
  Object.assign(r.heroes[0], { x: 9, y: 9 });
};
(async () => {
  const browser = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const errors = [];
  {
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 }, deviceScaleFactor: 2 });
    const page = await ctx.newPage();
    page.on('pageerror', (e) => errors.push(String(e)));
    await page.goto(url);
    await page.waitForFunction(() => typeof window.render_game_to_text === 'function');
    for (const k of ['c', 'c', 'c', 't']) await page.keyboard.press(k), await page.waitForTimeout(80);
    await page.evaluate(statuses);
    await page.mouse.move(640, 120);
    for (let i = 0; i < 3; i++) await page.mouse.down(), await page.waitForTimeout(40), await page.mouse.up(), await page.waitForTimeout(140);
    await page.screenshot({ path: 'shots/magic-laptop.png' });
    console.log('laptop', await page.evaluate(() => { const h = window.__room.heroes[0]; return h.weapon + ' ' + h.augments[h.relic] + ' bolts ' + window.__room.bolts.length + ' | ' + document.querySelector('#hud').innerText.replace(/\n/g, ' / '); }));
    await ctx.close();
  }
  {
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true });
    const page = await ctx.newPage();
    page.on('pageerror', (e) => errors.push(String(e)));
    await page.goto(url);
    await page.waitForFunction(() => typeof window.render_game_to_text === 'function');
    const tap = async (sel) => { const b = await page.locator(sel).boundingBox(); await page.touchscreen.tap(b.x + b.width / 2, b.y + b.height / 2); await page.waitForTimeout(120); };
    await tap('.swap-class');
    await tap('.augment');
    await tap('.augment');
    await page.evaluate(statuses);
    await page.waitForTimeout(500);
    await page.screenshot({ path: 'shots/magic-phone.png' });
    console.log('phone', await page.evaluate(() => { const h = window.__room.heroes[0]; return h.weapon + ' ' + h.augments[h.relic] + ' | ' + document.querySelector('#hud').innerText.replace(/\n/g, ' / '); }));
    await ctx.close();
  }
  console.log('errors', JSON.stringify(errors));
  await browser.close();
})();
