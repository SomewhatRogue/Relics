// A class's side view (docs/design/side-view.md) frame by frame, big: each look standing and walking
// toward you (the front, for comparison), then from the side standing, the walk's four poses east, one west,
// a strike east and a block. Drawn by the game's own drawHero (window.__heroArt), 4x, no lighting.
// Usage: node scripts/side-look.cjs [url] [out.png] [WARRIOR|RANGER|ROGUE|MAGE|HEALER]
const { chromium } = require('playwright');
const [url = 'http://localhost:4173/', out = 'shots/side.png', cls = 'WARRIOR'] = process.argv.slice(2);

(async () => {
  const browser = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const page = await browser.newPage({ viewport: { width: 1400, height: 900 } });
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  await page.goto(url);
  await page.waitForFunction(() => window.__heroArt, null, { timeout: 30000 });
  const size = await page.evaluate(async (cls) => {
    const K = 4, W = 40, H = 52, cols = ['FRONT', 'WALK S', 'SIDE', 'STEP 1', 'STEP 2', 'STEP 3', 'STEP 4', 'WEST', 'WIND', 'HIT', 'BLOCK'];
    const cv = document.createElement('canvas');
    (cv.width = cols.length * W * K), (cv.height = (3 * H + 10) * K);
    const g = cv.getContext('2d');
    g.imageSmoothingEnabled = false;
    g.fillStyle = '#4a4652';
    g.fillRect(0, 0, cv.width, cv.height);
    g.fillStyle = '#f0e8d0';
    g.font = '28px monospace';
    cols.forEach((c, i) => g.fillText(c, i * W * K + 8, 30));
    const img = (src) => new Promise((r) => { const i = new Image(); i.onload = () => r(i); i.src = src; });
    for (let look = 0; look < 3; look++) {
      const art = (hero, now, swing) => window.__heroArt({ cls, look, now, hero, swing }, W, H);
      // Warm the cape's trail up to a full walk (herolife.ts eases it on the wall clock).
      for (let k = 0; k < 20; k++) await art({ fx: 1, fy: 0, moving: true }, 0.1 * k);
      const frames = [
        await art({ fx: 0.2, fy: 1 }, 5),
        await art({ fx: 0, fy: 1, moving: true }, 2.05),
        await art({ fx: 1, fy: 0 }, 5),
        ...(await Promise.all([0, 1, 2, 3].map((k) => art({ fx: 1, fy: 0, moving: true }, 2.01 + k / 9)))),
        await art({ fx: -1, fy: 0, moving: true }, 2.01),
        await art({ fx: 1, fy: 0, act: 'attack', actT: 0.12 }, 5),
        await art({ fx: 1, fy: 0 }, 5, 0.6),
        await art({ fx: 1, fy: 0, blocking: true }, 5),
      ];
      for (let i = 0; i < frames.length; i++) g.drawImage(await img(frames[i]), i * W * K, (10 + look * H) * K, W * K, H * K);
    }
    cv.id = 'sideshot';
    cv.style.cssText = 'position:fixed;left:0;top:0;z-index:99999';
    document.body.append(cv);
    return { w: cv.width, h: cv.height };
  }, cls);
  await page.setViewportSize({ width: size.w, height: size.h });
  await page.locator('#sideshot').screenshot({ path: out });
  console.log(JSON.stringify({ size, errors: errors.slice(0, 12) }));
  await browser.close();
})();
