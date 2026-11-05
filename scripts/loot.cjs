// Loot on screen: a forged drop by the hero on a phone (with the card), and taking it.
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
  await page.evaluate(() => {
    const r = window.__room, h = r.heroes[0], b = r.enemies[0];
    Object.assign(h, { x: 9, y: 9 });
    Object.assign(b, { x: 9, y: 7.6, hp: 1 });
    h.arms.sword = { kit: 'sword', quality: 'fine', traits: ['tempo'] };
    r.drops.push({ id: 77, x: 10.5, y: 9.2, item: { kit: 'greatsword', quality: 'forged', traits: ['riposte', 'ember'] }, life: 40 });
    r.drops.push({ id: 78, x: 9.1, y: 9.3, item: { kit: 'longbow', quality: 'fine', traits: ['deadeye'] }, life: 40 });
  });
  await page.waitForTimeout(600);
  await page.screenshot({ path: 'shots/loot-card-other.png' });
  await page.evaluate(() => Object.assign(window.__room.heroes[0], { x: 10.4, y: 9.2 }));
  await page.waitForTimeout(400);
  await page.screenshot({ path: 'shots/loot-shut.png' });
  // (The card opens only when asked for: LOOK, a tap on the drop, or F. lootcard.ts.)
  await page.evaluate(() => window.__loot.open(window.__loot.near));
  await page.waitForTimeout(400);
  await page.screenshot({ path: 'shots/loot-card.png' });
  const btn = await page.locator('#loot button.primary').boundingBox();
  await page.touchscreen.tap(btn.x + btn.width / 2, btn.y + btn.height / 2);
  await page.waitForTimeout(400);
  console.log(await page.evaluate(() => { const h = window.__room.heroes[0]; return h.weapon + ' ' + JSON.stringify(h.arms.greatsword) + ' | ' + document.querySelector('#hud').innerText.replace(/\n/g, ' / '); }));
  console.log('errors', JSON.stringify(errors));
  await browser.close();
})();
