// A territory on a phone and a laptop, flat and 2.5D (shared/territory.ts; docs/design/territories.md): the hero
// set down at each of its places in turn, at the height of the ground there, and a picture of each.
// Usage: node scripts/land-look.cjs [url] [outdir] [land] [looks: flat,3d] [map]
const { chromium } = require('playwright');
const url = process.argv[2] || 'http://localhost:4173/?hero=WARRIOR';
const out = process.argv[3] || 'shots';
const land = process.argv[4] || 'lowfurrow';
const looks = (process.argv[5] || 'flat,3d').split(',');
// Which of the territory's maps (from 0), and its spots: SPOTS['<land>'] for map 0, SPOTS['<land>:1'] for map 1.
const mapIndex = Number(process.argv[6] || 0), spotsKey = mapIndex ? `${land}:${mapIndex}` : land;
const SIZES = { phone: { viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true }, laptop: { viewport: { width: 1280, height: 800 }, deviceScaleFactor: 1 } };
// Where to stand, by territory: [name, x, y].
const SPOTS = {
  // Lowfurrow Fields, map 0 (THE FIELDS) and map 1 (THE RISE): shared/lowfurrowfields.ts, lowfurrowrise.ts.
  lowfurrow: [['in', 48, 107], ['camp', 45, 97], ['farcart', 66, 92], ['gate1', 48, 82], ['road', 48, 70], ['scarecrow', 66, 69], ['pond', 22, 53], ['rye', 31, 55], ['lynchet', 40, 63], ['hovel', 72, 53], ['loading', 40, 31], ['rick', 61, 28], ['drain', 48, 12], ['farbank', 48, 5]],
  'lowfurrow:1': [['in', 48, 99], ['foot', 40, 89], ['lanefoot', 41, 84], ['lane', 39, 76], ['lanebend', 43, 68], ['archers', 31, 78], ['orchard', 22, 74.5], ['barnyard', 66, 77], ['lanehead', 48, 60], ['gate', 50, 57.6], ['fold', 46, 43], ['hut', 63, 31], ['pond', 27, 33], ['brow', 50, 11]],
  knoll: [['in', 20, 42], ['field', 16, 30], ['face', 14, 23.5], ['steps', 10, 22.5], ['top', 14, 15.5], ['track', 26.5, 14], ['east', 29, 20], ['out', 24, 6]],
  hill: [['in', 22, 92], ['headland', 20, 83], ['gate1', 22, 79], ['lynchet1', 20, 72.5], ['strips', 16, 65], ['stooks', 22, 51], ['drain', 22, 45], ['lane', 22, 33], ['bank', 12, 34], ['barn', 33, 35], ['foldyard', 20, 14], ['out', 22, 4], ['slope1', 20, 70], ['bankslope', 10, 40], ['lanefoot', 19, 30], ['banklip', 27, 30], ['cages2', 15, 15.5], ['cages1', 15, 53]],
};

(async () => {
  const exe = require('fs').existsSync('/usr/bin/google-chrome') ? { executablePath: '/usr/bin/google-chrome' } : {};
  const browser = await chromium.launch({ ...exe, args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--no-sandbox'] });
  for (const look of looks) for (const [size, opts] of Object.entries(SIZES)) {
    const ctx = await browser.newContext(opts), page = await ctx.newPage(), errors = [];
    page.on('pageerror', (e) => errors.push(String(e)));
    page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
    await page.goto(`${url}&land=${land}&map=${mapIndex}${look === '3d' ? '&look=3d' : ''}`);
    await page.waitForFunction(() => window.__game && window.__game.room && window.__game.room.map && window.__game.room.map.stretches, null, { timeout: 60000 });
    await page.waitForTimeout(1500);
    for (const [name, x, y] of SPOTS[spotsKey] || []) {
      const at = await page.evaluate(([x, y]) => {
        const g = window.__game, r = g.room, m = r.map;
        let z = 0;
        for (const l of m.ledges || []) if (x > l.x && x < l.x + l.w && y > l.y && y < l.y + l.h) z = Math.max(z, l.lv || 1);
        Object.assign(g.hero, { x, y, z, hp: 9999, maxHp: 9999, safeT: 0 });
        return { z, stretch: g.run.stretch || 0, goal: window.render_game_to_text ? String(window.render_game_to_text()).slice(0, 160) : '' };
      }, [x, y]);
      await page.waitForTimeout(900);
      await page.screenshot({ path: `${out}/land-${land}${mapIndex ? mapIndex : ''}-${look}-${size}-${name}.png` });
      if (size === 'phone') console.log(look, name, JSON.stringify(at));
    }
    console.log(look, size, 'errors', JSON.stringify(errors.slice(0, 6)));
    await ctx.close();
  }
  await browser.close();
})();
