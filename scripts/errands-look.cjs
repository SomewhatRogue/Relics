// The town errands on a phone (docs/design/town-quests.md): `node scripts/errands-look.cjs <tag> <class> [js] [ms]`.
// Opens the game with a new hero of <class> (the wood skipped), runs [js] in the page, waits [ms], and
// screenshots the phone into shots/errands-<tag>.png, with page errors printed. [ms] may be a list
// ("900,2600,4500"): a shot at each, errands-<tag>-1.png and on.
const { chromium } = require('playwright');
const [tag = 'town', cls = 'WARRIOR', js = '', ms = '1500'] = process.argv.slice(2);
(async () => {
  const browser = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true });
  const page = await ctx.newPage(), errors = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  await page.goto(`http://localhost:4173/?hero=${cls}`);
  await page.waitForFunction(() => typeof window.render_game_to_text === 'function');
  if (js) console.log('js:', JSON.stringify(await page.evaluate(js)));
  const times = ms.split(',').map(Number);
  let at = 0;
  for (const [i, t] of times.entries()) {
    await page.waitForTimeout(t - at), (at = t);
    await page.screenshot({ path: times.length > 1 ? `shots/errands-${tag}-${i + 1}.png` : `shots/errands-${tag}.png` });
  }
  console.log('errands', JSON.stringify(await page.evaluate(() => window.__game.profile.errands)));
  console.log('errors', JSON.stringify(errors));
  await browser.close();
})();
