// A lived-in world, slice 2: a job's ground strewn by what it is, one job per kind of place, flat and 2.5D.
// node scripts/scatter-look.cjs <url> <out prefix> [kind ...]
const { chromium } = require('playwright');
const url = process.argv[2] || 'http://localhost:4173/?hero=WARRIOR';
const out = process.argv[3] || 'shots/scatter';
const kinds = process.argv.slice(4).length ? process.argv.slice(4) : ['forest', 'marsh', 'river', 'field', 'village', 'mine'];
const PLACE = { forest: "Hangman's Wood", marsh: 'Sallow Carr', river: 'The Sheepwash', field: 'Lowfurrow Fields', village: 'Barrowby', mine: 'The Copperdeep Shafts', farm: "Tollan's Farm", ruins: 'Ketterby' };
const REGION = { forest: 'Greyhollow', marsh: 'Greyhollow', river: 'Barrowfields', field: 'Barrowfields', village: 'Barrowfields', mine: 'Copperdeep', farm: 'Barrowfields', ruins: 'Barrowfields' };
(async () => {
  const browser = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const errors = [];
  for (const look of ['flat', '3d']) {
    const page = await (await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true })).newPage();
    page.on('pageerror', (e) => errors.push(String(e)));
    await page.goto(url + (url.includes('?') ? '&' : '?') + 'look=' + look);
    await page.waitForFunction(() => window.__game);
    await page.addStyleTag({ content: '#caption { display: none !important; }' });
    for (const kind of kinds) {
      await page.evaluate(([kind, name, region]) => {
        const g = window.__game, j = g.jobs().find((q) => !q.exped && q.objective !== 'story' && !q.deep) ?? g.jobs()[0];
        g.startJob({ ...j, time: 'day', twist: 'none', place: { name, kind, region, ruin: 1 }, objective: 'hunt', rooms: 1, seed: 11 });
      }, [kind, PLACE[kind], REGION[kind]]);
      await page.waitForTimeout(2500);
      await page.screenshot({ path: `${out}-${look}-${kind}.png` });
      const name = await page.evaluate(() => window.__game.room.map.name + ' ' + window.__game.room.map.theme.floor);
      console.log(look, kind, name);
    }
  }
  console.log('errors', JSON.stringify(errors));
  await browser.close();
})();
