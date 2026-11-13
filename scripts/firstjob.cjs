// A fresh hero's first hour in town, on a phone (docs/design/town-quests.md; Kyle's playtest 2026-11-13):
// out of the wood, the runner, the trainer's first meeting, the first job on the board, won, and back.
// Usage: node scripts/firstjob.cjs [class] [url]   Shots into shots/first-<n>-<step>.png; state and page errors printed.
const { chromium } = require('playwright');
const cls = process.argv[2] || 'WARRIOR', url = process.argv[3] || 'http://localhost:4173/';
const IDX = { WARRIOR: 0, RANGER: 1, ROGUE: 2, MAGE: 3, HEALER: 4 }[cls];
(async () => {
  const browser = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true });
  const page = await ctx.newPage(), errors = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  let n = 0;
  const shot = async (step) => page.screenshot({ path: `shots/first-${++n}-${step}.png` });
  const state = async (step) => console.log(step, JSON.stringify(await page.evaluate(() => {
    const g = window.__game, p = g.profile;
    return { mode: g.mode, level: p.level, errands: p.errands, quests: p.quests, javelin: p.relics.find((r) => r.kind === 'javelin')?.charge, panel: document.querySelector('#panel h2')?.textContent ?? null, goal: document.querySelector('#banner')?.innerText?.replace(/\s+/g, ' ').slice(0, 140) ?? null };
  })));
  const until = async (fn, ms = 30000) => page.waitForFunction(fn, null, { timeout: ms });

  await page.goto(url);
  await until(() => window.__game && window.__title);
  await page.evaluate((c) => { window.__game.create(c, 'NEWCOMER'); document.getElementById('title').hidden = true; window.__title.open = false; }, cls);
  await page.waitForTimeout(500);
  await state('1 in the wood');
  // Out of the wood (its own end: the road panel, then town at the north gate).
  await page.evaluate(() => (window.__game.wood.done = true));
  await until(() => window.__game.mode === 'town');
  await page.waitForTimeout(600);
  await shot('road');
  await state('2 the road');
  await page.evaluate(() => document.querySelector('#panel button')?.click());
  // The runner: their line comes on the strip; tap it once it's up, then wait for the scene to end.
  await until(() => window.__game.profile.errands.told, 40000);
  await page.waitForTimeout(1200);
  await shot('runner');
  await page.evaluate(() => document.getElementById('caption')?.click());
  await until(() => !document.body.classList.contains('cutscene'), 20000);
  await page.waitForTimeout(3500);
  await shot('street');
  await state('3 after the runner');
  // The trainer's first meeting.
  await page.evaluate((i) => window.__openSpot('trainer', i), IDX);
  await page.waitForTimeout(500);
  await shot('trainer-first');
  await state('4 met the trainer');
  await page.evaluate(() => [...document.querySelectorAll('#panel button')].find((b) => b.textContent === 'CLOSE')?.click());
  // The street by the board: the QUEST row and the board's mark.
  await page.evaluate(() => Object.assign(window.__room.heroes[0], { x: 24.1, y: 18.5 }));
  await page.waitForTimeout(3600);
  await shot('quest-street');
  await state('5 first job in hand');
  await page.evaluate(() => window.__openSpot('board', 0));
  await page.waitForTimeout(500);
  await shot('board');
  const rows = await page.evaluate(() => [...document.querySelectorAll('#panel .jrow')].slice(0, 3).map((r) => r.innerText.replace(/\s+/g, ' ')));
  console.log('board rows', JSON.stringify(rows));
  // Take it, and win it.
  await page.evaluate(() => { const g = window.__game, j = g.jobs().find((x) => x.quest); document.querySelector('#panel')?.querySelector('button')?.blur(); window.__panel?.hide?.(); g.startJob(j); });
  await until(() => window.__game.mode === 'run');
  await page.waitForTimeout(1500);
  await shot('job');
  await state('6 on the job');
  await page.evaluate(() => window.__game.endForTest(true));
  await page.waitForTimeout(1500);
  await shot('won');
  await state('7 won');
  // Back to town from the results.
  await page.evaluate(() => [...document.querySelectorAll('#panel button, #result button, button')].find((b) => /TOWN|WICKHOLD|HOME|BACK/.test(b.textContent) && b.offsetParent)?.click());
  await until(() => window.__game.mode === 'town', 20000).catch(() => {});
  await page.waitForTimeout(3600);
  await shot('back-street');
  await state('8 back in town');
  await page.evaluate((i) => window.__openSpot('trainer', i), IDX);
  await page.waitForTimeout(500);
  await shot('trainer-back');
  await state('9 back at the trainer');
  console.log('errors', JSON.stringify(errors));
  await browser.close();
})();
