// Phone: hold RELIC, see the wheel, slide onto HOOK, let go; the hero should now carry the hook.
const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const page = await (await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true })).newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  await page.goto(process.argv[2] || 'http://localhost:4173/');
  await page.waitForFunction(() => window.__room);
  const touch = (type, x, y) => page.evaluate(([type, x, y]) => {
    const el = document.querySelector('.tb.relic');
    const t = new Touch({ identifier: 7, target: el, clientX: x, clientY: y });
    el.dispatchEvent(new TouchEvent(type, { touches: type === 'touchend' ? [] : [t], changedTouches: [t], bubbles: true, cancelable: true }));
  }, [type, x, y]);
  const r = await page.evaluate(() => { const b = document.querySelector('.tb.relic').getBoundingClientRect(); return [b.left + b.width / 2, b.top + b.height / 2]; });
  await touch('touchstart', r[0], r[1]);
  await page.waitForTimeout(400);
  const slot = await page.evaluate(() => { const s = document.querySelectorAll('#wheel .slot')[1].getBoundingClientRect(); return [s.left + s.width / 2, s.top + s.height / 2]; });
  await touch('touchmove', slot[0], slot[1]);
  await page.waitForTimeout(100);
  await page.screenshot({ path: 'shots/wheel.png' });
  await touch('touchend', slot[0], slot[1]);
  await page.waitForTimeout(200);
  console.log('relic now', await page.evaluate(() => window.__room.heroes[0].relic), 'button', await page.textContent('.tb.relic'));
  console.log('errors', JSON.stringify(errors));
  await browser.close();
})();
