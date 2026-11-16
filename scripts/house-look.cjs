// The new look's houses on a job (docs/design/new-look-interiors.md, slice 4): start a village job and go into a few
// houses and barns. node scripts/house-look.cjs [url] [out prefix]   (LAPTOP=1 for a 1440x900 laptop, else a phone)
const { chromium } = require('playwright');
const [url = 'http://localhost:4173/?hero=WARRIOR', out = 'shots/house'] = process.argv.slice(2);
(async () => {
  const browser = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const errors = [];
  const ctx = process.env.LAPTOP ? { viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 } : { viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true };
  const page = await (await browser.newContext(ctx)).newPage();
  page.on('pageerror', (e) => errors.push(String(e)));
  await page.goto(`${url}${url.includes('?') ? '&' : '?'}look=3d&hd&street&day=0.9`);
  await page.waitForFunction(() => window.__game);
  await page.waitForTimeout(1200);
  await page.addStyleTag({ content: '#caption { display: none !important; }' });
  // Seeds in turn, each house in the job's first room, until four kinds of house are shot.
  const seen = new Set();
  for (let seed = 1; seed < 60 && seen.size < 4; seed++) {
    const doors = await page.evaluate((seed) => {
      const g = window.__game, j = g.jobs()[1];
      if (g.outside) g.leave();
      g.startJob({ ...j, place: { name: 'Barrowby', kind: 'village', region: 'Barrowfields', ruin: 1 }, objective: 'rescue', rooms: 2, seed });
      return g.room.map.blocks.map((b, i) => [i, b.door]).filter(([, d]) => d && !d.startsWith('side:'));
    }, seed);
    for (const [i] of doors) {
      if (seen.size >= 4) break;
      const name = await page.evaluate(([seed, i]) => {
        const g = window.__game;
        if (g.outside) g.leave();
        const b = g.room.map.blocks[i];
        if (!b || b.ruined || (b.burning ?? -1) >= 0) return null;
        g.enter(b);
        const m = g.room.map;
        return m.wallH ? `${m.name}|${m.w.toFixed(1)}x${m.h.toFixed(1)} wallH ${m.wallH}` : null;
      }, [seed, i]);
      if (!name || seen.has(name.split('|')[0])) continue;
      seen.add(name.split('|')[0]);
      await page.waitForTimeout(2500);
      await page.screenshot({ path: `${out}-${seen.size}.png` });
      console.log(seed, name);
    }
  }
  console.log('errors', JSON.stringify(errors));
  await browser.close();
})();
