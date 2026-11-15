// The townsfolk side on (docs/design/side-view.md slice 3), big: each look standing (the front), then walking
// east on the low and high beat (contact, passing) and walking west. Drawn by the game's own drawNpc
// (window.__npcArt), 4x, no lighting. Usage: node scripts/folk-look.cjs [url] [out.png]
const { chromium } = require('playwright');
const [url = 'http://localhost:4173/', out = 'shots/folk.png'] = process.argv.slice(2);

(async () => {
  const browser = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const page = await browser.newPage({ viewport: { width: 1400, height: 900 } });
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  await page.goto(url);
  await page.waitForFunction(() => window.__npcArt, null, { timeout: 30000 });
  const size = await page.evaluate(async () => {
    const LOOKS = ['smith', 'wright', 'priest', 'trainer', 'squire', 'healer', 'reeve', 'trader', 'farmer', 'villager', 'burner', 'elder', 'soldier', 'soldier2', 'guard', 'bard', 'ranger', 'rogue', 'mage', 'digger', 'survivor', 'foreman', 'labourer', 'labourer2'];
    const K = 4, W = 30, H = 44, PER = 4, ACROSS = 6;
    const cv = document.createElement('canvas');
    (cv.width = ACROSS * PER * W * K), (cv.height = Math.ceil(LOOKS.length / ACROSS) * (H + 6) * K);
    const g = cv.getContext('2d');
    g.imageSmoothingEnabled = false;
    g.fillStyle = '#4a4652';
    g.fillRect(0, 0, cv.width, cv.height);
    g.fillStyle = '#f0e8d0';
    g.font = '22px monospace';
    const img = (src) => new Promise((r) => { const i = new Image(); i.onload = () => r(i); i.src = src; });
    for (let i = 0; i < LOOKS.length; i++) {
      const l = LOOKS[i], x0 = (i % ACROSS) * PER * W * K, y0 = Math.floor(i / ACROSS) * (H + 6) * K;
      g.fillText(l, x0 + 8, y0 + 20);
      // (The bob's beat: floor(now * 7 + x) odd is high (passing), even low (contact); x is 0 here.)
      const frames = [await window.__npcArt(l, 0, false, 0.1), await window.__npcArt(l, 1, true, 0.05), await window.__npcArt(l, 1, true, 0.2), await window.__npcArt(l, -1, true, 0.05)];
      for (let f = 0; f < PER; f++) g.drawImage(await img(frames[f]), x0 + f * W * K, y0 + 6 * K, W * K, H * K);
    }
    cv.id = 'folkshot';
    cv.style.cssText = 'position:fixed;left:0;top:0;z-index:99999';
    document.body.append(cv);
    return { w: cv.width, h: cv.height };
  });
  await page.setViewportSize({ width: size.w, height: size.h });
  await page.locator('#folkshot').screenshot({ path: out });
  console.log(JSON.stringify({ size, errors: errors.slice(0, 12) }));
  await browser.close();
})();
