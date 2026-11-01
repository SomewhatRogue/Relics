// Sound check: unlocks audio, walks through town, a building, a run and a boss; prints the music
// playing in each and any page errors (the ears are Kyle's).
const { chromium } = require('playwright');
const url = process.argv[2] || 'http://localhost:4173/?hero=WARRIOR';
(async () => {
  const browser = await chromium.launch({ args: ['--autoplay-policy=no-user-gesture-required', '--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  const page = await browser.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  await page.goto(url);
  await page.waitForFunction(() => window.__game);
  await page.mouse.click(5, 400);
  const at = async (label, fn, arg) => {
    await page.evaluate(fn, arg);
    await page.waitForTimeout(1500);
    console.log(label.padEnd(10), await page.evaluate(() => window.__music.playing));
  };
  await at('town', () => {});
  await at('church', () => { const g = window.__game; g.enter(g.room.map.blocks.find((b) => b.door === 'church')); });
  await at('forge', () => { const g = window.__game; g.leave(); g.enter(g.room.map.blocks.find((b) => b.door === 'forge')); });
  await at('yard', () => window.__game.enterYard());
  for (const [kind, name] of [['village', 'Barrowby'], ['forest', "Hangman's Wood"], ['mine', 'The Copperdeep Shafts'], ['farm', "Tollan's Farm"], ['field', 'Lowfurrow Fields']])
    await at(kind, (a) => { const g = window.__game, j = g.jobs()[1]; g.startJob({ ...j, place: { name: 'X', kind: a, region: 'R', ruin: 1 }, objective: a === 'mine' ? 'hunt' : 'rescue', boss: 'SKARN', rooms: 1, seed: 5 }); }, kind);
  await page.evaluate(() => { const g = window.__game, j = g.jobs()[1]; g.startJob({ ...j, place: { name: 'X', kind: 'mine', region: 'R', ruin: 1 }, objective: 'hunt', boss: 'SKARN', rooms: 1, seed: 5 }); const b = g.room.enemies.find((e) => e.name); Object.assign(g.hero, { x: b.x, y: b.y + 3 }); });
  await page.waitForTimeout(3000);
  console.log('boss'.padEnd(10), await page.evaluate(() => window.__music.playing));
  console.log('errors', JSON.stringify(errors));
  await browser.close();
})();
