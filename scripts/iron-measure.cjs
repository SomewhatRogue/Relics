const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  const p = await (await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true })).newPage();
  for (const cls of ['WARRIOR', 'MAGE']) {
    await p.goto(`http://localhost:4173/?hero=${cls}&barn=arena`);
    await p.waitForFunction(() => window.__game && window.__game.room && window.__game.room.map.name === 'THE GREAT BARN', null, { timeout: 20000 });
    await p.evaluate(() => Object.assign(window.__game.hero, { x: 6, y: 9.4, fy: -1 }));
    await p.waitForTimeout(1500);
    await p.evaluate(() => { const h = window.__game.hero; h.stamina = 45; });
    await p.waitForTimeout(200);
    console.log(cls, JSON.stringify(await p.evaluate(() => Object.fromEntries(['#hud .unit', '#hud .st', '#hud .ups', '#hud .buffs', '#banner', '#boss'].map((s) => { const r = document.querySelector(s)?.getBoundingClientRect(); return [s, r ? [Math.round(r.top), Math.round(r.bottom)] : null]; })))), await p.evaluate(() => document.querySelector('#hud .st').title));
    await p.screenshot({ path: `shots/ui-st-${cls}.png`, clip: { x: 0, y: 0, width: 390, height: 260 } });
  }
  await b.close();
})();
