// Relics you can see, and the upgrade screens (2026-11-05), on a phone: a relic's moment as it's
// gained, the pack with its row of relics (NEW on one, then the empty slot pulsing), the trainer's
// SKILLS tab with its CARRY ONE fork, the KNACKS tab with PICK ONE, MOVES, and a tile opened.
// Usage: node scripts/upgradeui-look.cjs [url] [outdir]
const { chromium } = require('playwright');
const url = process.argv[2] || 'http://localhost:4431/';
const out = process.argv[3] || 'shots';

(async () => {
  const browser = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  await page.goto(url + '?look=flat');
  await page.waitForFunction(() => window.__game);
  await page.evaluate(() => { window.__game.create('WARRIOR', 'BRANNOCK'); document.getElementById('title').hidden = true; window.__title.open = false; });
  await page.waitForTimeout(300);
  await page.evaluate(() => window.__game.mode === 'wood' && window.__game.skipWood());
  await page.waitForTimeout(500);
  await page.evaluate(() => window.__panel.hide());
  // A relic picked up: the room's hero gets it, the save follows, the moment shows (with the first-relic tip).
  await page.evaluate(() => {
    const g = window.__game;
    g.profile.tally = false;
    g.profile.relicTip = false;
    g.hero.found = [...g.hero.found, { id: 'rshot01', kind: 'hook', tier: 1, el: '', charge: 4, v: 2 }];
  });
  await page.waitForTimeout(900);
  await page.screenshot({ path: `${out}/phone-relic-moment.png` });
  console.log('moment', JSON.stringify(await page.evaluate(() => window.__relicPop.last && { name: window.__relicPop.last.item.kind, tip: window.__relicPop.last.tip, carried: window.__relicPop.last.carried })));
  await page.evaluate(() => window.__relicPop.close());
  // The pack: the javelin carried, the hook on the shelf marked NEW.
  await page.evaluate(() => { window.__panel.hide(); window.__pack.toggle(true); });
  await page.waitForTimeout(300);
  await page.screenshot({ path: `${out}/phone-pack-relics.png` });
  // Tap the hook on the shelf: its card and CARRY.
  await page.tap('#pack [data-src="found:1"]').catch((e) => console.log('tap shelf', String(e).slice(0, 80)));
  await page.waitForTimeout(300);
  await page.screenshot({ path: `${out}/phone-pack-relic-card.png` });
  // Nothing carried: the empty slot pulses and says TAP.
  await page.evaluate(() => { const g = window.__game; g.profile.relic = ''; g.relicsChanged(); window.__pack.pick(null); });
  await page.waitForTimeout(400);
  await page.screenshot({ path: `${out}/phone-pack-empty-slot.png` });
  console.log('pack', JSON.stringify(await page.evaluate(() => ({ shelf: document.querySelectorAll('#pack .rshelf .tile').length, pulse: !!document.querySelector('#pack .rslot.pulse'), fresh: window.__game.profile.relicNew }))));
  await page.evaluate(() => window.__pack.toggle(false));
  // The trainer: level 7, gold, both of the first two skills known (CARRY ONE), a knack waiting.
  await page.evaluate(() => {
    const p = window.__game.profile;
    Object.assign(p, { level: 7, xp: Math.max(p.xp, 900), gold: 640, learned: ['skill'], taught: ['horn'], skill: 'horn', picks: 1, perks: ['w_wide'], drills: { power: 2, health: 1, technique: 1 } });
    window.__game.relicsChanged();
    localStorage.setItem('relic.upgrades.tab', 'skills');
  });
  await page.evaluate(() => { window.__game.profile.picks = 0; window.__openSpot('trainer', 0); });
  await page.waitForTimeout(500);
  await page.screenshot({ path: `${out}/phone-trainer-skills-fork.png` });
  await page.tap('#panel [data-tab="moves"]');
  await page.waitForTimeout(300);
  await page.screenshot({ path: `${out}/phone-trainer-moves.png` });
  await page.tap('#panel [data-tab="ranks"]');
  await page.waitForTimeout(300);
  await page.screenshot({ path: `${out}/phone-trainer-ranks.png` });
  await page.tap('#panel [data-tile="drill:power"]');
  await page.waitForTimeout(300);
  await page.screenshot({ path: `${out}/phone-trainer-detail.png` });
  await page.evaluate(() => { window.__game.profile.picks = 1; window.__panel.hide(); window.__openSpot('trainer', 0); });
  // (The trainer's line types in first; everything under it waits for it.)
  await page.waitForTimeout(2500);
  await page.screenshot({ path: `${out}/phone-trainer-knacks-fork.png` });
  const small = await page.evaluate(() => [...document.querySelectorAll('#panel button')].filter((b) => b.offsetParent && b.getBoundingClientRect().height < 44).map((b) => b.textContent.trim().slice(0, 24) + ' ' + Math.round(b.getBoundingClientRect().height)));
  console.log('under 44px', JSON.stringify(small));
  await page.tap('#panel .up-fork [data-tile]');
  await page.waitForTimeout(300);
  await page.screenshot({ path: `${out}/phone-knack-detail.png` });
  const wide = await page.evaluate(() => document.documentElement.scrollWidth);
  console.log('page width', wide);
  console.log('errors', JSON.stringify(errors));
  await browser.close();
})();
