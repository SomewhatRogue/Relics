const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  const p = await (await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true })).newPage();
  await p.goto('http://localhost:4173/?hero=WARRIOR');
  await p.waitForFunction(() => typeof window.__openSpot === 'function' && window.__game);
  await p.evaluate(() => { const g = window.__game, pr = g.profile; pr.bag = [{ slot: 'weapon', kit: 'spear', quality: 'fine', traits: [] }, { slot: 'ring', quality: 'tolmouth', traits: [] }, { slot: 'armor', armor: 'medium', quality: 'forged', traits: [] }]; for (const x of [g.hero, ...g.room.heroes]) x.bag = [...pr.bag]; });
  await p.evaluate(() => document.getElementById('packbtn').click());
  await p.waitForTimeout(800);
  console.log(await p.evaluate(() => { const e = document.querySelector('#pack .bag .tile[data-src]'), out = []; for (const sh of document.styleSheets) for (const r of sh.cssRules) { try { if (r.selectorText && e.matches(r.selectorText) && (r.style.boxShadow || r.style.background || r.style.backgroundColor)) out.push(r.selectorText.slice(0, 140) + ' => ' + (r.style.boxShadow || r.style.background || r.style.backgroundColor).slice(0, 50)); } catch {} } return out.join('\n'); }));
  console.log(await p.evaluate(() => [...document.querySelectorAll('#pack .bag .tile[data-src]')].map((t) => { const c = getComputedStyle(t); return [t.style.cssText, c.boxShadow.slice(0, 90), c.borderImageSource.slice(0, 20), c.borderWidth, c.backgroundColor].join(' | '); }).join('\n')));
  await p.screenshot({ path: 'shots/ui-tier-before.png', clip: { x: 0, y: 0, width: 390, height: 420 } });
  await b.close();
})();
